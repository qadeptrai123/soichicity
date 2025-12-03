from app.db.firebase import db
from datetime import datetime
import uuid
import random

class PostService:

    @staticmethod
    def create_post(user_id: str, content: str, link_url: str = None):
        post_id = str(uuid.uuid4())
        payload = {
            "id": post_id,
            "content": content,
            "link_url": link_url,   # thêm đây
            "created_at": datetime.utcnow().isoformat(),
            "author_id": user_id
        }
        db.collection("posts").document(post_id).set(payload)
        return payload

    
    @staticmethod
    def list_posts():
        posts = db.collection("posts").order_by("created_at").stream()
        result = [p.to_dict() for p in posts]
        return result
    
    @staticmethod
    def get_feed_posts(user_id: str, limit: int = 20):

        # 1) lấy danh sách post user đã xem
        seen_ref = db.collection("users_seen_posts").document(user_id).get()
        seen_posts = []
        if seen_ref.exists:
            seen_posts = seen_ref.to_dict().get("seen", [])

        # 2) query tất cả posts
        posts = db.collection("posts").stream()
        result = [p.to_dict() for p in posts]

        # 3) lọc ra bài mà user chưa xem
        unseen = [p for p in result if p["id"] not in seen_posts]

        # 4) random shuffle
        random.shuffle(unseen)

        # 5) giới hạn số lượng
        return unseen[:limit]
    
    @staticmethod
    def mark_post_as_seen(user_id: str, post_id: str):
        doc_ref = db.collection("users_seen_posts").document(user_id)
        doc = doc_ref.get()

        if doc.exists:
            arr = doc.to_dict().get("seen", [])
            if post_id not in arr:
                arr.append(post_id)
                doc_ref.update({"seen": arr})
        else:
            doc_ref.set({"seen": [post_id]})

