from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.db.firebase import get_db
from app.services import user_service
from app.core.security import verify_password, create_access_token, get_password_hash # Import từ core
from app.schemas.user import UserCreate, UserResponse, PasswordRecoveryRequest, PasswordResetConfirm
from jose import JWTError, jwt  
from app.core.config import settings
from datetime import timedelta
from app.services.email_service import send_reset_password_email

router = APIRouter()

# API Đăng ký
@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db=Depends(get_db)):
    user = user_service.create_user(db, user_in)
    if not user:
         raise HTTPException(status_code=400, detail="Email already registered")
    return user

# API Đăng nhập
@router.post("/token", tags=["auth"])
def login(db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Tìm user theo username
    # Lưu ý: form_data.username là trường user nhập vào (có thể là username hoặc email tùy FE gửi)
    user = user_service.get_user_by_username(db, form_data.username) 
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 2. Kiểm tra mật khẩu (So sánh pass nhập vào với hash trong DB)
    if not verify_password(form_data.password, user["hashed_password"]):
         raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 3. Tạo Token thật ? 
    access_token = create_access_token(data={"sub": user["username"]})
    
    return {"access_token": access_token, "token_type": "bearer"}

# API recover password
@router.post("/password-recovery", tags=["auth"])
async def recover_password(payload: PasswordRecoveryRequest, db=Depends(get_db)):
    """
    Bước 1: User gửi email.
    Server kiểm tra và gửi link reset (Mô phỏng in ra Console).
    """
    # 1. Tìm user theo email
    user = user_service.get_user_by_email(db, payload.email)
    
    # Bảo mật: Dù email có hay không, cũng trả về thông báo giống nhau 
    # để tránh hacker dò xem email nào đã đăng ký.
    if not user:
        # Giả vờ thành công
        return {"message": "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."}
    
    # 2. Tạo Token reset (Chỉ sống 15 phút)
    # Ta dùng lại hàm create_access_token nhưng với mục đích khác
    reset_token = create_access_token(
        data={"sub": user["username"], "type": "reset"}, # Thêm type để phân biệt
        expires_delta=timedelta(minutes=15)
    )
    
    try:
        await send_reset_password_email(payload.email, reset_token)
    except Exception as e:
        print(f"Lỗi gửi mail: {e}")
        # Tùy chọn: Có thể return lỗi 500 nếu muốn báo cho user biết
    
    return {"message": "Email hướng dẫn đã được gửi!"}

# --- 4. RESET PASSWORD (ĐỔI MẬT KHẨU THẬT) ---
@router.post("/reset-password", tags=["auth"])
def reset_password(payload: PasswordResetConfirm, db=Depends(get_db)):
    """
    Bước 2: User gửi token nhận được từ email + mật khẩu mới.
    """
    # 1. Giải mã Token
    try:
        decoded_data = jwt.decode(payload.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = decoded_data.get("sub")
        token_type = decoded_data.get("type")
        
        if username is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Token expired or invalid")
        
    # 2. Mã hóa mật khẩu mới
    new_hashed_pw = get_password_hash(payload.new_password)
    
    # 3. Lưu vào DB
    success = user_service.update_password(db, username, new_hashed_pw)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Password updated successfully"}