from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse, UserUpdate
from typing import Optional
from app.db.firebase import get_db
from app.services import user_service
from app.api.deps import get_current_user, get_current_user_optional

router = APIRouter()

@router.get("/users/", tags=["users"])
def read_users(db=Depends(get_db)):
    return user_service.get_users(db)

@router.get("/users/{user_id}", tags=["users"])
def read_user(user_id: str, db=Depends(get_db)):
    return user_service.get_user(db, user_id)

@router.get("/users/profile/{username}", tags=["users"])
def get_user_profile_by_username(
    username: str, 
    db=Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional) # Thay đổi ở đây
):
    """
    Get user profile. Supports fetching interaction status if current_user is provided.
    """
    current_user_id = current_user['uid'] if current_user else None
    return user_service.get_user_profile(db, username, current_user_id)
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

@router.put("/users/me", tags=["users"], response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Update current user profile.
    Only updates fields that are provided (partial update).
    """
    return user_service.update_user(db, current_user['uid'], user_update)

@router.post("/users/{target_user_id}/follow", tags=["users"])
def follow_user(target_user_id: str, db=Depends(get_db), current_user = Depends(get_current_user)):
    """
    Current user follows the target user.
    """
    return user_service.follow_user(db, current_user['uid'], target_user_id)

@router.post("/users/{target_user_id}/unfollow", tags=["users"])
def unfollow_user(target_user_id: str, db=Depends(get_db), current_user = Depends(get_current_user)):
    """
    Current user unfollows the target user.
    """
    return user_service.unfollow_user(db, current_user['uid'], target_user_id)

@router.get("/users/{user_id}/posts", tags=["users"])
def get_user_posts(
    user_id: str, 
    limit: int = 10, 
    cursor: Optional[str] = None, # Cursor chính là last_post_id
    type: str = "posts", # posts, replies, media, all
    db=Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    API này thay thế cho việc load tất cả post trong get_user_profile
    """
    current_user_id = current_user['uid'] if current_user else None
    return user_service.get_user_posts_paginated(db, user_id, limit, cursor, post_type=type, current_user_id=current_user_id)

@router.get("/users/{user_id}/reposts", tags=["users"])
def get_user_reposts(
    user_id: str, 
    limit: int = 10, 
    cursor: Optional[str] = None, 
    db=Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get user reposts
    """
    current_user_id = current_user['uid'] if current_user else None
    return user_service.get_user_reposts_paginated(db, user_id, limit, cursor, current_user_id=current_user_id)

@router.get("/users/{user_id}/following", tags=["users"])
def get_user_following(
    user_id: str, 
    limit: int = 10,
    cursor: Optional[str] = None,
    db=Depends(get_db), 
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get list of users that the specified user is following (Paginated).
    """
    current_user_id = current_user['uid'] if current_user else None
    return user_service.get_users_following_paginated(db, user_id, limit, cursor, current_user_id)

@router.get("/users/{user_id}/followers", tags=["users"])
def get_user_followers(
    user_id: str, 
    limit: int = 10,
    cursor: Optional[str] = None,
    db=Depends(get_db), 
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get list of users who are following the specified user (Paginated).
    """
    current_user_id = current_user['uid'] if current_user else None
    return user_service.get_users_followers_paginated(db, user_id, limit, cursor, current_user_id)

@router.post("/users/{target_user_id}/block", tags=["users"])
def block_user(target_user_id: str, db=Depends(get_db), current_user = Depends(get_current_user)):
    """
    Block a user.
    """
    return user_service.block_user(db, current_user['uid'], target_user_id)

@router.post("/users/{target_user_id}/unblock", tags=["users"])
def unblock_user(target_user_id: str, db=Depends(get_db), current_user = Depends(get_current_user)):
    """
    Unblock a user.
    """
    return user_service.unblock_user(db, current_user['uid'], target_user_id)

@router.get("/users/me/blocks", tags=["users"])
def get_blocked_users(db=Depends(get_db), current_user = Depends(get_current_user)):
    """
    Get list of blocked users.
    """
    return user_service.get_blocked_users(db, current_user['uid'])