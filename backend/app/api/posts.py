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
        user_id=user["id"],
        content=post.content,
        link_url=post.link_url   # thêm đây
    )
    return created


@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    user = Depends(get_current_user),
    limit: int = 20  # lấy tối đa 20 post
):
    return PostService.get_feed_posts(user["id"], limit)

@router.post("/posts/{post_id}/seen")
def mark_seen(post_id: str, user = Depends(get_current_user)):
    PostService.mark_post_as_seen(user["id"], post_id)
    return {"status": "ok"}


