# app/services/user_service.py
from firebase_admin import auth
from app.schemas.user import UserCreate, UserResponse
from fastapi import HTTPException
from google.cloud import firestore
import uuid
from datetime import datetime

# --- Helper Functions ---

def _get_docs_batch(db, collection_name: str, doc_ids: list):
    """
    Help function to fetch multiple documents by their IDs in batch.
    """
    if not doc_ids: return {}
    
    # Remove duplicate and empty IDs
    unique_ids = list(set([uid for uid in doc_ids if uid]))
    
    # Create list of references
    refs = [db.collection(collection_name).document(uid) for uid in unique_ids]
    
    # Fetch concurrently (1 network request only)
    docs = db.get_all(refs)
    
    return {doc.id: doc for doc in docs if doc.exists}

def _normalize_feed_item(db, item_data, author_map, current_user_id=None):
    """
    Help function to normalize data for each item in the feed.
    Handles common display logic for both original Posts and Reposts.
    """
    post_doc = item_data.get("post_doc")
    
    # If the original post has been deleted but still exists in the repost log -> Skip
    if not post_doc:
        return None

    p_data = post_doc.to_dict()
    author_id = p_data.get("author_id")
    author_info = author_map.get(author_id, {})
    
    # Get author information from the previously fetched map
    author_obj = None
    if author_info:
        a_data = author_info.to_dict()
        author_obj = {
            "uid": author_info.id,
            "username": a_data.get("username", "Unknown"),
            "full_name": a_data.get("full_name", ""),
            "avatar_url": a_data.get("avatar_url") or a_data.get("avatar")
        }

    # Display timestamp: 
    # - Original Post: use created_at of the post
    # - Repost: use timestamp at the time of repost (to sort timeline correctly)
    display_timestamp = item_data["timestamp"]

    # --- Flags & Context (Important for Repost UI) ---
    is_liked = False
    is_saved = False
    is_reposted = False  # Track repost status separately, distinct from whether the item *is* a repost action

    if current_user_id:
        post_ref = db.collection("posts").document(post_doc.id)
        
        # Check Like
        if post_ref.collection("likes").document(current_user_id).get().exists:
            is_liked = True
        
        # Check Repost (whether current user reposted this post)
        if post_ref.collection("reposts").document(current_user_id).get().exists:
            is_reposted = True
        
        # Check Save
        if post_ref.collection("saves").document(current_user_id).get().exists:
            is_saved = True

    return {
        # --- Core Post Data ---
        "post_id": post_doc.id,
        "content": p_data.get("content", ""),
        "media_urls": p_data.get("media_urls") or p_data.get("link_url", []),
        "created_at": p_data.get("created_at"), 
        "author_id": author_id,
        "author": author_obj,
        
        # --- Metadata ---
        "level": p_data.get("level", 0),
        "reply_to_id": p_data.get("reply_to_id"),
        "root_id": p_data.get("root_id"),
        
        # --- Counters ---
        "likes_count": p_data.get("likes_count", 0),
        "reposts_count": p_data.get("reposts_count", 0),
        "saves_count": p_data.get("saves_count", 0),
        "comments_count": p_data.get("comments_count", 0),
        
        # --- Flags ---
        "is_reposted": item_data["is_reposted"], # Whether this specific feed item IS a repost action
        "is_liked": is_liked, 
        "is_saved": is_saved,
        "is_reposted": is_reposted # Whether the current user HAS reposted this content
    }

# --- Main Service Functions ---
def get_users(db):
    users_ref = db.collection('users')
    users_stream = users_ref.stream()
    return [{"uid": doc.id, **doc.to_dict()} for doc in users_stream]

def get_user(db, user_id: str):
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        data = user.to_dict()
        # Map DB fields to Schema fields if necessary (though we plan to store snake_case locally)
        return {"uid": user.id, **data}
    return None

def get_user_by_email_admin(email: str):
    """
    Use Firebase Admin SDK to get user info from Auth (not Firestore)
    To check if this user registered with Google or Password
    """
    try:
        user_record = auth.get_user_by_email(email)
        return user_record
    except auth.UserNotFoundError:
        return None
    
def get_user_by_username(db, username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).limit(1)
    results = query.stream()
    for user in results:
        return {"uid": user.id, **user.to_dict()}
    return None

