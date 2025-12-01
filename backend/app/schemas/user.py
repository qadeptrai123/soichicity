from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from email_validator import validate_email, EmailNotValidError
import re


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

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

# Information stored in DB (with hashed password)
class UserInDB(UserBase):
    hashed_password: str

# Information returned to client (hides password)
class UserResponse(UserBase):
    pass

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
