from app.db.firebase import db
from datetime import datetime
import uuid

class PostService:

    @staticmethod
    def create_post(user_id: str, title: str, content: str):
        post_id = str(uuid.uuid4())
        payload = {
            "id": post_id,
            "title": title,
            "content": content,
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
