from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.db.firebase import get_db
from app.services import user_service

# TokenUrl này trỏ tới hàm login ở file auth.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token") 

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Giải mã Token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Lấy username (hoặc email) từ payload. 
        # Tùy lúc tạo token bạn lưu gì vào "sub". Ở bước dưới mình sẽ lưu username.
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Tìm user trong DB
    user = user_service.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    
    return user