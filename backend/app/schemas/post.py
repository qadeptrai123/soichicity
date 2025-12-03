from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


class PostCreate(BaseModel):
    content: str
    link_url: Optional[List[str]] = [] 

class PostResponse(BaseModel):
    id: str
    content: str
    link_url: Optional[List[str]] = []   # là list
    created_at: datetime
    author_id: str

    @validator("link_url", pre=True)
    def ensure_list(cls, v):
        if isinstance(v, list):
            return v
        return [v]