def create_user(db, user: UserCreate):
    # 1. Create User on Firebase Authentication
    try:
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.username, # Temporarily store username in display_name
            email_verified=True
        )
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered in Firebase Auth")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating user: {str(e)}")

    # 2. Get UID from Firebase response to use as Document ID
    user_id = user_record.uid
    
    # 3. Prepare data to save to Firestore
    # Initialize all new fields with defaults
    user_data = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or user.username, # Fallback
        "bio": None,
        "avatar_url": user.avatar_url,
        "is_active": True,
        "provider": "password",
        "created_at": datetime.now(),
        "followers_count": 0,
        "followings_count": 0,
        "blocks_count": 0,
        "reposts_count": 0,
        "saves_count": 0,
        "likes_count": 0,
        "notifications_count": 0,
        # "followers": [],
        # "following": []
    }

    user_ref = db.collection('users').document(user_id)
    
    # Check if document already exists (to prevent rare conflicts)
    if user_ref.get().exists:
         pass 

    user_ref.set(user_data)
    
    return {"uid": user_id, **user_data}

# Function to update user when logging in with Google for the first time (Sync User)
def sync_google_user(db, decoded_token):
    # Get information from Google's Token
    uid = decoded_token['uid']
    email = decoded_token.get('email')
    name = decoded_token.get('name', '')
    picture = decoded_token.get('picture', None)

    # Create a random Username (Because Google doesn't have username)
    base_username = email.split('@')[0]
    username = f"{base_username}_{uuid.uuid4().hex[:4]}"

    # Prepare data
    user_data = {
        "username": username,
        "email": email,
        "full_name": name,
        "bio": None,
        "avatar_url": picture,
        "is_active": True,
        "provider": "google",
        "created_at": datetime.now(),
        "followers_count": 0,
        "followings_count": 0,
        "blocks_count": 0,
        "reposts_count": 0,
        "saves_count": 0,
        "likes_count": 0,
        "notifications_count": 0,
        # "followers": [],
        # "following": []
    }
    
    # Save to Firestore here
    db.collection('users').document(uid).set(user_data)
    
    return {"uid": uid, **user_data}

def follow_user(db, current_user_id:str, target_user_id:str):
    """
    1. Add target_user_id to current_user's following sub-collection
    2. Add current_user_id to target_user's followers sub-collection
    3. Update counts
    4. Trigger notification
    """
    from app.services.notification_service import NotificationService
    from app.schemas.user_interactions import NotificationCreate

    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself.")
    
    target_ref = db.collection('users').document(target_user_id)
    current_ref = db.collection('users').document(current_user_id)

    # Check existence of target user
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="Target user not found.")
    
    batch = db.batch()

    timestamp = datetime.utcnow().isoformat()

    # 1. Add to current_user's following list (Sub-collection)
    # users/{current_user_id}/followings/{target_user_id}
    current_following_ref = current_ref.collection("followings").document(target_user_id)
    batch.set(current_following_ref, {"user_id": target_user_id, "created_at": timestamp})

    # 2. Add to target_user's followers list (Sub-collection)
    # users/{target_user_id}/followers/{current_user_id}
    target_follower_ref = target_ref.collection("followers").document(current_user_id)
    batch.set(target_follower_ref, {"user_id": current_user_id, "created_at": timestamp})

    # Update counts (keep using counters on main doc for performance)
    batch.update(current_ref, {
        "followings_count": firestore.Increment(1)
    })

    batch.update(target_ref, {
        "followers_count": firestore.Increment(1)
    })
    
    # Also update the arrays for backward compatibility if needed, OR remove them if we fully migrate.
    # The prompt implies we should "update all interaction api that affect to all that collection".
    # I will maintain arrays for safety unless explicitly told otherwise, but the prompt emphasizes sub-collections.
    # "Create schemas for all the sub-collection below... update all interaction api that affect to all that collection."
    # I'll Assume we can stop updating the arrays 'following' and 'followers' field on the user doc if we want to be pure, 
    # but the UserResponse still has them. I will try to keep them in sync if possible or just rely on sub-collections.
    # Given the schemas in `user.py` still have `followers: List[str]`, I should probably keep them or update `user.py`.
    # For now, I will ONLY update sub-collections as requested and counts. Arrays might become stale.
    # actually, let's keep arrays in sync for now to avoid breaking clients that read them.
    batch.update(current_ref, {
        "following": firestore.ArrayUnion([target_user_id])
    })
    batch.update(target_ref, {
        "followers": firestore.ArrayUnion([current_user_id])
    })

    try:
        batch.commit()
        
        # 4. Trigger Notification
        NotificationService.create_notification(
            user_id=target_user_id,
            notification_data=NotificationCreate(
                type="follow",
                sender_id=current_user_id
            )
        )

        return {"status": "success", "message": f"User {current_user_id} followed {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error following user: {str(e)}")
    
