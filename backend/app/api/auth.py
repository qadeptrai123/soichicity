from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.db.firebase import get_db
from app.services import user_service

router = APIRouter()

@router.post("/token", tags=["auth"])
def login(db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_service.get_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # In a real app, you would verify the password
    # For now, we'll just return a fake token
    return {"access_token": user["id"], "token_type": "bearer"}