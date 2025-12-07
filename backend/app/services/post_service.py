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

from app.db.firebase import db
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
    def create_post(user_id: str, content: str, link_url: list = None):
        post_id = str(uuid.uuid4())
        
        # Đảm bảo link_url luôn là list
        if link_url is None:
            link_url = []
        elif isinstance(link_url, str):
            link_url = [link_url]

        payload = {
            "id": post_id,
            "content": content,
            "link_url": link_url, 
            "created_at": datetime.utcnow().isoformat(),
            "author_id": user_id,
            
            # --- UPDATE: Thêm các biến đếm khởi tạo = 0 ---
            "likeCount": 0,
            "shareCount": 0,
            "saveCount": 0,
            "commentCount": 0
        }
        db.collection("posts").document(post_id).set(payload)
        return payload

    # --- NEW: Hàm xử lý chung cho Like, Share, Save (Sub-collections) ---
    @staticmethod
    def toggle_interaction(collection_name: str, count_field: str, post_id: str, user_id: str, user_avatar: str = ""):
        """
        Hàm này dùng chung cho:
        - collection_name: 'likes', 'shares', hoặc 'saves'
        - count_field: 'likeCount', 'shareCount', hoặc 'saveCount'
        """
        post_ref = db.collection("posts").document(post_id)
        
        # Check if post exists
        if not post_ref.get().exists:
            raise ValueError(f"Post {post_id} not found")
        
        # Key của doc là user_id -> đảm bảo 1 user chỉ like/share/save 1 lần
        sub_ref = post_ref.collection(collection_name).document(user_id)

        doc = sub_ref.get()
        if doc.exists:
            # Nếu đã tồn tại -> Xóa (Unlike/Unshare)
            sub_ref.delete()
            post_ref.update({count_field: firestore.Increment(-1)})
            return {"status": "removed"}
        else:
            # Nếu chưa -> Thêm mới (kèm timestamp & avatar như hình yêu cầu)
            sub_ref.set({
                "timestamp": int(time.time() * 1000),
                "userAvatar": user_avatar
            })
            post_ref.update({count_field: firestore.Increment(1)})
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
        
        payload = {
            "id": comment_id,
            "user_id": user_id,
            "userAvatar": user_avatar,
            "content": content,
            "link_url": files,
            "timestamp": int(time.time() * 1000)
        }
        
        post_ref.collection("comments").document(comment_id).set(payload)
        
        post_ref.update({"commentCount": firestore.Increment(1)})
        
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
            
        comment_ref.delete()
        post_ref.update({"commentCount": firestore.Increment(-1)})
        return {"status": "deleted"}

    @staticmethod
    def list_posts():
        posts = db.collection("posts").order_by("created_at").stream()
        result = [p.to_dict() for p in posts]
        return result
    
    @staticmethod
    def get_feed_posts(user_id: str = None, limit: int = 20):
        # 1) Lấy danh sách post user đã xem (Chỉ nếu đã login)
        seen_posts = []
        if user_id:
            seen_ref = db.collection("users_seen_posts").document(user_id).get()
            if seen_ref.exists:
                seen_posts = seen_ref.to_dict().get("seen", [])

        # 2) Query tất cả posts
        # (Lưu ý: Cách này sẽ chậm khi dữ liệu lớn, nên tối ưu query bằng 'not-in' hoặc phân trang sau này)
        posts = db.collection("posts").stream()
        result = []
        for p in posts:
            data = p.to_dict()
            # Đảm bảo data trả về có đủ field, tránh lỗi key cũ
            data.setdefault("likeCount", 0)
            data.setdefault("commentCount", 0)
            result.append(data)

        # 3) Lọc ra bài mà user chưa xem
        unseen = [p for p in result if p["id"] not in seen_posts]

        # 4) Random shuffle
        random.shuffle(unseen)

        # 5) Giới hạn số lượng
        final_posts = unseen[:limit]
        
        # 6) Populate interaction status (is_liked, is_shared, is_saved)
        # Note: This performs N*3 reads per request. Optimize by batching or denormalizing if scale increases.
        for post in final_posts:
            if user_id:
                p_id = post["id"]
                post_ref = db.collection("posts").document(p_id)
                
                # Check Like
                if post_ref.collection("likes").document(user_id).get().exists:
                    post["is_liked"] = True
                else:
                     post["is_liked"] = False
                     
                # Check Share
                if post_ref.collection("shares").document(user_id).get().exists:
                    post["is_shared"] = True
                else:
                     post["is_shared"] = False
                     
                # Check Save
                if post_ref.collection("saves").document(user_id).get().exists:
                    post["is_saved"] = True
                else:
                     post["is_saved"] = False
            else:
                # Guest user -> all false
                post["is_liked"] = False
                post["is_shared"] = False
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
        
        reposts_docs = db.collection("posts").document(post_id).collection("shares").stream()
        reposts_list = [doc.id for doc in reposts_docs]
        
        # 5) Check current user's interaction status
        user_interaction = {
            "is_liked": False,
            "is_saved": False,
            "is_shared": False
        }
        
        if current_user_id:
            # Check if current user liked
            if db.collection("posts").document(post_id).collection("likes").document(current_user_id).get().exists:
                user_interaction["is_liked"] = True
            
            # Check if current user saved
            if db.collection("posts").document(post_id).collection("saves").document(current_user_id).get().exists:
                user_interaction["is_saved"] = True
            
            # Check if current user shared
            if db.collection("posts").document(post_id).collection("shares").document(current_user_id).get().exists:
                user_interaction["is_shared"] = True
        
        # 6) Build response
        response = {
            "id": post_data.get("id"),
            "content": post_data.get("content"),
            "link_url": post_data.get("link_url", []),
            "created_at": post_data.get("created_at"),
            "author": author_data,
            "likeCount": post_data.get("likeCount", 0),
            "shareCount": post_data.get("shareCount", 0),
            "saveCount": post_data.get("saveCount", 0),
            "commentCount": post_data.get("commentCount", 0),
            "comments": comments_data,
            "likes": likes_list,
            "reposts": reposts_list,
            "current_user_interaction": user_interaction
        }
        
        return response