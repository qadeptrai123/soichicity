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

        # If this is a reply, increment the parent's comment count
        # if reply_to_id:
        #     parent_ref = db.collection("posts").document(reply_to_id)
        #     # Use Increment to be safe with concurrent updates
        #     parent_ref.update({"comments_count": firestore.Increment(1)})
        if reply_to_id:
            batch = db.batch()

            current_parent_id = reply_to_id
            
            # --- Notification Logic for Reply ---
            # Fetch direct parent to notify author
            parent_ref = db.collection("posts").document(reply_to_id)
            parent_doc = parent_ref.get()
            
            if parent_doc.exists:
                p_data = parent_doc.to_dict()
                p_author_id = p_data.get("author_id")
                
                if p_author_id and p_author_id != user_id:
                     try:
                        from app.services.notification_service import NotificationService
                        from app.schemas.user_interactions import NotificationCreate
                        
                        NotificationService.create_notification(
                            user_id=p_author_id,
                            notification_data=NotificationCreate(
                                type="reply",
                                sender_id=user_id,
                                post_id=post_id
                            )
                        )
                     except Exception as e:
                         print(f"Error sending reply notification: {e}")

            while current_parent_id:
                parent_ref = db.collection("posts").document(current_parent_id)
                parent_doc = parent_ref.get()

                if not parent_doc.exists:
                    break

                batch.update(parent_ref, {
                    "comments_count": firestore.Increment(1)
                })

                parent_data = parent_doc.to_dict()
                current_parent_id = parent_data.get("reply_to_id")

            batch.commit()

        # --- Notification Logic for Mentions ---
        import re
        mentions = re.findall(r"@(\w+)", content)
        if mentions:
             # Remove duplicates
             mentions = list(set(mentions))
             
             # Find users with these usernames
             # Firestore doesn't support "in" query for large lists efficiently or field matching easily without exact match
             # But usually mentions are few (1-5). We can query per mention or use "in" if supported for 'username'
             # 'username' is indexed? Likely.
             # Limit to 10 mentions to prevent abuse?
             
             try:
                 users_ref = db.collection("users")
                 # Chunking if necessary, but assume < 10 mentions
                 # Since we need to match 'username' == mention, and 'username' is a field.
                 # "in" query supports up to 10 values actions.
                 
                 chunk_size = 10
                 for i in range(0, len(mentions), chunk_size):
                     chunk = mentions[i:i+chunk_size]
                     # Note: This requires 'username' to be exact match
                     q = users_ref.where(filter=firestore.FieldFilter("username", "in", chunk)).stream()
                     
                     from app.services.notification_service import NotificationService
                     from app.schemas.user_interactions import NotificationCreate
                     
                     for u in q:
                         target_uid = u.id
                         
                         # Don't notify self
                         if target_uid == user_id:
                             continue
                             
                         # Check if we already sent a 'reply' notification to this user for this same event?
                         # (Optional optimization: if target_uid == p_author_id (from reply logic), maybe create separate 'mention' or skip?
                         # Standard: You get a reply notif AND a mention notif if you are explicitly tagged in a reply.)
                         
                         NotificationService.create_notification(
                            user_id=target_uid,
                            notification_data=NotificationCreate(
                                type="mention",
                                sender_id=user_id,
                                post_id=post_id
                            )
                         )
             except Exception as e:
                 print(f"Error processing mentions: {e}")


        return payload

    @staticmethod
    def update_post(post_id: str, user_id: str, content: str, new_media_urls: list = None, existing_media_urls: list = None):
        post_ref = db.collection("posts").document(post_id)
        post_doc = post_ref.get()
        
        if not post_doc.exists:
            raise ValueError(f"Post {post_id} not found")
            
        post_data = post_doc.to_dict()
        if post_data.get("author_id") != user_id:
            raise ValueError("Permission denied")
            
        if new_media_urls is None:
            new_media_urls = []
        if existing_media_urls is None:
            existing_media_urls = []
            
        # Combine existing (preserved) and new media
        # Be careful: 'existing_media_urls' comes from frontend which might edit the order or remove some.
        # We trust the frontend list of existing URLs.
        
        # Security check: Ensure existing URLs actually belonged to the post or are valid?
        # For now, we trust. 
        
        final_media_urls = existing_media_urls + new_media_urls
        
        update_data = {
            "content": content,
            "media_urls": final_media_urls
        }
        
        post_ref.update(update_data)
        
        # Merge updated fields into current data to return
        post_data.update(update_data)
        return post_data
    # --- NEW: Hàm xử lý chung cho Like, Share, Save (Sub-collections) ---
    @staticmethod
    def toggle_interaction(collection_name: str, count_field: str, post_id: str, user_id: str, user_avatar: str = ""):
        print(f"toggle_interaction called: col={collection_name}, field={count_field}, post={post_id}, user={user_id}")
        
        target_collection = collection_name
        if collection_name == "shares":
            target_collection = "reposts"

        try:
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
                print(f"Post {post_id} not found in toggle_interaction")
                raise ValueError(f"Post {post_id} not found")
                
            post_data = post_snap.to_dict()
            author_id = post_data.get("author_id")
            
            timestamp_iso = datetime.utcnow().isoformat()

            post_interaction_ref = post_ref.collection(target_collection).document(user_id)
            user_interaction_ref = db.collection("users").document(user_id).collection(user_interaction_collection).document(post_id)
            
            doc = post_interaction_ref.get()
            
            if doc.exists:
                print(f"Removing interaction for {user_id} on {post_id}")
                post_interaction_ref.delete()
                user_interaction_ref.delete()
                post_ref.update({count_field: firestore.Increment(-1)})
                return {"status": "removed"}
            else:
                print(f"Adding interaction for {user_id} on {post_id}")
                post_interaction_ref.set({
                    "user_id": user_id,
                    "created_at": timestamp_iso
                })
                
                user_interaction_ref.set({
                    "post_id": post_id,
                    "created_at": timestamp_iso
                })
                
                post_ref.update({count_field: firestore.Increment(1)})
                
                # Notification Logic
                if target_collection in ["likes", "reposts"] and author_id and author_id != user_id:
                    try:
                        print(f"Attempting to send notification to {author_id}")
                        from app.services.notification_service import NotificationService
                        from app.schemas.user_interactions import NotificationCreate
                        
                        notif_type = "like" if target_collection == "likes" else "repost"
                        
                        NotificationService.create_notification(
                            user_id=author_id,
                            notification_data=NotificationCreate(
                                type=notif_type,
                                sender_id=user_id,
                                post_id=post_id
                            )
                        )
                    except Exception as ne:
                        print(f"Error sending notification (non-fatal): {ne}")

                return {"status": "added"}
            
        except Exception as e:
            print(f"CRITICAL Error in toggle_interaction: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

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
    # def create_comment(post_id: str, user_id: str, user_avatar: str, content: str):
    #     # Check if post exists
    #     post_ref = db.collection("posts").document(post_id)
    #     if not post_ref.get().exists:
    #         raise ValueError(f"Post {post_id} not found")
        
    #     # Validate comment content
    #     if not content or len(content.strip()) == 0:
    #         raise ValueError("Comment content cannot be empty")
        
    #     # Comment dùng UUID vì 1 user có thể comment nhiều lần
    #     comment_id = str(uuid.uuid4())
    #     timestamp = int(time.time() * 1000)
        
    #     payload = {
    #         "id": comment_id,
    #         "user_id": user_id,
    #         "id": comment_id,
    #         "user_id": user_id,
    #         "avatar_url": user_avatar, # Standardized
    #         "content": content,
    #         "timestamp": timestamp
    #     }
        
    #     # Lưu vào posts/{post_id}/comments/{comment_id}
    #     post_ref.collection("comments").document(comment_id).set(payload)
        
    #     # Lưu vào users/{user_id}/comments/{comment_id} (để track comments của user)
    #     # Không cần lưu comment_id vì đã có trong document ID
    #     user_comment_ref = db.collection("users").document(user_id).collection("comments").document(comment_id)
    #     user_comment_ref.set({
    #         "post_id": post_id,
    #         "content": content,
    #         "timestamp": timestamp
    #     })
        
    #     post_ref.update({"comments_count": firestore.Increment(1)})
        
    #     # Trigger Notification
    #     post_data = post_ref.get().to_dict()
    #     author_id = post_data.get("author_id")
        
    #     if author_id and author_id != user_id:
    #         from app.services.notification_service import NotificationService
    #         from app.schemas.user_interactions import NotificationCreate
    #         print("Triggering notification...")
    #         NotificationService.create_notification(
    #             user_id=author_id,
    #             notification_data=NotificationCreate(
    #                 type="comment",
    #                 sender_id=user_id,
    #                 post_id=post_id
    #             )
    #         )
        
    #     return payload

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

        # XÓA COMMENT
        comment_ref.delete()

        # XÓA user comment
        user_comment_ref = db.collection("users").document(user_id).collection("comments").document(comment_id)
        if user_comment_ref.get().exists:
            user_comment_ref.delete()

        # 🔥 GIẢM comments_count CHO TOÀN BỘ ANCESTOR
        current_parent_id = post_id
        batch = db.batch()

        while current_parent_id:
            parent_ref = db.collection("posts").document(current_parent_id)
            parent_doc = parent_ref.get()

            if not parent_doc.exists:
                break

            batch.update(parent_ref, {
                "comments_count": firestore.Increment(-1)
            })

            parent_data = parent_doc.to_dict()
            current_parent_id = parent_data.get("reply_to_id")

        batch.commit()

        return {"status": "deleted"}

    # def delete_comment(post_id: str, comment_id: str, user_id: str):
    #     post_ref = db.collection("posts").document(post_id)
    #     comment_ref = post_ref.collection("comments").document(comment_id)
        
    #     doc = comment_ref.get()
    #     if not doc.exists:
    #         return {"error": "Comment not found"}
            
    #     data = doc.to_dict()
    #     if data["user_id"] != user_id:
    #         return {"error": "Permission denied"}
            
    #     # Xóa ở posts/{post_id}/comments/{comment_id}
    #     comment_ref.delete()
        
    #     # Xóa ở users/{user_id}/comments/{comment_id}
    #     user_comment_ref = db.collection("users").document(user_id).collection("comments").document(comment_id)
    #     if user_comment_ref.get().exists:
    #         user_comment_ref.delete()
        
    #     post_ref.update({"comments_count": firestore.Increment(-1)})
    #     return {"status": "deleted"}

    @staticmethod
    def list_posts():
        posts = db.collection("posts").order_by("created_at").stream()
        result = [p.to_dict() for p in posts]
        return result
    
    @staticmethod
    def get_feed_posts(user_id: str = None, limit: int = 20, filter_type: str = "all", cursor: str = None):
        
        posts_ref = db.collection("posts")
        docs_stream = []

        if filter_type == "saved" and user_id:
            # 1. Get Saved Posts (from users/{user_id}/activity_saves)
            activity_ref = db.collection("users").document(user_id).collection("activity_saves").order_by("created_at", direction=firestore.Query.DESCENDING)
            
            if cursor:
                 # Assume cursor is timestamp
                 activity_ref = activity_ref.start_after({"created_at": cursor})
            
            activity_ref = activity_ref.limit(limit)
            activity_docs = list(activity_ref.stream())
            
            # Map post_id -> interaction_at
            activity_map = {d.get("post_id"): d.get("created_at") for d in activity_docs}
            post_ids = [d.get("post_id") for d in activity_docs]
            
            if post_ids:
                # Remove duplicates while preserving order
                seen = set()
                ordered_post_ids = [x for x in post_ids if not (x in seen or seen.add(x))]
                
                for pid in ordered_post_ids:
                    p_doc = posts_ref.document(pid).get()
                    if p_doc.exists:
                        p_data = p_doc.to_dict()
                        # Inject interaction_at for cursor
                        p_data["interaction_at"] = activity_map.get(pid)
                        docs_stream.append(p_data)
        
        elif filter_type == "liked" and user_id:
             # 2. Get Liked Posts
            activity_ref = db.collection("users").document(user_id).collection("activity_likes").order_by("created_at", direction=firestore.Query.DESCENDING)
            
            if cursor:
                activity_ref = activity_ref.start_after({"created_at": cursor})
                
            activity_ref = activity_ref.limit(limit)
            activity_docs = list(activity_ref.stream())
            
            activity_map = {d.get("post_id"): d.get("created_at") for d in activity_docs}
            post_ids = [d.get("post_id") for d in activity_docs]
            
            if post_ids:
                # Remove duplicates while preserving order
                seen = set()
                ordered_post_ids = [x for x in post_ids if not (x in seen or seen.add(x))]
                
                for pid in ordered_post_ids:
                    p_doc = posts_ref.document(pid).get()
                    if p_doc.exists:
                        p_data = p_doc.to_dict()
                        p_data["interaction_at"] = activity_map.get(pid)
                        docs_stream.append(p_data)

        elif filter_type == "following" and user_id:
            # 3. Get Following Posts
            user_ref = db.collection("users").document(user_id)
            u_doc = user_ref.get()
            if u_doc.exists:
                following_list = u_doc.to_dict().get("following", [])
                if following_list:
                     # Query based on posts
                     query = posts_ref.where("level", "==", 0).order_by("created_at", direction=firestore.Query.DESCENDING)
                     
                     if cursor:
                         query = query.start_after({"created_at": cursor})
                         
                     # Manual filter for following (not efficient for large scale but works for now)
                     # We might need to fetch MORE than limit to fill the limit after filtering
                     # Simplification: Fetch 2*limit, filter, return what we have (user might need to scroll more often)
                     # Better: standard feed usually doesn't strictly follow 'following' only unless using flat-feed service.
                     # Let's simple apply limit to query and filter code side.
                     # NOTE: 'start_after' works on the ORDER BY field.
                     
                     all_posts = query.limit(100).stream() # Fetch wider range
                     for p in all_posts:
                         if p.to_dict().get("author_id") in following_list:
                             docs_stream.append(p)
                             if len(docs_stream) >= limit:
                                 break
                else:
                    docs_stream = [] 
        
        else:
             # Default: All Posts
             query = posts_ref.where("level", "==", 0).order_by("created_at", direction=firestore.Query.DESCENDING)
             
             if cursor:
                 query = query.start_after({"created_at": cursor})
                 
             docs_stream = list(query.limit(limit).stream())
        
        # --- NEW: Filter blocked users ---
        if user_id:
             # Get list of users I blocked - Optimized: check local list
             # Assume blocked_ids passed or fetch? 
             # Fetch is safer for consistency.
             blocks_stream = db.collection("users").document(user_id).collection("blocks").stream()
             blocked_ids = {b.id for b in blocks_stream}
             
             # Filter out authors I blocked
             safe_docs = []
             for d in docs_stream:
                 if hasattr(d, "to_dict"):
                     auth_id = d.to_dict().get("author_id")
                 else:
                     auth_id = d.get("author_id")
                 
                 if auth_id not in blocked_ids:
                     safe_docs.append(d)
             docs_stream = safe_docs
        


        final_posts = []
        for p in docs_stream:
            if hasattr(p, "to_dict"):
                data = p.to_dict()
            else:
                data = p
            
            p_id = data.get("post_id") or data.get("id")
            author_id = data.get("author_id")
            
            # Skip if author in blocked list (Double check)
            if user_id and 'blocked_ids' in locals() and author_id in blocked_ids:
                continue

            # Normalize to new schema structure
            normalized = {
                "post_id": p_id,
                "content": data.get("content"),
                "media_urls": data.get("media_urls") or data.get("link_url", []),
                "created_at": data.get("created_at"),
                "interaction_at": data.get("interaction_at"),
                "author_id": author_id,
                "level": data.get("level", 0),
                "reply_to_id": data.get("reply_to_id"),
                "root_id": data.get("root_id"),
                "likes_count": data.get("likes_count") or data.get("likeCount", 0),
                "reposts_count": data.get("reposts_count") or data.get("repostCount") or data.get("shareCount", 0),
                "saves_count": data.get("saves_count") or data.get("saveCount", 0),
                "comments_count": data.get("comments_count") or data.get("commentCount", 0),
            }
            final_posts.append(normalized)
        
        # 6) Populate author info (Optimized with Batch Fetch)
        author_ids_list = list(set([p.get("author_id") for p in final_posts if p.get("author_id")]))
        authors_map = {}
        if author_ids_list:
            # Create references
            user_refs = [db.collection("users").document(uid) for uid in author_ids_list]
            # Batch get
            users_docs = db.get_all(user_refs)
            


            for doc in users_docs:
                if doc.exists:

                        
                    d = doc.to_dict()
                    authors_map[doc.id] = {
                        "uid": doc.id,
                        "username": d.get("username", ""),
                        "full_name": d.get("full_name"),
                        "avatar_url": d.get("avatar_url") or d.get("avatar") or d.get("picture"),
                    }

        # Re-filter final_posts (though now just mapping author)
        visible_posts = []
        for post in final_posts:
            author_id = post.get("author_id")
            
            if author_id and author_id in authors_map:
                post["author"] = authors_map[author_id]
                visible_posts.append(post)
            else:
                # If author info missing, might be deleted user, stick with basic info or skip?
                # Let's keep basics if available, or skip if strict.
                # Assuming safe to show if author_id exists.
                pass 
                
        final_posts = visible_posts
        
        # 7) Populate interaction status (Optimized with Batch Fetch)
        if user_id and final_posts:
            # Collect references for all checks
            like_refs = []
            repost_refs = []
            save_refs = []
            
            # Map request index to post index to reconstruct
            # Actually easier: create a map of post_id -> status
            
            for post in final_posts:
                pid = post["post_id"]
                post_ref = db.collection("posts").document(pid)
                like_refs.append(post_ref.collection("likes").document(user_id))
                repost_refs.append(post_ref.collection("reposts").document(user_id))
                save_refs.append(post_ref.collection("saves").document(user_id))
            
            # Batch fetch all together (or 3 batches)
            # db.get_all accepts mixed references? Yes.
            # But let's do 3 batches for clarity and likely similar performance
            
            
            likes_snapshots = list(db.get_all(like_refs))
            reposts_snapshots = list(db.get_all(repost_refs))
            saves_snapshots = list(db.get_all(save_refs))
            
            # Map results by post_id to avoid order mismatch
            likes_map = {snap.reference.parent.parent.id: snap.exists for snap in likes_snapshots}
            reposts_map = {snap.reference.parent.parent.id: snap.exists for snap in reposts_snapshots}
            saves_map = {snap.reference.parent.parent.id: snap.exists for snap in saves_snapshots}

            for post in final_posts:
                pid = post["post_id"]
                post["is_liked"] = likes_map.get(pid, False)
                post["is_reposted"] = reposts_map.get(pid, False)
                post["is_saved"] = saves_map.get(pid, False)
                
        else:
             # Guest user or no posts
            for post in final_posts:
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
    def get_post_detail(post_id: str, current_user_id: str = None):
        """
        Fetch complete post detail with:
        - Post metadata
        - Author info
        - Level 1 Replies (Posts)
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
            "uid": author_id,
            "username": "Unknown",
            "avatar_url": None,
            "full_name": None
        }
        if author_doc.exists:
            user_info = author_doc.to_dict()
            author_data = {
                "uid": author_id,
                "username": user_info.get("username", "Unknown"),
                "avatar_url": user_info.get("avatar") or user_info.get("avatar_url") or user_info.get("picture"), # Normalize avatar
                "full_name": user_info.get("full_name")
            }
        
        # 3) Fetch Level 1 Replies (from 'posts' collection where reply_to_id == post_id)
        # Note: We fetch ALL level 1 replies here as per request "fetch the level 1 of the post". 
        # Ideally this should be paginated if too large, but request asked to remove page params.
        replies_ref = db.collection("posts").where("reply_to_id", "==", post_id).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        
        # Block filtering for replies
        blocked_ids = set()
        if current_user_id:
            # Users I blocked
            blocks_stream = db.collection("users").document(current_user_id).collection("blocks").stream()
            blocked_ids.update({b.id for b in blocks_stream})
            
            # Users blocking me (Optimization needed in real app, here we might skip or do best effort)
            # Since we iterate replies, we can check "blocking me" status if crucial, but usually "I block them" is main view filter.
            # To be strict as requested: "hien nhung lien quan ve user block" -> Should hide both directions.
            # But checking "blocking me" for every reply author is expensive (N reads).
            # Let's rely on the fact that if they block me, I shouldn't see their content.
            # We can do a batch check for "blocking me" for all reply authors later, or accept simple filter.
            # For now, let's filter out "Users I Blocked" which is cheap (local list).
            # If we need "Users Blocking Me", we need to fetch that for each author. 
            # I'll implement "Users I Blocked" first. 
            pass

        replies_list = []
        for rep in replies_ref:
            r_data = rep.to_dict()
            
            # Filter blocked authors
            r_author_id = r_data.get("author_id")
            if current_user_id and r_author_id:
                # 1. Start with "I blocked them" check
                if r_author_id in blocked_ids:
                    continue
                
                # 2. Check "They blocked me" - expensive but necessary if strict
                # Optimization: Only check if not already known
                # We can do this check individually or ignore it to save reads. 
                # Request said: "user bị blocked vào post mà có user đã block mình thì vẫn xem được... cần phải chặn"
                # So we MUST check "is blocking me".
                # check dict ref
                is_blocking_me = db.collection("users").document(r_author_id).collection("blocks").document(current_user_id).get().exists
                if is_blocking_me:
                    continue


            r_author_data = {"uid": r_author_id, "name": "Unknown", "username": "unknown", "avatar_url": ""}
            if r_author_id:
                # Optimized: In real app, use DataLoader or batch get. Here we do N reads (slow but simple)
                ua_doc = db.collection("users").document(r_author_id).get()
                if ua_doc.exists:
                    uad = ua_doc.to_dict()
                    r_author_data = {
                        "uid": r_author_id,
                        "full_name": uad.get("full_name", "Unknown"),
                        "username": uad.get("username", ""),
                        "avatar_url": uad.get("avatar_url") or uad.get("avatar") or uad.get("picture", "")
                    }

            replies_list.append({
                "post_id": r_data.get("post_id"),
                "content": r_data.get("content"),
                "created_at": r_data.get("created_at"),
                "author": r_author_data,
                "author_id": r_author_id, # Ensure author_id is present
                "likes_count": r_data.get("likes_count", 0),
                "reposts_count": r_data.get("reposts_count") or r_data.get("repostCount") or r_data.get("shareCount", 0),
                "saves_count": r_data.get("saves_count") or r_data.get("saveCount", 0),
                "comments_count": r_data.get("comments_count") or r_data.get("replies_count", 0), 
                "media_urls": r_data.get("media_urls", []),
                # Add usage for gallery in FE
                "gallery": [{"url": url} for url in (r_data.get("media_urls") or [])],
                "actions_count": r_data.get("likes_count", 0), # FE uses actions_count
                
                "level": r_data.get("level", 0),
                "reply_to_id": r_data.get("reply_to_id"),
                "is_liked": False,
                "is_reposted": False,
                "is_saved": False
            })
            if current_user_id:
            # Check if current user liked
                if rep.reference.collection("likes").document(current_user_id).get().exists:
                    replies_list[-1]["is_liked"] = True
                    print(f"DTO DEBUG: get_post_detail reply found LIKE for {r_data.get('post_id')}")
                
                # Check if current user reposted
                if rep.reference.collection("reposts").document(current_user_id).get().exists:
                    replies_list[-1]["is_reposted"] = True
                    print(f"DTO DEBUG: get_post_detail reply found REPOST for {r_data.get('post_id')}")
                
                # Check if current user saved
                if rep.reference.collection("saves").document(current_user_id).get().exists:
                    replies_list[-1]["is_saved"] = True
                    # Fix display defaulting to 0 if count is missing but interaction exists
                    if replies_list[-1]["saves_count"] == 0:
                         replies_list[-1]["saves_count"] = 1
                    print(f"DTO DEBUG: get_post_detail reply found SAVE for {r_data.get('post_id')}")
        
        # 4) Fetch likes & reposts lists (user IDs) - lightweight check
        #   (Optional: Only needed if we want to show list of likers in UI, usually overkill for detail)
        #   Let's keep it if legacy needed, or just remove if not needed. FE uses data.activity for this?
        #   FE Mock uses 'activity': [{type, user...}].
        #   Let's construct a simple activity list from sub-collections (limit to last 5?)
        activity_list = []
        # Likes
        recent_likes = db.collection("posts").document(post_id).collection("likes").limit(3).stream()
        for l in recent_likes:
            uid = l.id
            u_doc = db.collection("users").document(uid).get()
            if u_doc.exists:
                ud = u_doc.to_dict()
                activity_list.append({
                    "type": "like",
                    "user": {
                        "name": ud.get("full_name", "User"),
                        "username": ud.get("username", ""),
                        "avatar_url": ud.get("avatar_url") or ud.get("avatar") or ""
                    }
                })
        
        # 5) Check current user's interaction status
        user_interaction = {
            "is_liked": False,
            "is_reposted": False,
            "is_saved": False
        }
        
        if current_user_id:
            # Check if current user liked
            if db.collection("posts").document(post_id).collection("likes").document(current_user_id).get().exists:
                user_interaction["is_liked"] = True
            
            # Check if current user shared
            if db.collection("posts").document(post_id).collection("reposts").document(current_user_id).get().exists:
                user_interaction["is_reposted"] = True
            
            # Check if current user saved
            if db.collection("posts").document(post_id).collection("saves").document(current_user_id).get().exists:
                user_interaction["is_saved"] = True
        
        # 6) Build response
        response = {
            "post_id": post_data.get("post_id") or post_data.get("id"),
            "content": post_data.get("content"),
            "media_urls": post_data.get("media_urls") or post_data.get("link_url", []),
            "created_at": post_data.get("created_at"),
            
            "author": author_data,
            "author_id": author_data.get("uid", author_data.get("id")),
            
            "likes_count": post_data.get("likes_count") or post_data.get("likeCount", 0),
            "reposts_count": post_data.get("reposts_count") or post_data.get("repostCount") or post_data.get("shareCount", 0),
            "saves_count": post_data.get("saves_count") or post_data.get("saveCount", 0),
            "comments_count": post_data.get("comments_count") or post_data.get("commentCount", 0),
            
            # Flat attributes for easy FE access
            "likes": post_data.get("likes_count") or 0,
            
            "replies": replies_list,
            "activity": activity_list,
            
            "current_user_interaction": user_interaction,
            
            # Helper booleans at top level if FE expects them directly
            "is_liked": user_interaction["is_liked"],
            "is_saved": user_interaction["is_saved"],
            "is_reposted": user_interaction["is_reposted"]
        }
        
        return response

    @staticmethod
    def get_replies(post_id: str, current_user_id: str = None):
        print(f"DTO DEBUG: Service get_replies called with post_id={post_id}, current_user_id={current_user_id}")
        """
        Fetch all posts that reply to the target post (level 1).
        """
        replies_ref = db.collection("posts").where("reply_to_id", "==", post_id).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        
        results = []
        for rep in replies_ref:
            r_data = rep.to_dict()
            
            # Resolve Reply Author
            r_author_id = r_data.get("author_id")
            r_author_data = {"uid": r_author_id, "name": "Unknown", "username": "unknown", "avatar_url": ""}
            if r_author_id:
                # Optimized: In real app, use DataLoader or batch get. Here we do N reads (slow but simple)
                ua_doc = db.collection("users").document(r_author_id).get()
                if ua_doc.exists:
                    uad = ua_doc.to_dict()
                    r_author_data = {
                        "uid": r_author_id,
                        "full_name": uad.get("full_name", "Unknown"),
                        "username": uad.get("username", ""),
                        "avatar_url": uad.get("avatar_url") or uad.get("avatar") or uad.get("picture", "")
                    }

            results.append({
                "post_id": r_data.get("post_id"),
                "content": r_data.get("content"),
                "created_at": r_data.get("created_at"),
                "author": r_author_data,
                "author_id": r_author_id, # Ensure author_id is present
                "likes_count": r_data.get("likes_count", 0),
                "reposts_count": r_data.get("reposts_count") or r_data.get("repostCount") or r_data.get("shareCount", 0),
                "saves_count": r_data.get("saves_count") or r_data.get("saveCount", 0),
                "comments_count": r_data.get("comments_count") or r_data.get("replies_count", 0), 
                "media_urls": r_data.get("media_urls", []),
                # Add usage for gallery in FE
                "gallery": [{"url": url} for url in (r_data.get("media_urls") or [])],
                "actions_count": r_data.get("likes_count", 0), # FE uses actions_count
                
                # Recursively we might want to know if *this* reply has replies, which is populated above in replies_count
                "level": r_data.get("level", 0),
                "reply_to_id": r_data.get("reply_to_id"),
                "is_liked": False,
                "is_reposted": False,
                "is_saved": False
            })

            if current_user_id:
                # Check if current user liked
                if rep.reference.collection("likes").document(current_user_id).get().exists:
                    results[-1]["is_liked"] = True
                    print(f"DTO DEBUG: Found LIKE for {r_data.get('post_id')}")
                
                # Check if current user reposted
                if rep.reference.collection("reposts").document(current_user_id).get().exists:
                    results[-1]["is_reposted"] = True
                    if results[-1]["reposts_count"] == 0:
                        results[-1]["reposts_count"] = 1
                    print(f"DTO DEBUG: Found REPOST for {r_data.get('post_id')}")

                # Check if current user saved
                if rep.reference.collection("saves").document(current_user_id).get().exists:
                    results[-1]["is_saved"] = True
                    if results[-1]["saves_count"] == 0:
                        results[-1]["saves_count"] = 1
                    print(f"DTO DEBUG: Found SAVE for {r_data.get('post_id')}")
        
        return results

    @staticmethod
    def get_post_activity(post_id: str, current_user_id: str = None):
        """
        Fetch full activity (likes, reposts) for a post.
        Returns: {
            "likes": [{user, created_at, type='like', is_following}],
            "reposts": [{user, created_at, type='repost', is_following}]
        }
        """
        post_ref = db.collection("posts").document(post_id)
        
        # 1. Fetch Likes
        likes_stream = post_ref.collection("likes").order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        likes_data = [{"uid": doc.id, **doc.to_dict(), "type": "like"} for doc in likes_stream]
        
        # 2. Fetch Reposts (reposts subcollection)
        reposts_stream = post_ref.collection("reposts").order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        reposts_data = [{"uid": doc.id, **doc.to_dict(), "type": "repost"} for doc in reposts_stream]
        
        # 3. Collect all unique User IDs
        all_uids = set([item["uid"] for item in likes_data] + [item["uid"] for item in reposts_data])
        
        # 4. Batch Fetch Users
        users_map = {}
        if all_uids:
            # Chunking because Firestore limits where_in or we can use get_all
            # get_all handles batching automatically? SDK usually does.
            user_refs = [db.collection("users").document(uid) for uid in all_uids]
            user_docs = db.get_all(user_refs)
            for doc in user_docs:
                if doc.exists:
                    d = doc.to_dict()
                    users_map[doc.id] = {
                        "uid": doc.id,
                        "username": d.get("username", "unknown"),
                        "full_name": d.get("full_name"),
                        "avatar_url": d.get("avatar_url") or d.get("avatar") or d.get("picture"),
                        "bio": d.get("bio")
                    }
        
        # 5. Check Follow Status (if current_user_id provided)
        following_map = {}
        if current_user_id and all_uids:
            # We can check specific followings. 
            # Check users/{current_user_id}/followings/{target_uid}
            # Batch checking existence.
            # Create refs
            check_refs = []
            check_uids = [] # to map back
            current_following_ref = db.collection("users").document(current_user_id).collection("followings")
            
            for uid in all_uids:
                if uid != current_user_id:
                    check_refs.append(current_following_ref.document(uid))
                    check_uids.append(uid)
            
            if check_refs:
                checks = db.get_all(check_refs)
                for i, doc in enumerate(checks):
                    if doc.exists:
                        following_map[check_uids[i]] = True
        
        # 6. Hydrate Results
        def hydrate(items):
            res = []
            for item in items:
                uid = item["uid"]
                user_obj = users_map.get(uid, {
                    "uid": uid, 
                    "username": "unknown", 
                    "full_name": "Unknown User", 
                    "avatar_url": None
                })
                
                # Attach follow status
                is_following = following_map.get(uid, False)
                is_self = (uid == current_user_id)
                
                res.append({
                    "user": {**user_obj, "is_following": is_following, "is_self": is_self},
                    "created_at": item.get("created_at"),
                    "type": item.get("type")
                })
            return res

        return {
            "likes": hydrate(likes_data),
            "reposts": hydrate(reposts_data)
        }