def unfollow_user(db, current_user_id:str, target_user_id:str):
    """
    1. Remove from sub-collections
    2. Update counts
    """

    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot unfollow yourself.")
    
    target_ref = db.collection('users').document(target_user_id)
    current_ref = db.collection('users').document(current_user_id)

    # Check existence of target user
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="Target user not found.")
    
    batch = db.batch()

    # 1. Remove from sub-collections
    current_following_ref = current_ref.collection("followings").document(target_user_id)
    batch.delete(current_following_ref)

    target_follower_ref = target_ref.collection("followers").document(current_user_id)
    batch.delete(target_follower_ref)

    # Update counts
    batch.update(current_ref, {
        "followings_count": firestore.Increment(-1)
    })

    batch.update(target_ref, {
        "followers_count": firestore.Increment(-1)
    })

    # Sync arrays
    batch.update(current_ref, {
        "following": firestore.ArrayRemove([target_user_id])
    })
    batch.update(target_ref, {
        "followers": firestore.ArrayRemove([current_user_id])
    })
    
    try:
        batch.commit()
        return {"status": "success", "message": f"User {current_user_id} unfollowed {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error unfollowing user: {str(e)}")
    
def get_user_profile(db, username: str, current_user_id: str = None):
    """
    Logic get user profile by username, including their posts and reposts.
    """

    #  Get Target User Info
    user_data = get_user_by_username(db, username)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_uid = user_data['uid']
    raw_feed = [] 

    # Gather posts and reposts 
    posts_ref = db.collection('posts')\
                  .where('author_id', '==', target_uid)\
                  .order_by('created_at', direction=firestore.Query.DESCENDING)\
                  .limit(50)
    
    for doc in posts_ref.stream():
        raw_feed.append({
            "is_reposted": False,
            "timestamp": doc.get("created_at"),
            "post_doc": doc,                    
            "post_id": doc.id,
            "reposted_by": None
        })

    reposts_ref = db.collection('users').document(target_uid)\
                    .collection('activity_reposts')\
                    .order_by('created_at', direction=firestore.Query.DESCENDING)\
                    .limit(50)
    
    repost_items = []
    for doc in reposts_ref.stream():
        data = doc.to_dict()
        original_post_id = data.get('post_id') 
        
        repost_items.append({
            "is_reposted": True,
            "timestamp": data.get("created_at"), 
            "post_id": original_post_id,
            "repost_id": doc.id,
            "reposted_by": target_uid,           
            "post_doc": None                     
        })

    # Fetch post and reposts details
    
    if repost_items:
        repost_ids = [item['post_id'] for item in repost_items if item['post_id']]
        fetched_posts_map = _get_docs_batch(db, "posts", repost_ids)
        
        for item in repost_items:
            if item['post_id'] in fetched_posts_map:
                item['post_doc'] = fetched_posts_map[item['post_id']]
                raw_feed.append(item) # Only add if the original post still exists

    # Fetch author information for the entire feed
    author_ids = set()
    for item in raw_feed:
        if item.get("post_doc"):
            p_data = item["post_doc"].to_dict()
            if p_data.get("author_id"):
                author_ids.add(p_data.get("author_id"))
    
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    # Sort final feed by timestamp descending
    raw_feed.sort(key=lambda x: x["timestamp"], reverse=True)

    final_posts = []
    for item in raw_feed:
        normalized_item = _normalize_feed_item(db, item, authors_map, current_user_id)
        if normalized_item:
            final_posts.append(normalized_item)

    # Check follow status
    is_following = False
    is_self = False

    if current_user_id:
        if current_user_id == target_uid:
            is_self = True
        elif db.collection('users').document(current_user_id).collection('followings').document(target_uid).get().exists:
            is_following = True

    # Validating and formatting user data with UserResponse schema
    # This ensures all fields (like followers, following, counts) are returned with defaults if missing
    user_obj = UserResponse.model_validate(user_data)
    final_user_data = user_obj.model_dump()
    
    final_user_data["is_following"] = is_following
    final_user_data["is_self"] = is_self # Check if viewing own profile

    return {
        "user": final_user_data,
        "posts": final_posts,
        "posts_count": len(final_posts)
    }
