from fastapi import APIRouter, Depends
from app.db.firebase import get_db
from app.services import user_service
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/users/", tags=["users"])
def read_users(db=Depends(get_db)):
    return user_service.get_users(db)

@router.get("/users/{user_id}", tags=["users"])
def read_user(user_id: str, db=Depends(get_db)):
    return user_service.get_user(db, user_id)

# This API is used for both regular Login and Google Login
# Frontend sends Header: "Authorization: Bearer <Google_ID_Token>"
@router.get("/me", tags=["users"])
def read_users_me(current_user = Depends(get_current_user)):
    """
    Returns information about the currently logged-in user.
    If the user logs in with Google for the first time, the system will automatically create a profile in the DB 
    before returning this result.
    """
    return current_user