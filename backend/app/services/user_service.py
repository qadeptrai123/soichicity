# app/services/user_service.py
from firebase_admin import auth
from app.schemas.user import UserCreate
from fastapi import HTTPException
import uuid

def get_user(db, user_id: str):
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        return {"id": user.id, **user.to_dict()}
    return None

def get_user_by_email_admin(email: str):
    """
    Use Firebase Admin SDK to get user info from Auth (not Firestore)
    To check if this user registered with Google or Password
    """
    try:
        user_record = auth.get_user_by_email(email)
        return user_record
    except auth.UserNotFoundError:
        return None
    
def get_user_by_username(db, username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).limit(1)
    results = query.stream()
    for user in results:
        return {"id": user.id, **user.to_dict()}
    return None
def create_user(db, user: UserCreate):
    # 1. Create User on Firebase Authentication
    try:
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.username, # Temporarily store username in display_name
            email_verified=True
        )
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered in Firebase Auth")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating user: {str(e)}")

    # 2. Get UID from Firebase response to use as Document ID
    user_id = user_record.uid
    
    # 3. Prepare data to save to Firestore
    # Username handling logic: If user registers with Google (not in this flow but logic needed)
    # then username might need to be random. Here is the Email Register flow so take from input.
    
    user_data = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": True,
        "provider": "password" # Mark as user using password
    }

    user_ref = db.collection('users').document(user_id)
    
    # Check if document already exists (to prevent rare conflicts)
    if user_ref.get().exists:
         pass 

    user_ref.set(user_data)
    
    return {"id": user_id, **user_data}

# Function to update user when logging in with Google for the first time (Sync User)
def sync_google_user(db, decoded_token):
    # Get information from Google's Token
    uid = decoded_token['uid']
    email = decoded_token.get('email')
    name = decoded_token.get('name', '')

    # Create a random Username (Because Google doesn't have username)
    base_username = email.split('@')[0]
    username = f"{base_username}_{uuid.uuid4().hex[:4]}"

    # Prepare data
    user_data = {
        "username": username,
        "email": email,
        "full_name": name,
        "is_active": True,
        "provider": "google"
    }
    
    # Save to Firestore here
    db.collection('users').document(uid).set(user_data)
    
    return {"id": uid, **user_data}
