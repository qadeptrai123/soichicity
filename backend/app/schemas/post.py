from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PostCreate(BaseModel):
    content: str
    link_url: Optional[list[str]] = [] 

class PostResponse(BaseModel):
    id: str
    content: str
    link_url: Optional[list[str]] = []   # là list
    created_at: datetime
    author_id: str
