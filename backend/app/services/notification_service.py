from app.db.firebase import db
from app.schemas.user_interactions import NotificationCreate
from datetime import datetime
import uuid

class NotificationService:
    @staticmethod
    def create_notification(user_id: str, notification_data: NotificationCreate):
        """
        Creates a notification for the specified user (user_id).
        """
        # User Interaction schemas define notification_id as Primary Key needed for the doc?
        # Current logic usually auto-generates doc ID or uses a specific one.
        # Requirement says: notification_id, string, Primary key.
        
        notification_id = str(uuid.uuid4())
        
        payload = {
            "notification_id": notification_id,
            "type": notification_data.type,
            "sender_id": notification_data.sender_id,
            "post_id": notification_data.post_id,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        }

        # Add to sub-collection: notifications
        # users/{user_id}/notifications/{notification_id}
        db.collection("users").document(user_id).collection("notifications").document(notification_id).set(payload)
        
        # Don't necessarily need to return anything complex, just void or ID
        return notification_id
