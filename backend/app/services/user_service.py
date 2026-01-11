# app/services/user_service.py
from firebase_admin import auth
from app.schemas.user import UserCreate, UserResponse, UserUpdate
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
        "is_repost_item": item_data.get("is_reposted", False), # Whether this specific feed item IS a repost action
        "is_liked": is_liked, 
        "is_saved": is_saved,
        "is_reposted": is_reposted, # Whether the current user HAS reposted this content
        "repost_info": {
            "reposted_by": author_map.get(item_data.get("reposted_by")).to_dict() if item_data.get("reposted_by") and item_data.get("reposted_by") in author_map else None,
            "reposted_at": item_data.get("timestamp")
        } if item_data.get("is_reposted") else None
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
        raise HTTPException(status_code=400, detail="Email already registered")
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
    


def update_user(db, user_id: str, user_update: UserUpdate):
    """
    Update user profile information
    """
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    if not update_data:
        # Nothing to update, return current state
        return {"uid": user_id, **user_doc.to_dict()}
        
    user_ref.update(update_data)
    
    # Return updated user
    updated_doc = user_ref.get()
    return {"uid": user_id, **updated_doc.to_dict()}

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
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error unfollowing user: {str(e)}")

def block_user(db, current_user_id: str, target_user_id: str):
    """
    Block a user.
    1. Add to users/{current_user_id}/blocks/{target_user_id}
    2. Increment blocks_count
    3. FORCE UNFOLLOW both directions
    """
    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself.")
    
    current_ref = db.collection('users').document(current_user_id)
    target_ref = db.collection('users').document(target_user_id)
    
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    # Check if already blocked
    block_ref = current_ref.collection('blocks').document(target_user_id)
    if block_ref.get().exists:
        return {"status": "success", "message": "User already blocked"}

    batch = db.batch()
    timestamp = datetime.utcnow().isoformat()
    
    # 1. Add to blocks sub-collection
    batch.set(block_ref, {
        "user_id": target_user_id, 
        "created_at": timestamp
    })
    
    # 2. Increment blocks_count
    batch.update(current_ref, {
        "blocks_count": firestore.Increment(1)
    })
    
    # 3. Force Unfollow (Both directions)
    # Remove target from current's following
    batch.delete(current_ref.collection("followings").document(target_user_id))
    batch.delete(target_ref.collection("followers").document(current_user_id))
    
    # Remove current from target's following (Target following Current)
    batch.delete(target_ref.collection("followings").document(current_user_id))
    batch.delete(current_ref.collection("followers").document(target_user_id))

    # We should update counts if they were following, but checking existence inside a transaction/batch 
    # for counts conditionally is hard without transaction. 
    # Simplified approach: We accept counts might drift slightly OR we check first.
    # To be safe/clean: We just run the delete. If they weren't following, delete is no-op. 
    # BUT decrementing count blindly is bad.
    
    # Correct approach: Use individual helper functions or simple discrete checks?
    # Let's do a best-effort cleanup without risking negative counts weirdly, 
    # or just assume the `unfollow_user` logic is too heavy to call here inside a batch.
    # Let's just remove the relationships. The counts will be eventually consistent or require a recalc script.
    # OR: we can check "is_following" before batch?
    # Let's keep it simple: Just remove the relationship docs. 
    # Users will disappear from lists. Counts might be +1 off until next strict recount. 
    # For this project scope, it's acceptable vs complex transactions.
    # Note: `unfollow_user` logic does decr counters. We can call it? 
    # No, `unfollow_user` commits its own batch.
    
    # Let's manually decrement ONLY if we know they exist. 
    # Checking 2 reads is cheap.
    
    is_following_target = current_ref.collection("followings").document(target_user_id).get().exists
    is_followed_by_target = target_ref.collection("followings").document(current_user_id).get().exists
    
    if is_following_target:
         batch.update(current_ref, {"followings_count": firestore.Increment(-1)})
         batch.update(target_ref, {"followers_count": firestore.Increment(-1)})
         # Update arrays
         batch.update(current_ref, {"following": firestore.ArrayRemove([target_user_id])})
         batch.update(target_ref, {"followers": firestore.ArrayRemove([current_user_id])})

    if is_followed_by_target:
         batch.update(target_ref, {"followings_count": firestore.Increment(-1)})
         batch.update(current_ref, {"followers_count": firestore.Increment(-1)})
         # Update arrays
         batch.update(target_ref, {"following": firestore.ArrayRemove([current_user_id])})
         batch.update(current_ref, {"followers": firestore.ArrayRemove([target_user_id])})

    try:
        batch.commit()
        return {"status": "success", "message": f"Blocked user {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error blocking user: {str(e)}")

