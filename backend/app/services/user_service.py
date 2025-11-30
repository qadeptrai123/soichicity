from app.schemas.user import UserCreate
# from app.db.firebase import get_db
from app.core.security import get_password_hash # <--- Import hàm hash mật khẩu

def get_user(db, user_id: str):
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        return {"id": user.id, **user.to_dict()}
    return None

def get_user_by_email(db, email: str):
    users_ref = db.collection('users')
    # Tìm user có email trùng khớp
    query = users_ref.where('email', '==', email).limit(1)
    results = query.stream()
    for user in results:
        return {"id": user.id, **user.to_dict()}
    return None

# Thêm hàm này để Login bằng Username (nếu muốn)
def get_user_by_username(db, username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).limit(1)
    results = query.stream()
    for user in results:
        return {"id": user.id, **user.to_dict()}
    return None

def create_user(db, user: UserCreate):
    # Lấy username ra để làm ID
    user_id = user.username 
    
    # Tham chiếu đến đúng vị trí document tên là "user_id"
    user_ref = db.collection('users').document(user_id)

    # 1. Kiểm tra xem user này đã tồn tại chưa (Quan trọng)
    if user_ref.get().exists:
        return None # Hoặc báo lỗi user đã tồn tại

    user_data = user.dict()
    
    # Xử lý mật khẩu
    plain_password = user_data.pop("password") 
    user_data["hashed_password"] = get_password_hash(plain_password)
    user_data["is_active"] = True
    
    # 2. Thay vì dùng .add(), ta dùng .set() để lưu với ID do mình chọn
    user_ref.set(user_data)
    
    # Trả về kết quả
    return {"id": user_id, **user_data}

def update_password(db, username: str, new_hashed_password: str):
    """Cập nhật mật khẩu mới cho user"""
    user_ref = db.collection('users').document(username)
    
    if not user_ref.get().exists:
        return False
        
    # Chỉ update trường hashed_password, giữ nguyên các trường khác
    user_ref.update({
        "hashed_password": new_hashed_password
    })
    return True