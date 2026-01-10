# from pydantic import BaseModel, validator
# from typing import Optional, List
# from datetime import datetime


# class PostCreate(BaseModel):
#     content: str
#     link_url: Optional[List[str]] = [] 

# class PostResponse(BaseModel):
#     id: str
#     content: str
#     link_url: Optional[List[str]] = []   # là list
#     created_at: datetime
#     author_id: str

#     @validator("link_url", pre=True)
#     def ensure_list(cls, v):
#         if isinstance(v, list):
#             return v
#         return [v]

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from fastapi import Form, File, UploadFile

# --- Schemas Input ---
class PostCreate(BaseModel):
    content: str
    link_url: Optional[List[str]] = [] 


class PostCreateForm:
    def __init__(
        self,
        content: str = Form(...),
        files: List[UploadFile] = File(default=[]),
        level: int = Form(0),
        reply_to_id: Optional[str] = Form(None),
        gallery: List[str] = Form(default=[])
    ):
        self.content = content
        self.files = files
        self.level = level
        self.reply_to_id = reply_to_id
        self.gallery = gallery

class CommentCreate:
    def __init__(
        self,
        content: str = Form(...),
        files: List[UploadFile] = File(default=[])
    ):
        self.content = content
        self.files = files

# --- Schemas Output ---
class CommentResponse(BaseModel):
    id: str
    user_id: str
    avatar_url: Optional[str] = None
    content: str
    timestamp: int # Trả về dạng số như hình

class AuthorResponse(BaseModel):
    uid: str
    username: str
    avatar_url: Optional[str] = None
    full_name: Optional[str] = None

class PaginatedComments(BaseModel):
    items: List[CommentResponse] = []
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 0

class UserInteractionStatus(BaseModel):
    is_liked: bool = False
    is_reposted: bool = False
    is_saved: bool = False

class PostResponse(BaseModel):
    post_id: str
    content: str
    media_urls: List[str] = []
    created_at: str
    author_id: str
    level: int = 0
    reply_to_id: Optional[str] = None
    root_id: Optional[str] = None
    
    # Author info
    author: Optional[AuthorResponse] = None
    
    # Interaction status for current user
    is_liked: bool = False
    is_reposted: bool = False
    is_saved: bool = False
    
    # Counts
    # Counts
    likes_count: int = 0
    reposts_count: int = 0
    saves_count: int = 0
    saves_count: int = 0
    comments_count: int = 0
    
    # Cursor pagination helper for liked/saved feeds
    interaction_at: Optional[str] = None

    class Config:
        populate_by_name = True

    @validator("media_urls", pre=True)
    def ensure_list(cls, v):
        if v is None: return []
        if isinstance(v, str): return [v]
        return v

class ActivityUser(BaseModel):
    name: str # The service uses name or full_name? dict says "name": ud.get("full_name")
    username: str
    avatar_url: Optional[str] = None

class ActivityItem(BaseModel):
    type: str # "like", "repost"
    user: ActivityUser

class PostDetailResponse(BaseModel):
    # Post metadata
    post_id: str
    content: str
    media_urls: List[str] = []
    created_at: str
    level: int = 0
    reply_to_id: Optional[str] = None
    root_id: Optional[str] = None
    
    # Author info
    author: AuthorResponse
    author_id: str
    
    # Engagement counts
    likes_count: int = 0
    reposts_count: int = 0
    saves_count: int = 0
    comments_count: int = 0
    
    # Flattened for FE convenience
    likes: int = 0

    # Replies (Level 1)
    replies: List[dict] = [] # Or define basic Post structure. For now dict is safe or use PostResponse? PostResponse isn't fully defined yet. 
    # Let's use List[dict] to avoid circular reference issues if PostResponse refers to AuthorResponse etc.
    # Actually PostDetailResponse is separate. 
    
    # Activity
    activity: List[ActivityItem] = []
    
    # Current user's interaction status
    current_user_interaction: UserInteractionStatus = UserInteractionStatus()
    
    # Top level interaction status
    is_liked: bool = False
    is_reposted: bool = False
    is_saved: bool = False
    
    class Config:
        populate_by_name = True