def unblock_user(db, current_user_id: str, target_user_id: str):
    current_ref = db.collection('users').document(current_user_id)
    block_ref = current_ref.collection('blocks').document(target_user_id)
    
    if not block_ref.get().exists:
         return {"status": "success", "message": "User was not blocked"}
         
    batch = db.batch()
    batch.delete(block_ref)
    batch.update(current_ref, {
        "blocks_count": firestore.Increment(-1)
    })
    
    try:
        batch.commit()
        return {"status": "success", "message": f"Unblocked user {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error unblocking: {str(e)}")

def get_blocked_users(db, current_user_id: str):
    blocks = db.collection('users').document(current_user_id).collection('blocks').stream()
    blocked_ids = [b.id for b in blocks]
    
    if not blocked_ids:
        return []
        
    users_map = _get_docs_batch(db, "users", blocked_ids)
    results = []
    
    for uid, u_doc in users_map.items():
        if u_doc.exists:
            d = u_doc.to_dict()
            results.append({
                "uid": uid,
                "username": d.get("username", "Unknown"),
                "full_name": d.get("full_name", ""),
                "avatar_url": d.get("avatar_url"),
                "bio": d.get("bio")
            })
    return results

def get_user_posts_paginated(db, author_id: str, limit: int = 10, last_post_id: str = None, post_type: str = "posts", current_user_id: str = None):
    """
    [API Tab 1] Lấy danh sách bài viết gốc của user (có phân trang).
    post_type: 'posts' (default - no replies), 'replies', 'media', 'all'
    """
    posts_ref = db.collection('posts')
    
    # 1. Query cơ bản
    query = posts_ref.where(filter=firestore.FieldFilter('author_id', '==', author_id))

    # OPTIMIZATION: Filter root posts directly in DB
    # Note: This requires a Firestore Composite Index: author_id (ASC) + reply_to_id (ASC) + created_at (DESC)
    if post_type == "posts":
        query = query.where(filter=firestore.FieldFilter('reply_to_id', '==', None))
        scan_limit = limit # DB handles filtering, so we don't need to over-fetch
    else:
        # Fallback for 'replies', 'media', 'all' which might not have specific indexes yet
        scan_limit = limit * 4 

    query = query.order_by('created_at', direction=firestore.Query.DESCENDING) 

    # 2. Xử lý Cursor
    if last_post_id:
        last_doc = posts_ref.document(last_post_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    query = query.limit(scan_limit)
    docs = list(query.stream()) # Lấy metadata trước

    if not docs:
        return {"items": [], "next_cursor": None, "has_more": False}

    # 3. Filter in memory
    filtered_docs = []
    last_scanned_doc = None
    
    for doc in docs:
        data = doc.to_dict()
        last_scanned_doc = doc
        
        is_reply = data.get("reply_to_id") is not None
        has_media = bool(data.get("media_urls")) or bool(data.get("link_url")) # fallback if any
        
        should_include = False
        if post_type == "all":
            should_include = True
        elif post_type == "posts":
            should_include = not is_reply
        elif post_type == "replies":
            should_include = is_reply
        elif post_type == "media":
            should_include = has_media
            
        if should_include:
            filtered_docs.append(doc)
            if len(filtered_docs) >= limit:
                break
    
    # Note: if we filtered out everything in this batch but there are more in DB, 
    # the frontend might see empty page but 'has_more' might technically be true if we verified DB.
    # However, with cursor pagination, we return the cursor of the last SCANNED item (or last Returned?).
    # If we return cursor of last *returned* item, we might skip checked-but-filtered items next time? 
    # NO: 'start_after' starts after the cursor doc.
    # If we return the cursor of the last *filtered* (valid) item, say item 10.
    # But item 11, 12 were scanned and rejected.
    # Next request starts after item 10. Item 11, 12 will be scanned AGAIN? 
    # Yes, efficiently we should return the cursor of the last *scanned* item effectively to skip them.
    # BUT client typically uses the last item in the list as cursor.
    # If we return a "next_cursor" explicitly, we can control this.
    
    next_cursor = None
    has_more = False
    
    if filtered_docs:
        # If we filled the limit
        if len(filtered_docs) == limit:
            # We stopped at filtered_docs[-1]. 
            # Was this the last item in 'docs'?
            if filtered_docs[-1].id == docs[-1].id:
                # We reached end of fetch. There might be more in DB.
                # Assuming simple efficient approach: just use last item ID.
                next_cursor = filtered_docs[-1].id
                has_more = True # Potential more
            else:
                 # We stopped early in the 'docs' list. Definitely more (the rest of 'docs')
                 next_cursor = filtered_docs[-1].id
                 has_more = True
        else:
            # We didn't fill limit.
            # Did we exhaust 'docs'?
            if len(docs) < scan_limit:
                 # We fetched everything available (less than scan limit request)
                 has_more = False
                 next_cursor = filtered_docs[-1].id
            else:
                 # We exhausted scan_limit but didn't fill requested limit.
                 # There are likely more in DB.
                 # We need to continue from the LAST SCANNED doc (docs[-1]), 
                 # BUT frontend uses the last ITEM as cursor usually.
                 # We must return a specific next_cursor.
                 has_more = True
                 next_cursor = docs[-1].id 
                 # WARNING: If we return `docs[-1].id` as cursor, but don't return `docs[-1]` in items,
                 # The frontend might be confused if it tries to find that item?
                 # Standard infinite scroll often uses `items[last].id`.
                 # If we return a hidden cursor, frontend must use `next_cursor` from response, not item[last].id.
                 pass

    # Simplified Logic for Cursor:
    # Always return `next_cursor` pointing to the last document we *processed* (scanned),
    # so next fetch starts after strictly.
    # BUT if we found items, we usually want to chain from the last item. 
    # Let's stick to: use the ID of the last item *considered* (scanned) as the continuation point
    # if we didn't finish.
    
    # Actually, to trigger "Next Page" correctly:
    # If we found `limit` items, we stop. The cursor for next page should be the ID of the last item in `results`.
    # Why? Because we want to start after *that* item.
    # What about the items between (scanned but rejected)? They are "before" the last item in sort order?
    # Query is DESC by created_at.
    # Docs: [A (valid), B (invalid), C (valid)]. Limit 2.
    # Result: [A, C].
    # Next fetch start after C.
    # B was skipped. Correct.
    
    # Case 2: [A (invalid), B (invalid), C (valid)]. Limit 1.
    # Result: [C].
    # Next start after C. A, B skipped. Correct.
    
    # Case 3: [A (invalid), ... Z (invalid)]. Batch 50. Results 0.
    # We return [], next_cursor = Z.id. has_more = True.
    # Frontend receives empty list but has_more.
    # It might trigger next fetch immediately or wait for user scroll (which won't happen if empty).
    # This is the "Empty Gap" problem.
    # For now, we assume user has mixed content and batch size 4x is enough to find *something*. 
    
    if filtered_docs:
        next_cursor = filtered_docs[-1].id
    elif docs:
        # We scanned docs but found nothing matching.
        # We must return the last scanned doc so client can continue searching.
        next_cursor = docs[-1].id
        
    items_to_fetch_author = filtered_docs

    # 4. Batch Fetch Author
    author_ids = {d.get("author_id") for d in items_to_fetch_author}
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    # 5. Normalize
    # 4. Batch Fetch Author (This part remains as it's needed for the items)
    author_ids = {d.get("author_id") for d in filtered_docs if d.get("author_id")} # Use filtered_docs here
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    # --- 4b. Batch Fetch Parent Posts (If post_type == 'replies') ---
    parent_posts_map = {}
    parent_authors_map = {}
    
    if post_type == "replies" and filtered_docs:
        # 1. Get IDs of parent posts
        parent_ids = {d.get("reply_to_id") for d in filtered_docs if d.get("reply_to_id")}
        
        # 2. Fetch parent posts
        if parent_ids:
            parent_posts_map = _get_docs_batch(db, "posts", list(parent_ids))
            
            # 3. Fetch authors of parent posts
            parent_author_ids = set()
            for p_doc in parent_posts_map.values():
                if p_doc.exists:
                    pa_id = p_doc.to_dict().get("author_id")
                    if pa_id:
                        parent_author_ids.add(pa_id)
            
            if parent_author_ids:
                parent_authors_map = _get_docs_batch(db, "users", list(parent_author_ids))

    # --- 4. Populate Interaction Status (Batch Fetch) ---
    final_items = []
    
    # Pre-fetch authors for ALL filtered docs
    author_ids = {d.get("author_id") for d in filtered_docs if d.get("author_id")}
    authors_map = _get_docs_batch(db, "users", list(author_ids))

    if current_user_id and filtered_docs:
        like_refs = []
        repost_refs = []
        save_refs = []
        
        # Prepare refs
        for doc in filtered_docs:
             pid = doc.id
             post_ref = db.collection("posts").document(pid)
             like_refs.append(post_ref.collection("likes").document(current_user_id))
             repost_refs.append(post_ref.collection("reposts").document(current_user_id))
             save_refs.append(post_ref.collection("saves").document(current_user_id))

        # Execute batches
        likes_snapshots = list(db.get_all(like_refs))
        reposts_snapshots = list(db.get_all(repost_refs))
        saves_snapshots = list(db.get_all(save_refs))
        
        # Map results
        likes_map = {snap.reference.parent.parent.id: snap.exists for snap in likes_snapshots}
        reposts_map = {snap.reference.parent.parent.id: snap.exists for snap in reposts_snapshots}
        saves_map = {snap.reference.parent.parent.id: snap.exists for snap in saves_snapshots}
        
        for doc in filtered_docs:
            data = doc.to_dict()
            pid = doc.id
            
            # Normalize keys to match Post model expected by FE
            item = data.copy()
            item["post_id"] = pid
            item["likes_count"] = data.get("likes_count") or data.get("likeCount", 0)
            item["reposts_count"] = data.get("reposts_count") or data.get("repostCount") or data.get("shareCount", 0)
            item["saves_count"] = data.get("saves_count") or data.get("saveCount", 0)
            item["comments_count"] = data.get("comments_count") or data.get("commentCount", 0)
            
            item["is_liked"] = likes_map.get(pid, False)
            item["is_reposted"] = reposts_map.get(pid, False)
            item["is_saved"] = saves_map.get(pid, False)
            
            # Ensure Author info is consistent if needed, but usually FE has it from Profile
            # But let's keep it robust
            
            # Inject Author Data
            author_id = data.get("author_id")
            if author_id and author_id in authors_map:
                 author_doc = authors_map[author_id]
                 item["author"] = author_doc.to_dict() if author_doc.exists else None
                 # Ensure uid checks
                 if item["author"]:
                     item["author"]["uid"] = author_id 
            else:
                 item["author"] = {"uid": author_id, "username": "Unknown", "full_name": "Unknown"}
            
            # Inject Parent Post (replies only)
            if post_type == "replies" and item.get("reply_to_id"):
                parent_id = item.get("reply_to_id")
                if parent_id in parent_posts_map:
                    p_doc = parent_posts_map[parent_id]
                    if p_doc.exists:
                        p_data = p_doc.to_dict()
                        parent_author_id = p_data.get("author_id")
                        parent_author = None
                        if parent_author_id and parent_author_id in parent_authors_map:
                             pa_doc = parent_authors_map[parent_author_id]
                             if pa_doc.exists:
                                 parent_author = pa_doc.to_dict()
                                 parent_author["uid"] = parent_author_id
                        
                        item["reply_to_post"] = {
                            "post_id": parent_id,
                            "content": p_data.get("content"),
                            "author": parent_author or {"username": "Unknown"},
                            "media_urls": p_data.get("media_urls"),
                            "created_at": p_data.get("created_at")
                        }

            final_items.append(item)
    else:
        # No user or no docs
        for doc in filtered_docs:
            data = doc.to_dict()
            item = data.copy()
            item["post_id"] = doc.id
            item["likes_count"] = data.get("likes_count") or data.get("likeCount", 0)
            item["reposts_count"] = data.get("reposts_count") or data.get("repostCount") or data.get("shareCount", 0)
            item["saves_count"] = data.get("saves_count") or data.get("saveCount", 0)
            item["comments_count"] = data.get("comments_count") or data.get("commentCount", 0)
            
            item["is_liked"] = False
            item["is_reposted"] = False
            item["is_saved"] = False
            
            # Inject Author Data (Copied logic)
            author_id = data.get("author_id")
            if author_id and author_id in authors_map:
                 author_doc = authors_map[author_id]
                 item["author"] = author_doc.to_dict() if author_doc.exists else None
                 if item["author"]:
                     item["author"]["uid"] = author_id 
            else:
                 item["author"] = {"uid": author_id, "username": "Unknown", "full_name": "Unknown"}
            
            # Inject Parent Post (replies only)
            if post_type == "replies" and item.get("reply_to_id"):
                parent_id = item.get("reply_to_id")
                if parent_id in parent_posts_map:
                    p_doc = parent_posts_map[parent_id]
                    if p_doc.exists:
                        p_data = p_doc.to_dict()
                        parent_author_id = p_data.get("author_id")
                        parent_author = None
                        if parent_author_id and parent_author_id in parent_authors_map:
                             pa_doc = parent_authors_map[parent_author_id]
                             if pa_doc.exists:
                                 parent_author = pa_doc.to_dict()
                                 parent_author["uid"] = parent_author_id
                        
                        item["reply_to_post"] = {
                            "post_id": parent_id,
                            "content": p_data.get("content"),
                            "author": parent_author or {"username": "Unknown"},
                            "media_urls": p_data.get("media_urls"),
                            "created_at": p_data.get("created_at")
                        }
            
            final_items.append(item)

    return {
        "items": final_items,
        "next_cursor": next_cursor,
        "has_more": len(docs) == scan_limit or (len(filtered_docs) == limit and len(docs) > len(filtered_docs))
    }


def get_user_profile(db, username: str, current_user_id: str = None):
    """
    Logic get user profile by username, including their posts and reposts.
    """

    #  Get Target User Info
    user_data = get_user_by_username(db, username)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_uid = user_data['uid']

    # Flags
    is_self = False
    is_following = False
    is_blocked_by_me = False
    is_blocking_me = False
    
    if current_user_id:
        is_self = (current_user_id == target_uid)
        
        if not is_self:
            # Check Following
            is_following = db.collection('users').document(current_user_id).collection('followings').document(target_uid).get().exists
            
            # Check Blocked By Me
            is_blocked_by_me = db.collection('users').document(current_user_id).collection('blocks').document(target_uid).get().exists

            # Check Blocking Me
            is_blocking_me = db.collection('users').document(target_uid).collection('blocks').document(current_user_id).get().exists
            
            if is_blocking_me:
                 raise HTTPException(status_code=404, detail="User not found")

    # Posts fetching (Paginated)
    final_posts = []
    next_cursor = None

    # Do not fetch contents if blocked
    if not is_blocked_by_me and not is_blocking_me:
        # OPTIMIZATION: Use the paginated fetcher to get the first page of "posts" only.
        posts_page = get_user_posts_paginated(
            db, 
            target_uid, 
            limit=10, 
            post_type="posts", 
            current_user_id=current_user_id
        )
        final_posts = posts_page.get("items", [])
        next_cursor = posts_page.get("next_cursor")

    # Validating and formatting user data with UserResponse schema
    # Fix count mismatch if array exists (Source of Truth for small lists)
    if user_data.get("following") and isinstance(user_data["following"], list):
        real_count = len(user_data["following"])
        if real_count != user_data.get("followings_count", 0):
             user_data["followings_count"] = real_count

    user_obj = UserResponse.model_validate(user_data)
    final_user_data = user_obj.model_dump()
    
    final_user_data["is_following"] = is_following
    final_user_data["is_self"] = is_self
    final_user_data["is_blocked_by_me"] = is_blocked_by_me
    final_user_data["is_blocking_me"] = is_blocking_me

    return {
        "user": final_user_data,
        "posts": final_posts,
        "posts_cursor": next_cursor, 
        "posts_count": len(final_posts)
    }

def get_user_reposts_paginated(db, author_id: str, limit: int = 10, last_repost_id: str = None, current_user_id: str = None):
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
    author_ids.add(author_id) # Add the profile owner (reposter) to be fetched
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
        
        normalized = _normalize_feed_item(db, item_input, authors_map, current_user_id)
        if normalized:
            results.append(normalized)

    return {
        "items": results,
        "next_cursor": repost_docs[-1].id if repost_docs else None, # Trả về ID activity
        "has_more": len(repost_docs) == limit
    }

def get_users_following(db, user_id: str, current_user_id: str = None):
    """
    Get list of users that the specified user is following.
    Returns a list of user objects.
    """
    user_ref = db.collection('users').document(user_id)
    
    # Check if user exists
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all following from sub-collection
    following_refs = user_ref.collection('followings').stream()
    following_ids = [doc.id for doc in following_refs]
    
    if not following_ids:
        return []
    
    # Batch fetch user details
    users_map = _get_docs_batch(db, 'users', following_ids)
    
    # Check is_following for current_user
    following_set = set()
    if current_user_id:
        current_following_refs = db.collection('users').document(current_user_id).collection('followings').stream()
        following_set = {doc.id for doc in current_following_refs}

    # Build response list
    result = []
    for uid, user_doc in users_map.items():
        if user_doc.exists:
            user_data = user_doc.to_dict()
            is_following = False
            if current_user_id:
               if uid == current_user_id:
                   # Self is not "following" self in the UI sense usually, or handled by UI
                   pass 
               elif uid in following_set:
                   is_following = True

            result.append({
                "uid": uid,
                "username": user_data.get("username", ""),
                "full_name": user_data.get("full_name", ""),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
                "is_following": is_following,
                "is_self": uid == current_user_id
            })
    
    return result

def get_users_following_paginated(db, user_id: str, limit: int = 10, cursor: str = None, current_user_id: str = None):
    """
    Get list of users that the specified user is following (Paginated).
    cursor: The ID of the last user item (from the sub-collection).
    """
    user_ref = db.collection('users').document(user_id)
    
    # Check if user exists
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Query sub-collection
    # Remove order_by('created_at') to ensure legacy data (without created_at) is also returned.
    # Default ordering is by Document ID.
    query = user_ref.collection('followings')
    
    if cursor:
        last_doc = user_ref.collection('followings').document(cursor).get()
        if last_doc.exists:
            query = query.start_after(last_doc)
            
    query = query.limit(limit)
    docs = list(query.stream())
    
    if not docs:
        return {"items": [], "next_cursor": None, "has_more": False}
        
    following_ids = [doc.id for doc in docs]
    
    # Batch fetch user details
    users_map = _get_docs_batch(db, 'users', following_ids)
    
    # Check is_following for current_user
    following_set = set()
    if current_user_id:
        current_following_refs = db.collection('users').document(current_user_id).collection('followings').stream()
        following_set = {doc.id for doc in current_following_refs}

    # Build response list
    items = []
    # Preserve order from docs
    for doc in docs:
        uid = doc.id
        user_doc = users_map.get(uid)
        
        if user_doc:
            user_data = user_doc.to_dict()
            is_following = False
            if current_user_id:
               if uid == current_user_id:
                   pass 
               elif uid in following_set:
                   is_following = True

            items.append({
                "uid": uid,
                "username": user_data.get("username", ""),
                "full_name": user_data.get("full_name", ""),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
                "is_following": is_following,
                "is_self": uid == current_user_id
            })
    
    return {
        "items": items,
        "next_cursor": docs[-1].id if docs else None,
        "has_more": len(docs) == limit
    }

def get_users_followers(db, user_id: str, current_user_id: str = None):
    """
    Get list of users who are following the specified user.
    Returns a list of user objects.
    """
    user_ref = db.collection('users').document(user_id)
    
    # Check if user exists
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all followers from sub-collection
    followers_refs = user_ref.collection('followers').stream()
    follower_ids = [doc.id for doc in followers_refs]
    
    if not follower_ids:
        return []
    
    # Batch fetch user details
    users_map = _get_docs_batch(db, 'users', follower_ids)
    
    # Check is_following for current_user
    following_set = set()
    if current_user_id:
        current_following_refs = db.collection('users').document(current_user_id).collection('followings').stream()
        following_set = {doc.id for doc in current_following_refs}

    # Build response list
    result = []
    for uid, user_doc in users_map.items():
        if user_doc.exists:
            user_data = user_doc.to_dict()
            
            is_following = False
            if current_user_id:
               if uid == current_user_id:
                   pass
               elif uid in following_set:
                   is_following = True

            result.append({
                "uid": uid,
                "username": user_data.get("username", ""),
                "full_name": user_data.get("full_name", ""),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
                "is_following": is_following,
                "is_self": uid == current_user_id
            })
    
    return result

def get_users_followers_paginated(db, user_id: str, limit: int = 10, cursor: str = None, current_user_id: str = None):
    """
    Get list of users who are following the specified user (Paginated).
    cursor: The ID of the last user item (from the sub-collection).
    """
    user_ref = db.collection('users').document(user_id)
    
    # Check if user exists
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Query sub-collection
    # Remove order_by('created_at') to ensure legacy data (without created_at) is also returned.
    query = user_ref.collection('followers')
    
    if cursor:
        last_doc = user_ref.collection('followers').document(cursor).get()
        if last_doc.exists:
            query = query.start_after(last_doc)
            
    query = query.limit(limit)
    docs = list(query.stream())
    
    if not docs:
        return {"items": [], "next_cursor": None, "has_more": False}
        
    follower_ids = [doc.id for doc in docs]
    
    # Batch fetch user details
    users_map = _get_docs_batch(db, 'users', follower_ids)
    
    # Check is_following for current_user
    following_set = set()
    if current_user_id:
        current_following_refs = db.collection('users').document(current_user_id).collection('followings').stream()
        following_set = {doc.id for doc in current_following_refs}

    # Build response list
    items = []
    # Preserve order
    for doc in docs:
        uid = doc.id
        user_doc = users_map.get(uid)
        
        if user_doc:
            user_data = user_doc.to_dict()
            is_following = False
            if current_user_id:
               if uid == current_user_id:
                   pass 
               elif uid in following_set:
                   is_following = True

            items.append({
                "uid": uid,
                "username": user_data.get("username", ""),
                "full_name": user_data.get("full_name", ""),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
                "is_following": is_following,
                "is_self": uid == current_user_id
            })
    
    return {
        "items": items,
        "next_cursor": docs[-1].id if docs else None,
        "has_more": len(docs) == limit
    }

def get_notifications(db, user_id: str, limit: int = 20, cursor: str = None, filter_type: str = "all"):
    """
    Get notifications for user (Paginated).
    filter_type: 'all', 'like', 'reply', 'repost', 'follow', 'mention'
    """
    notif_ref = db.collection('users').document(user_id).collection('notifications')
    
    query = notif_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
    
    if filter_type != "all":
        # Note: Requires composite index if combined with order_by created_at
        # filter_type might need to match exact strings in DB: 'like', 'comment', 'repost'
        query = query.where(filter=firestore.FieldFilter('type', '==', filter_type))
    
    if cursor:

        last_doc = notif_ref.document(cursor).get()
        if last_doc.exists:
             query = query.start_after(last_doc)
    
    query = query.limit(limit)
    docs = list(query.stream())
    
    if not docs:
         return {"items": [], "next_cursor": None, "has_more": False}
         
    # Collect Sender IDs
    sender_ids = set()
    for doc in docs:
        d = doc.to_dict()
        if d.get("sender_id"):
            sender_ids.add(d.get("sender_id"))
            
    # Batch fetch senders
    senders_map = _get_docs_batch(db, 'users', list(sender_ids))
    
    items = []
    
    for doc in docs:
        d = doc.to_dict()
        sender_id = d.get("sender_id")
        user_info = None
        
        if sender_id and sender_id in senders_map:
            u_doc = senders_map[sender_id]
            if u_doc.exists:
                ud = u_doc.to_dict()
                user_info = {
                    "uid": sender_id,
                    "username": ud.get("username", "Unknown"),
                    "full_name": ud.get("full_name", ""),
                    "avatar_url": ud.get("avatar_url")
                }
        
        if not user_info:
             user_info = {
                 "uid": sender_id or "unknown", 
                 "username": "Unknown", 
                 "full_name": "Unknown",
                 "avatar_url": None
             }
             
        # Format content/context based on type
        # Ideally we fetch post snippets too, but avoiding N+1 complexity for now.
        # Frontend might need minimal text.
        
        items.append({
            "id": doc.id,
            "type": d.get("type"),
            "user": user_info,
            "post_id": d.get("post_id"),
            "created_at": d.get("created_at"),
            "is_read": d.get("is_read", False),
            "content": d.get("preview_text") or "", # If we saved snippet
            "context_text": _get_notification_context_text(d.get("type"))
        })
        
    return {
        "items": items,
        "next_cursor": docs[-1].id if docs else None,
        "has_more": len(docs) == limit
    }

def _get_notification_context_text(n_type):
    if n_type == 'like': return "liked your post"
    if n_type == 'comment' or n_type == 'reply': return "replied to your post"
    if n_type == 'repost': return "reposted your post"
    if n_type == 'follow': return "followed you"
    if n_type == 'mention': return "mentioned you in a post"
    return "interacted with you"

def count_unread_notifications(db, user_id: str) -> int:
    """
    Count unread notifications for a user.
    """
    notif_ref = db.collection('users').document(user_id).collection('notifications')
    query = notif_ref.where(filter=firestore.FieldFilter('is_read', '==', False))
    
    # Efficient counting
    aggregate_query = query.count()
    results = aggregate_query.get()
    return results[0][0].value

def mark_all_notifications_read(db, user_id: str):
    """
    Mark all notifications as read for a user.
    """
    notif_ref = db.collection('users').document(user_id).collection('notifications')
    # Get all unread
    query = notif_ref.where(filter=firestore.FieldFilter('is_read', '==', False))
    docs = query.stream()
    
    batch = db.batch()
    count = 0
    for doc in docs:
        batch.update(doc.reference, {"is_read": True})
        count += 1
        if count >= 400: # Firestore batch limit is 500
            batch.commit()
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
    
    return True

def get_notification_stats(db, user_id: str):
    """
    Get statistics of user notifications.
    """
    notif_ref = db.collection('users').document(user_id).collection('notifications')
    
    # Total
    total = notif_ref.count().get()[0][0].value
    
    # By Type
    stats = {}
    types = ['like', 'reply', 'repost', 'mention', 'follow']
    
    # Optimized: if total is 0, return early
    if total == 0:
        return { "total": 0, "breakdown": {t: 0 for t in types} }

    # We could do this in parallel but simple loop is fine for <10 types
    for t in types:
        # Note: 'reply' logic in get_notifications handles 'comment' type mapping IF passing filter. 
        # But here we count what's in DB.
        # If DB has 'comment', we might miss it if we only count 'reply'.
        # Let's count 'reply' and 'comment' and merge into 'reply'
        
        count = notif_ref.where(filter=firestore.FieldFilter('type', '==', t)).count().get()[0][0].value
        stats[t] = count
        
    # Check for legacy 'comment' type
    comment_count = notif_ref.where(filter=firestore.FieldFilter('type', '==', 'comment')).count().get()[0][0].value
    stats['reply'] += comment_count
        
    return { "total": total, "breakdown": stats }

def get_notification_history(db, user_id: str, days: int = 7):
    """
    Get daily notification history for charts.
    """
    from datetime import datetime, timedelta
    
    # Notification dates are stored as Strings (ISO format) in NotificationService.
    # So we must compare with string.
    cutoff_dt = datetime.utcnow() - timedelta(days=days)
    cutoff = cutoff_dt.isoformat()
    
    notif_ref = db.collection('users').document(user_id).collection('notifications')
    # Filter by time string
    docs = notif_ref.where(filter=firestore.FieldFilter('created_at', '>=', cutoff)).stream()
    
    history_map = {}
    # Init last 'days' days
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        history_map[d] = {"date": d, "like": 0, "reply": 0, "repost": 0, "mention": 0, "follow": 0, "total": 0}
        
    for doc in docs:
        data = doc.to_dict()
        created_at = data.get('created_at')
        if not created_at: continue
        
        # Determine date string
        # created_at might be datetime or string. Assuming datetime from firestore or ISO string.
        # If firestore, it is a datetime object.
        date_str = ""
        if hasattr(created_at, 'strftime'):
             date_str = created_at.strftime("%Y-%m-%d")
        elif isinstance(created_at, str):
             date_str = created_at[:10]
             
        if date_str in history_map:
            t = data.get('type')
            if t == 'comment': t = 'reply'
            if t in history_map[date_str]:
                history_map[date_str][t] += 1
                history_map[date_str]['total'] += 1
                
    # Convert to sorted list
    result = sorted(history_map.values(), key=lambda x: x['date'])
    return result
