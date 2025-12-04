# from fastapi import APIRouter, Depends
# from app.schemas.post import PostCreate, PostResponse
# from app.services.post_service import PostService
# from typing import List
# from app.api.deps import get_current_user

# router = APIRouter()

# @router.post("/posts", response_model=PostResponse)
# def create_post(
#     post: PostCreate,
#     user = Depends(get_current_user)   # đã có user từ auth
# ):
#     created = PostService.create_post(
#         user_id=user["id"],
#         content=post.content,
#         link_url=post.link_url   # thêm đây
#     )
#     return created


# @router.get("/posts", response_model=List[PostResponse])
# def get_posts(
#     user = Depends(get_current_user),
#     limit: int = 20  # lấy tối đa 20 post
# ):
#     return PostService.get_feed_posts(user["id"], limit)

# @router.post("/posts/{post_id}/seen")
# def mark_seen(post_id: str, user = Depends(get_current_user)):
#     PostService.mark_post_as_seen(user["id"], post_id)
#     return {"status": "ok"}

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List
# Import thêm Comment schemas
from app.schemas.post import PostCreate, PostResponse, CommentCreate, CommentResponse, PostCreateForm
from app.db.firebase import upload_file
from app.services.post_service import PostService
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/posts", response_model=PostResponse)
def create_post(
    form_data: PostCreateForm = Depends(),
    user = Depends(get_current_user)
):
    image_urls = []
    if form_data.files:
        for file in form_data.files:
            # file.file is the file-like object
            url = upload_file(file.file, file.filename, file.content_type, folder="posts")
            image_urls.append(url)

    created = PostService.create_post(
        user_id=user["id"],
        content=form_data.content,
        link_url=image_urls 
    )
    return created

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    user = Depends(get_current_user),
    limit: int = 20
):
    # Logic lấy feed (đã lọc bài đã xem)
    return PostService.get_feed_posts(user["id"], limit)

# --- CÁC API MỚI CHO SUB-COLLECTIONS (LIKE, SHARE, COMMENT) ---

@router.post("/posts/{post_id}/like")
def like_post(post_id: str, user = Depends(get_current_user)):
    # Lấy avatar user (đề phòng nếu token không có field avatar thì để rỗng)
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    return PostService.toggle_interaction(
        collection_name="likes", 
        count_field="likeCount", 
        post_id=post_id, 
        user_id=user["id"],
        user_avatar=avatar
    )

@router.post("/posts/{post_id}/share")
def share_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    return PostService.toggle_interaction(
        collection_name="shares", 
        count_field="shareCount", 
        post_id=post_id, 
        user_id=user["id"],
        user_avatar=avatar
    )

@router.post("/posts/{post_id}/save")
def save_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    return PostService.toggle_interaction(
        collection_name="saves", 
        count_field="saveCount", 
        post_id=post_id, 
        user_id=user["id"],
        user_avatar=avatar
    )

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: str, 
    comment: CommentCreate, 
    user = Depends(get_current_user)
):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    return PostService.create_comment(
        post_id=post_id,
        user_id=user["id"],
        user_avatar=avatar,
        content=comment.content
    )

@router.post("/posts/{post_id}/seen")
def mark_seen(post_id: str, user = Depends(get_current_user)):
    PostService.mark_post_as_seen(user["id"], post_id)
    return {"status": "ok"}
