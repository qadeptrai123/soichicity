# from app.db.firebase import db
# from datetime import datetime
# import uuid
# import random

# class PostService:

#     @staticmethod
#     def create_post(user_id: str, content: str, link_url: str = None):
#         post_id = str(uuid.uuid4())
#         payload = {
#             "id": post_id,
#             "content": content,
#             "link_url": link_url,   # thêm đây
#             "created_at": datetime.utcnow().isoformat(),
#             "author_id": user_id
#         }
#         db.collection("posts").document(post_id).set(payload)
#         return payload

    
#     @staticmethod
#     def list_posts():
#         posts = db.collection("posts").order_by("created_at").stream()
#         result = [p.to_dict() for p in posts]
#         return result
    
#     @staticmethod
#     def get_feed_posts(user_id: str, limit: int = 20):

#         # 1) lấy danh sách post user đã xem
#         seen_ref = db.collection("users_seen_posts").document(user_id).get()
#         seen_posts = []
#         if seen_ref.exists:
#             seen_posts = seen_ref.to_dict().get("seen", [])

#         # 2) query tất cả posts
#         posts = db.collection("posts").stream()
#         result = [p.to_dict() for p in posts]

#         # 3) lọc ra bài mà user chưa xem
#         unseen = [p for p in result if p["id"] not in seen_posts]

#         # 4) random shuffle
#         random.shuffle(unseen)

#         # 5) giới hạn số lượng
#         return unseen[:limit]
    
#     @staticmethod
#     def mark_post_as_seen(user_id: str, post_id: str):
#         doc_ref = db.collection("users_seen_posts").document(user_id)
#         doc = doc_ref.get()

#         if doc.exists:
#             arr = doc.to_dict().get("seen", [])
#             if post_id not in arr:
#                 arr.append(post_id)
#                 doc_ref.update({"seen": arr})
#         else:
#             doc_ref.set({"seen": [post_id]})

from app.db.firebase import db, bucket
from datetime import datetime
import uuid
import random
import time  # Cần thêm để lấy timestamp dạng số (ms)
from google.cloud import firestore # Cần thêm để dùng Increment