def get_user_posts_paginated(db, author_id: str, limit: int = 10, last_post_id: str = None):
    """
    [API Tab 1] Lấy danh sách bài viết gốc của user (có phân trang).
    """
    posts_ref = db.collection('posts')
    
    # 1. Query cơ bản
    query = posts_ref.where('author_id', '==', author_id)\
                     .order_by('created_at', direction=firestore.Query.DESCENDING)

    # 2. Xử lý Cursor
    if last_post_id:
        last_doc = posts_ref.document(last_post_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    query = query.limit(limit)
    docs = list(query.stream()) # Lấy metadata trước

    if not docs:
        return {"items": [], "next_cursor": None, "has_more": False}

    # 3. Batch Fetch Author (Quan trọng: Để hiển thị avatar/tên)
    # Vì là bài gốc của author_id nên thực ra chỉ có 1 author, nhưng dùng logic chung cho chuẩn
    author_ids = {d.get("author_id") for d in docs}
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    # 4. Normalize dữ liệu (Để khớp với UI component)
    results = []
    for doc in docs:
        item_input = {
            "post_doc": doc,
            "timestamp": doc.get("created_at"),
            "is_reposted": False,
            "reposted_by": None
        }
        # Tái sử dụng hàm _normalize_feed_item có sẵn
        normalized = _normalize_feed_item(db, item_input, authors_map)
        if normalized:
            results.append(normalized)

    return {
        "items": results,
        "next_cursor": docs[-1].id if docs else None,
        "has_more": len(docs) == limit
    }

def get_user_reposts_paginated(db, author_id: str, limit: int = 10, last_repost_id: str = None):
    """
    [API Tab 2] Lấy danh sách bài Repost (có phân trang).
    Cursor: ID của document trong sub-collection 'activity_reposts'.
    """
    # 1. Query vào Sub-collection
    reposts_ref = db.collection('users').document(author_id).collection('activity_reposts')
    
    query = reposts_ref.order_by('created_at', direction=firestore.Query.DESCENDING)

    # 2. Xử lý Cursor (Lưu ý: Cursor là ID của repost activity, ko phải post_id gốc)
    if last_repost_id:
        last_doc = reposts_ref.document(last_repost_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    query = query.limit(limit)
    repost_docs = list(query.stream())

    if not repost_docs:
        return {"items": [], "next_cursor": None, "has_more": False}

    # 3. Batch Fetch nội dung bài viết gốc
    post_ids = [d.get("post_id") for d in repost_docs]
    fetched_posts_map = _get_docs_batch(db, "posts", post_ids)

    # 4. Batch Fetch Author của các bài viết gốc đó
    author_ids = set()
    valid_items = []

    for r_doc in repost_docs:
        pid = r_doc.get("post_id")
        if pid in fetched_posts_map:
            post_doc = fetched_posts_map[pid]
            # Lưu lại ID tác giả bài gốc để fetch
            author_ids.add(post_doc.get("author_id"))
            valid_items.append({
                "repost_doc": r_doc,
                "post_doc": post_doc
            })
    
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    # 5. Normalize
    results = []
    for item in valid_items:
        # Với Repost, timestamp hiển thị là lúc Repost
        repost_timestamp = item["repost_doc"].get("created_at")
        
        item_input = {
            "post_doc": item["post_doc"],
            "timestamp": repost_timestamp, 
            "is_reposted": True,
            "reposted_by": author_id,
            "repost_id": item["repost_doc"].id
        }
        
        normalized = _normalize_feed_item(db, item_input, authors_map)
        if normalized:
            results.append(normalized)

    return {
        "items": results,
        "next_cursor": repost_docs[-1].id if repost_docs else None, # Trả về ID activity
        "has_more": len(repost_docs) == limit
    }