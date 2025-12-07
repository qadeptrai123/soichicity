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
        files: List[UploadFile] = File(default=[])
    ):
        self.content = content
        self.files = files

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
    user_avatar: Optional[str] = None
    content: str
    timestamp: int # Trả về dạng số như hình

class AuthorResponse(BaseModel):
    id: str
    username: str
    avatar: Optional[str] = None
    full_name: Optional[str] = None

class PaginatedComments(BaseModel):
    items: List[CommentResponse] = []
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 0

class UserInteractionStatus(BaseModel):
    is_liked: bool = False
    is_saved: bool = False
    is_shared: bool = False

class PostResponse(BaseModel):
    id: str
    content: str
    link_url: List[str] = []
    created_at: str
    author_id: str
    
    # Interaction status for current user
    is_liked: bool = False
    is_shared: bool = False
    is_saved: bool = False
    
    # Các trường đếm (Map đúng tên field trong hình)
    like_count: int = Field(alias="likeCount", default=0)
    share_count: int = Field(alias="shareCount", default=0)
    save_count: int = Field(alias="saveCount", default=0)
    comment_count: int = Field(alias="commentCount", default=0)

    class Config:
        populate_by_name = True  # Cho phép map từ likeCount (DB) -> like_count (Code)

    @validator("link_url", pre=True)
    def ensure_list(cls, v):
        if v is None: return []
        if isinstance(v, str): return [v]
        return v

class PostDetailResponse(BaseModel):
    # Post metadata
    id: str
    content: str
    link_url: List[str] = []
    created_at: str
    
    # Author info
    author: AuthorResponse
    
    # Engagement counts
    like_count: int = Field(alias="likeCount", default=0)
    share_count: int = Field(alias="shareCount", default=0)
    save_count: int = Field(alias="saveCount", default=0)
    comment_count: int = Field(alias="commentCount", default=0)
    
    # Comments with pagination
    comments: PaginatedComments = PaginatedComments()
    
    # Engagement lists (optional, for UI needs)
    likes: List[str] = []  # List of user IDs who liked
    reposts: List[str] = []  # List of user IDs who reposted
    
    # Current user's interaction status
    current_user_interaction: UserInteractionStatus = UserInteractionStatus()
    
    class Config:
        populate_by_name = True