class PostService:
    
    @staticmethod
    def upload_file(file, filename: str, content_type: str) -> str:
        blob = bucket.blob(f"posts/{uuid.uuid4()}_{filename}")
        blob.upload_from_file(file, content_type=content_type)
        blob.make_public()
        return blob.public_url

    @staticmethod
    def create_post(user_id: str, content: str, media_urls: list = None, level: int = 0, reply_to_id: str = None, root_id: str = None):
        if media_urls is None:
            media_urls = []
        elif isinstance(media_urls, str):
            media_urls = [media_urls]

        # Auto generated ID
        post_id = str(uuid.uuid4())
        
        # Determine root_id if not provided for replies (if level > 0 and root_id is None, maybe it should be passed? 
        # But if level 0, root_id is usuallly self or None. User said "Ref to Posts Collection".
        # Let's trust the caller to pass it correctly for replies. For root post, it's None or we can set it to post_id if desired.
        # Standard: Root post has level 0.
        
        payload = {
            "post_id": post_id, # DB field
            "content": content,
            "media_urls": media_urls, 
            "created_at": datetime.utcnow().isoformat(),
            "author_id": user_id,
            "level": level,
            "reply_to_id": reply_to_id,
            "root_id": root_id,
            
            # Counts
            "likes_count": 0,
            "reposts_count": 0,
            "saves_count": 0,
            "comments_count": 0
        }
        db.collection("posts").document(post_id).set(payload)
        return payload

    # --- NEW: Hàm xử lý chung cho Like, Share, Save (Sub-collections) ---
    # --- NEW: Hàm xử lý chung cho Like, Share, Save (Sub-collections) ---
    @staticmethod
    def toggle_interaction(collection_name: str, count_field: str, post_id: str, user_id: str, user_avatar: str = ""):
        """
        collection_name: 'likes', 'reposts', 'saves' (mapped from API)
        count_field: 'likes_count', 'reposts_count', 'saves_count'
        """
        from app.services.notification_service import NotificationService
        from app.schemas.user_interactions import NotificationCreate
        
        # Normalize collection name (shares -> reposts) to match schema "Sub-collection Repost"
        target_collection = collection_name
        if collection_name == "shares":
            target_collection = "reposts"

        # Determine User Activity Collection Name
        user_interaction_collection = target_collection # Default fallback
        if target_collection == "likes":
            user_interaction_collection = "activity_likes"
        elif target_collection == "reposts":
            user_interaction_collection = "activity_reposts"
        elif target_collection == "saves":
            user_interaction_collection = "activity_saves"
        
        post_ref = db.collection("posts").document(post_id)
        
        # Check if post exists
        post_snap = post_ref.get()
        if not post_snap.exists:
            raise ValueError(f"Post {post_id} not found")
            
        post_data = post_snap.to_dict()
        author_id = post_data.get("author_id")
        
        # Timestamp
        timestamp_iso = datetime.utcnow().isoformat()

        # 1. Post Sub-collection: posts/{post_id}/{target_collection}/{user_id}
        # Schema: user_id (PK), created_at
        post_interaction_ref = post_ref.collection(target_collection).document(user_id)
        
        # 2. User Sub-collection: users/{user_id}/{user_interaction_collection}/{post_id}
        user_interaction_ref = db.collection("users").document(user_id).collection(user_interaction_collection).document(post_id)
        
        doc = post_interaction_ref.get()
        
        if doc.exists:
            # --- REMOVE (Unlike, Unrepost, Unsave) ---
            post_interaction_ref.delete()
            user_interaction_ref.delete()
            post_ref.update({count_field: firestore.Increment(-1)})
            
            return {"status": "removed"}
        else:
            # --- ADD (Like, Repost, Save) ---
            
            # Save to Post Sub-collection
            post_interaction_ref.set({
                "user_id": user_id,
                "created_at": timestamp_iso
            })
            
            # Save to User Activity Sub-collection
            user_interaction_ref.set({
                "post_id": post_id,
                "created_at": timestamp_iso
            })
            
            post_ref.update({count_field: firestore.Increment(1)})
            
            # Trigger Notification (Only for Likes and Reposts)
            if target_collection in ["likes", "reposts"] and author_id and author_id != user_id:
                notif_type = "like" if target_collection == "likes" else "repost"
                
                NotificationService.create_notification(
                    user_id=author_id,
                    notification_data=NotificationCreate(
                        type=notif_type,
                        sender_id=user_id,
                        post_id=post_id
                    )
                )

            return {"status": "added"}

    # @staticmethod
    # def remove_interaction(collection_name: str, count_field: str, post_id: str, user_id: str):
    #     post_ref = db.collection("posts").document(post_id)
    #     sub_ref = post_ref.collection(collection_name).document(user_id)
        
    #     doc = sub_ref.get()
    #     if doc.exists:
    #         sub_ref.delete()
    #         post_ref.update({count_field: firestore.Increment(-1)})
    #         return {"status": "removed"}
    #     return {"status": "not_found"}

    # --- NEW: Hàm xử lý Comment ---
    @staticmethod
    def create_comment(post_id: str, user_id: str, user_avatar: str, content: str):
        # Check if post exists
        post_ref = db.collection("posts").document(post_id)
        if not post_ref.get().exists:
            raise ValueError(f"Post {post_id} not found")
        
        # Validate comment content
        if not content or len(content.strip()) == 0:
            raise ValueError("Comment content cannot be empty")
        
        # Comment dùng UUID vì 1 user có thể comment nhiều lần
        comment_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)
        
        payload = {
            "id": comment_id,
            "user_id": user_id,
            "user_avatar": user_avatar,
            "content": content,
            "timestamp": timestamp
        }
        
        # Lưu vào posts/{post_id}/comments/{comment_id}
        post_ref.collection("comments").document(comment_id).set(payload)
        
        # Lưu vào users/{user_id}/comments/{comment_id} (để track comments của user)
        # Không cần lưu comment_id vì đã có trong document ID
        user_comment_ref = db.collection("users").document(user_id).collection("comments").document(comment_id)
        user_comment_ref.set({
            "post_id": post_id,
            "content": content,
            "timestamp": timestamp
        })
        
        post_ref.update({"comments_count": firestore.Increment(1)})
        
        # Trigger Notification
        post_data = post_ref.get().to_dict()
        author_id = post_data.get("author_id")
        
        if author_id and author_id != user_id:
            from app.services.notification_service import NotificationService
            from app.schemas.user_interactions import NotificationCreate
            print("Triggering notification...")
            NotificationService.create_notification(
                user_id=author_id,
                notification_data=NotificationCreate(
                    type="comment",
                    sender_id=user_id,
                    post_id=post_id
                )
            )
        
        return payload

    @staticmethod
    def delete_comment(post_id: str, comment_id: str, user_id: str):
        post_ref = db.collection("posts").document(post_id)
        comment_ref = post_ref.collection("comments").document(comment_id)
        
        doc = comment_ref.get()
        if not doc.exists:
            return {"error": "Comment not found"}
            
        data = doc.to_dict()
        if data["user_id"] != user_id:
            return {"error": "Permission denied"}
            
        # Xóa ở posts/{post_id}/comments/{comment_id}
        comment_ref.delete()
        
        # Xóa ở users/{user_id}/comments/{comment_id}
        user_comment_ref = db.collection("users").document(user_id).collection("comments").document(comment_id)
        if user_comment_ref.get().exists:
            user_comment_ref.delete()
        
        post_ref.update({"comments_count": firestore.Increment(-1)})
        return {"status": "deleted"}

    @staticmethod
    def list_posts():
        posts = db.collection("posts").order_by("created_at").stream()
        result = [p.to_dict() for p in posts]
        return result
    
    @staticmethod
    def get_feed_posts(user_id: str = None, limit: int = 20):
        # Simply fetch all posts ordered by created_at desc
        posts = db.collection("posts").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        final_posts = []
        for p in posts:
            data = p.to_dict()
            # Mapping old fields to new if necessary (during migration phase or mixed data)
            # To be safe, we try to read new fields, fallback to old or default
            
            p_id = data.get("post_id") or data.get("id")
            
            # Normalize to new schema structure
            normalized = {
                "post_id": p_id,
                "content": data.get("content"),
                "media_urls": data.get("media_urls") or data.get("link_url", []),
                "created_at": data.get("created_at"),
                "author_id": data.get("author_id"),
                "level": data.get("level", 0),
                "reply_to_id": data.get("reply_to_id"),
                "root_id": data.get("root_id"),
                "likes_count": data.get("likes_count") or data.get("likeCount", 0),
                "reposts_count": data.get("reposts_count") or data.get("repostCount") or data.get("shareCount", 0),
                "saves_count": data.get("saves_count") or data.get("saveCount", 0),
                "comments_count": data.get("comments_count") or data.get("commentCount", 0),
            }
            final_posts.append(normalized)
        
        # 6) Populate author info
        for post in final_posts:
            author_id = post.get("author_id")
            if author_id:
                user_ref = db.collection("users").document(author_id).get()
                if user_ref.exists:
                    user_data = user_ref.to_dict()
                    post["author"] = {
                        "id": author_id,
                        "username": user_data.get("username", ""),
                        "full_name": user_data.get("full_name"),
                        "avatar": user_data.get("avatar_url") or user_data.get("avatar") or user_data.get("picture"),
                    }
        
        # 7) Populate interaction status (is_liked, is_shared, is_reposted, is_saved)
        # Note: This performs N*4 reads per request. Optimize by batching or denormalizing if scale increases.
        for post in final_posts:
            if user_id:
                p_id = post["post_id"]
                # Use standard collection names in posts for checking status logic
                post_ref = db.collection("posts").document(p_id)
                
                # Check Like
                if post_ref.collection("likes").document(user_id).get().exists:
                    post["is_liked"] = True
                else:
                     post["is_liked"] = False
                     
                # Check Repost (checks 'reposts' sub-collection)
                if post_ref.collection("reposts").document(user_id).get().exists:
                    post["is_reposted"] = True
                else:
                     post["is_reposted"] = False
                     
                # Check Save
                if post_ref.collection("saves").document(user_id).get().exists:
                    post["is_saved"] = True
                else:
                     post["is_saved"] = False
            else:
                # Guest user -> all false
                post["is_liked"] = False
                post["is_reposted"] = False
                post["is_saved"] = False

        return final_posts
    
    @staticmethod
    def mark_post_as_seen(user_id: str, post_id: str):
        # Giữ nguyên logic cũ của bạn (lưu vào users_seen_posts)
        doc_ref = db.collection("users_seen_posts").document(user_id)
        doc = doc_ref.get()

        if doc.exists:
            arr = doc.to_dict().get("seen", [])
            if post_id not in arr:
                arr.append(post_id)
                doc_ref.update({"seen": arr})
        else:
            doc_ref.set({"seen": [post_id]})

    @staticmethod
    def get_post_detail(post_id: str, current_user_id: str = None, page: int = 1, page_size: int = 10):
        """
        Fetch complete post detail with:
        - Post metadata
        - Author info (join with users collection)
        - Paginated comments
        - Likes & reposts lists
        - Current user's interaction status
        """
        # 1) Get post data
        post_doc = db.collection("posts").document(post_id).get()
        if not post_doc.exists:
            return None
        
        post_data = post_doc.to_dict()
        author_id = post_data.get("author_id")
        
        # 2) Fetch author info
        author_doc = db.collection("users").document(author_id).get()
        author_data = {
            "id": author_id,
            "username": "Unknown",
            "avatar": None,
            "full_name": None
        }
        if author_doc.exists:
            user_info = author_doc.to_dict()
            author_data = {
                "id": author_id,
                "username": user_info.get("username", "Unknown"),
                "avatar": user_info.get("avatar"),
                "full_name": user_info.get("full_name")
            }
        
        # 3) Fetch paginated comments with validation
        comments_ref = db.collection("posts").document(post_id).collection("comments")
        
        # Validate pagination params
        page = max(1, page)
        page_size = min(100, max(1, page_size))  # Limit page_size to 100
        
        # Count total comments
        total_comments = sum(1 for _ in comments_ref.stream())
        
        # Calculate skip
        skip = (page - 1) * page_size
        
        # Fetch comments with pagination
        comments_query = comments_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).offset(skip).limit(page_size)
        comments_docs = comments_query.stream()
        comments_list = [doc.to_dict() for doc in comments_docs]
        
        # Calculate total pages
        total_pages = (total_comments + page_size - 1) // page_size if total_comments > 0 else 1
        
        comments_data = {
            "items": comments_list,
            "total": total_comments,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
        # 4) Fetch likes & reposts lists (user IDs)
        likes_docs = db.collection("posts").document(post_id).collection("likes").stream()
        likes_list = [doc.id for doc in likes_docs]
        
        reposts_docs = db.collection("posts").document(post_id).collection("reposts").stream()
        reposts_list = [doc.id for doc in reposts_docs]
        
        # 5) Check current user's interaction status
        user_interaction = {
            "is_liked": False,
            "is_shared": False,
            "is_reposted": False,
            "is_saved": False
        }
        
        if current_user_id:
            # Check if current user liked
            if db.collection("posts").document(post_id).collection("likes").document(current_user_id).get().exists:
                user_interaction["is_liked"] = True
            
            # Check if current user shared
            # Check if current user shared/reposted (Both map to 'reposts' collection now)
            if db.collection("posts").document(post_id).collection("reposts").document(current_user_id).get().exists:
                user_interaction["is_reposted"] = True
                user_interaction["is_shared"] = True # Legacy support
            
            # Check if current user saved
            if db.collection("posts").document(post_id).collection("saves").document(current_user_id).get().exists:
                user_interaction["is_saved"] = True
        
        # 6) Build response
        response = {
            "post_id": post_data.get("post_id") or post_data.get("id"),
            "content": post_data.get("content"),
            "media_urls": post_data.get("media_urls") or post_data.get("link_url", []),
            "created_at": post_data.get("created_at"),
            "level": post_data.get("level", 0),
            "reply_to_id": post_data.get("reply_to_id"),
            "root_id": post_data.get("root_id"),
            
            "author": author_data,
            
            "likes_count": post_data.get("likes_count") or post_data.get("likeCount", 0),
            "reposts_count": post_data.get("reposts_count") or post_data.get("repostCount") or post_data.get("shareCount", 0),
            "saves_count": post_data.get("saves_count") or post_data.get("saveCount", 0),
            "comments_count": post_data.get("comments_count") or post_data.get("commentCount", 0),
            
            "comments": comments_data,
            "likes": likes_list,
            "reposts": reposts_list,
            "current_user_interaction": user_interaction
        }
        
        return response