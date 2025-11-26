from fastapi import APIRouter, Depends
from app.db.firebase import get_db
from app.services import user_service

router = APIRouter()

@router.get("/users/", tags=["users"])
def read_users(db=Depends(get_db)):
    return user_service.get_users(db)

@router.get("/users/{user_id}", tags=["users"])
def read_user(user_id: str, db=Depends(get_db)):
    return user_service.get_user(db, user_id)