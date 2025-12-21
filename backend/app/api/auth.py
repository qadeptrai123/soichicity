# app/api/auth.py
import requests
# import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.db.firebase import get_db
from app.services import user_service
from app.schemas.user import UserCreate, UserResponse
from app.core.config import settings
from firebase_admin import auth

router = APIRouter()

# API register
@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db=Depends(get_db)):
    # Logic: Create user in Auth -> Get UID -> Create doc in Firestore
    # Check duplicate username in Firestore
    users_ref = db.collection('users')
    if not users_ref.where('username', '==', user_in.username).get() == []:
         raise HTTPException(status_code=400, detail="Username already taken")

    user = user_service.create_user(db, user_in)
    return user

# API login
@router.post("/login", tags=["auth"]) 
def login(db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login supports both Email and Username.
    """
    login_identifier = form_data.username # Users can enter either username or email here
    password = form_data.password
    email_to_login = None

    # STEP 1: Determine if input is Email or Username
    if "@" in login_identifier:
        # Input is Email
        email_to_login = login_identifier
    else:
        # Input is Username -> Need to find Email from Firestore
        # Make sure you have the get_user_by_username function in user_service
        user_data = user_service.get_user_by_username(db, login_identifier)
        if not user_data:
            # Username not found in DB
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        email_to_login = user_data.get("email")

    # STEP 2: Check User Record on Firebase Auth (to handle Google Auth case)
    if email_to_login:
        user_record = user_service.get_user_by_email_admin(email_to_login)
        
        if user_record:
            # Get list of providers (e.g., password, google.com)
            providers = [p.provider_id for p in user_record.provider_data]
            has_password_provider = 'password' in providers
            
            # If user only has Google Auth and hasn't set a password
            if 'google.com' in providers and not has_password_provider:
                raise HTTPException(
                    status_code=400, 
                    detail="This email is registered with Google Auth. Please use 'Continue with Google' or use the Forgot Password feature to set a password."
                )
    else:
         raise HTTPException(status_code=400, detail="Invalid user data")

    # STEP 3: Call Firebase REST API to verify password
    request_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_API_KEY}"
    payload = {
        "email": email_to_login, 
        "password": password,
        "returnSecureToken": True
    }
    
    response = requests.post(request_url, json=payload)
    data = response.json()
    
    if "error" in data:
        error_msg = data["error"]["message"]
        if error_msg in ["EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS"]:
             raise HTTPException(status_code=400, detail="Incorrect username/email or password")
        elif error_msg == "USER_DISABLED":
             raise HTTPException(status_code=400, detail="User account has been disabled.")
        elif error_msg == "TOO_MANY_ATTEMPTS_TRY_LATER":
             raise HTTPException(status_code=400, detail="Too many failed attempts. Please try again later.")
        
        raise HTTPException(status_code=400, detail=error_msg)

    # STEP 4: Embed Firestore User Data into Token (Custom Claims)
    uid = data["localId"]
    user_doc = user_service.get_user(db, uid)

    if user_doc:
        # Prepare claims (ensure JSON serializable)
        claims = {
            "username": user_doc.get("username"),
            "full_name": user_doc.get("full_name"),
            "avatar_url": user_doc.get("avatar_url"),
            "is_active": user_doc.get("is_active"),
            "provider": user_doc.get("provider"),
            # Add counts for initial state
            "followers_count": user_doc.get("followers_count", 0),
            "followings_count": user_doc.get("followings_count", 0),
        }
        
        # Remove None values to avoid errors
        claims = {k: v for k, v in claims.items() if v is not None}

        try:
            # 1. Set Custom Claims on Firebase User Record (Persistent)
            auth.set_custom_user_claims(uid, claims)

            # 2. Immediately reflect these claims in the returned token
            # Create a Custom Token
            custom_token = auth.create_custom_token(uid, claims)
            
            # Exchange Custom Token for a new ID Token
            exchange_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={settings.FIREBASE_API_KEY}"
            exchange_res = requests.post(exchange_url, json={
                "token": custom_token.decode("utf-8") if isinstance(custom_token, bytes) else custom_token,
                "returnSecureToken": True
            })
            exchange_data = exchange_res.json()

            if "idToken" in exchange_data:
                data["idToken"] = exchange_data["idToken"]
                data["refreshToken"] = exchange_data["refreshToken"]
                # expiresIn usually resets too
                data["expiresIn"] = exchange_data["expiresIn"]

        except Exception as e:
            print(f"Error checking/setting custom claims: {e}")
            # Non-blocking: If claims fail, return original token
            pass

    return {
        "access_token": data["idToken"], 
        "token_type": "bearer",
        "refresh_token": data["refreshToken"],
        "expires_in": int(data["expiresIn"])
    }