from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from email_validator import validate_email, EmailNotValidError
import re

# Thông tin cơ bản
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
        # 1. Check khoảng trắng
        if ' ' in v:
            raise ValueError('Username không được chứa khoảng trắng')
            
        # 2. Check ký tự đặc biệt
        if not re.match("^[a-zA-Z0-9_.]+$", v):
             raise ValueError('Username chỉ được chứa chữ cái không dấu, số, dấu chấm và gạch dưới')

        # 3.Chuyển tất cả về chữ thường
        return v
    @field_validator('email')
    @classmethod
    def validate_real_email(cls, v: str):
        try:
            # check_deliverability=True: Nó sẽ ping đến Server của email (Gmail, Yahoo...) 
            # để xem tên miền đó có nhận được thư không.
            email_info = validate_email(v, check_deliverability=True)
            
            # Trả về email đã được chuẩn hóa (ví dụ: Test@Gmail.Com -> test@gmail.com)
            return email_info.normalized 
            
        except EmailNotValidError as e:
            # Nếu email không tồn tại hoặc tên miền ảo -> Báo lỗi
            raise ValueError(f"Email không hợp lệ: {str(e)}")

# Thông tin lưu trong DB (có hash pass)
class UserInDB(UserBase):
    hashed_password: str

# Thông tin trả về cho client (giấu password đi)
class UserResponse(UserBase):
    pass

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
