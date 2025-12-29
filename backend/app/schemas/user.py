from pydantic import BaseModel, EmailStr, field_validator, Field, ConfigDict
from typing import List, Optional
from email_validator import validate_email, EmailNotValidError
import re
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str # Not Null
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True # Not Null, default True
    provider: str = "password" # "google"/"password"
    created_at: datetime = Field(default_factory=datetime.now) # Not Null

    model_config = ConfigDict(from_attributes=True)

# Thông tin dùng để tạo user (có password)
class UserCreate(UserBase):
    password: str

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str):
        # 1. Check whitespace
        if ' ' in v:
            raise ValueError('Username must not contain whitespace')
            
        # 2. Check special characters
        if not re.match("^[a-zA-Z0-9_.]+$", v):
             raise ValueError('Username can only contain alphanumeric characters, dots, and underscores')

        # 3.Convert all to lowercase
        return v.lower()
    
    @field_validator('email')
    @classmethod
    def validate_real_email(cls, v: str):
        try:
            # check_deliverability=True: It will ping the email server (Gmail, Yahoo...) 
            # to see if the domain can receive emails.
            email_info = validate_email(v, check_deliverability=True)
            
            # Return the normalized email (e.g., Test@Gmail.Com -> test@gmail.com)
            return email_info.normalized 
            
        except EmailNotValidError as e:
            raise ValueError(f"Email is not valid: {str(e)}")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Information stored in DB (with hashed password)
class UserInDB(UserBase):
    hashed_password: str

# Information returned to client (hides password)
class UserResponse(UserBase):
    uid: str
    
    # Lists might still be useful for checking relationships, but keeping counters is main req
    followers: List[str] = []
    following: List[str] = []

    followers_count: int = 0
    followings_count: int = 0
    blocks_count: int = 0
    reposts_count: int = 0
    saves_count: int = 0
    likes_count: int = 0
    notifications_count: int = 0

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
