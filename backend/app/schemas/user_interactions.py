from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Base schema for timestamp
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.now)

# Sub-collection: followers, followings, activity_blocks
class Follower(TimestampMixin):
    user_id: str = Field(..., description="The ID of another user that is a follower of the user.")

class Following(TimestampMixin):
    user_id: str = Field(..., description="The ID of another user that this user is following.")

class ActivityBlock(TimestampMixin):
    user_id: str = Field(..., description="The ID of the user that is blocked.")

# Sub-collection: activity_reposts, activity_likes, activity_saves
class ActivityLike(TimestampMixin):
    post_id: str = Field(..., description="The ID of a post that the user liked.")

class ActivityRepost(TimestampMixin):
    post_id: str = Field(..., description="The ID of a post that the user reposted.")

class ActivitySave(TimestampMixin):
    post_id: str = Field(..., description="The ID of a post that the user saved.")

# Sub-collection: notifications
class NotificationBase(TimestampMixin):
    notification_id: str = Field(..., description="The ID of notification that is sent to the user.")
    type: str = Field(..., description='The type of notification. ("comment", "follow", ...)')
    sender_id: str = Field(..., description="The ID of the user that triggered this notification.")
    post_id: Optional[str] = Field(None, description="The ID of the post that the notification comes from.")
    is_read: bool = Field(False, description="The status of the notification.")

class NotificationCreate(BaseModel):
    type: str
    sender_id: str
    post_id: Optional[str] = None

class Notification(NotificationBase):
    pass
