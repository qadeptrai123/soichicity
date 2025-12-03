from fastapi import APIRouter, Depends
from app.schemas.post import PostCreate, PostResponse
from app.services.post_service import PostService
from typing import List
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/posts", response_model=PostResponse)
def create_post(
    post: PostCreate,
    user = Depends(get_current_user)   # đã có user từ auth
):
    created = PostService.create_post(
        user_id=user["uid"],
        title=post.title,
        content=post.content
    )
    return created


@router.get("/posts", response_model=List[PostResponse])
def get_posts():
    return PostService.list_posts()
