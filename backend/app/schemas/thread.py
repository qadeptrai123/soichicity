from pydantic import BaseModel
from typing import Optional

class ThreadBase(BaseModel):
    text: str

class ThreadCreate(ThreadBase):
    pass

class Thread(ThreadBase):
    id: Optional[str] = None
    owner_id: str
