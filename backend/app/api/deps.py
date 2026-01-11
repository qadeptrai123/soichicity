# app/core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.db.firebase import get_db
from app.services import user_service
from typing import Optional

# Scheme 1: Used for Email/Password login flow (Form input)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login", auto_error=False)
# Scheme 2: Used for Token paste flow (Google Login or existing Token)
bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    token_str: Optional[str] = Depends(oauth2_scheme),
    token_obj: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 2. LOGIC TO PRIORITIZE TOKEN EXTRACTION
    # The final_token variable will contain the token string regardless of the method used by the user
    final_token = None

    if token_str:
        # Case when user uses Form login -> Swagger automatically fills token into header
        final_token = token_str
    elif token_obj:
        # Case when user pastes token into Bearer field -> Extract credentials
        final_token = token_obj.credentials
    
    # If both are empty -> Not logged in error
    if final_token is None:
        raise credentials_exception

    # 3. VERIFY TOKEN WITH FIREBASE
    try:
        # Add tolerance for clock skew (10 seconds)
        decoded_token = auth.verify_id_token(final_token, clock_skew_seconds=10)
        uid = decoded_token['uid']
    except Exception as e:
        print(f"Firebase Token Error: {e}")
        raise credentials_exception
    
    # 4. GET USER FROM DB
    user = user_service.get_user(db, user_id=uid)
    
    if user is None:
        # Sync user if it's the first time Google Login
        user = user_service.sync_google_user(db, decoded_token)
    
    return user

async def get_current_user_optional(
    token_str: Optional[str] = Depends(oauth2_scheme),
    token_obj: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db = Depends(get_db)
):
    """
    Returns user object if authenticated, else None.
    Does NOT raise 401.
    """
    final_token = None
    if token_str:
        final_token = token_str
    elif token_obj:
        final_token = token_obj.credentials
    
    if final_token is None:
        return None

    try:
        decoded_token = auth.verify_id_token(final_token, clock_skew_seconds=10)
        uid = decoded_token['uid']
        user = user_service.get_user(db, user_id=uid)
        return user
    except Exception:
        # Ignore invalid tokens for optional auth
        return None