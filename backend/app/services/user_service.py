from app.schemas.user import UserCreate
from app.db.firebase import get_db

def get_user(db, user_id: str):
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        return {"id": user.id, **user.to_dict()}
    return None

def get_user_by_email(db, email: str):
    users_ref = db.collection('users')
    query = users_ref.where('email', '==', email).limit(1)
    results = query.stream()
    for user in results:
        return {"id": user.id, **user.to_dict()}
    return None

def get_users(db, skip: int = 0, limit: int = 100):
    users_ref = db.collection('users').limit(limit).offset(skip)
    results = users_ref.stream()
    return [{"id": user.id, **user.to_dict()} for user in results]

def create_user(db, user: UserCreate):
    # In a real app, you would hash the password here
    user_data = user.dict()
    user_data.pop("password") # Don't store the password directly
    user_data["hashed_password"] = "fake_hashed_password" # Placeholder
    user_data["is_active"] = True
    
    # Add a new doc in collection 'users' with a generated id
    update_time, user_ref = db.collection('users').add(user_data)
    
    # To get the created user data, we need to get the document
    user_doc = user_ref.get()
    return {"id": user_doc.id, **user_doc.to_dict()}