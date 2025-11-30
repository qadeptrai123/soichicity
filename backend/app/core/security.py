from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings # Lấy SECRET_KEY từ config

# Cấu hình thuật toán băm mật khẩu là Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. Hàm xác thực mật khẩu
# Dùng khi User đăng nhập: So sánh mật khẩu họ nhập với mật khẩu đã mã hóa trong DB
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 2. Hàm mã hóa mật khẩu
# Dùng khi User đăng ký: Biến password thô thành hash trước khi lưu vào DB
def get_password_hash(password):
    return pwd_context.hash(password)

# 3. Hàm tạo JWT Token
# Dùng để cấp "thẻ bài" cho user sau khi login thành công
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Tính thời gian hết hạn của token
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Mặc định token sống trong số phút đã cài trong settings
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Mã hóa dữ liệu thành chuỗi JWT
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt