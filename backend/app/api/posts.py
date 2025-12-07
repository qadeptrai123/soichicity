from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List
# Import thêm Comment schemas
from app.schemas.post import PostCreate, PostResponse, CommentCreate, CommentResponse, PostCreateForm
from app.db.firebase import upload_file
from app.services.post_service import PostService
from app.services.video_service import VideoService
from app.services.video_service import VideoService
from app.api.deps import get_current_user, get_current_user_optional
import os

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
            if file.content_type.startswith("video/"):
                # 1. Compress Video
                compressed_path = VideoService.compress_video(file.file, file.filename)
                
                # 2. Upload to Firebase Storage
                with open(compressed_path, "rb") as f:
                    # Upload with same name but maybe different extension or keep it
                    # We'll rely on unique naming in upload_file or pass a new name
                    new_filename = os.path.basename(compressed_path)
                    url = upload_file(f, new_filename, "video/mp4", folder="posts")
                
                # 3. Cleanup compressed file
                if os.path.exists(compressed_path):
                    os.remove(compressed_path)
            else:
                # Upload to Firebase Storage
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
    user = Depends(get_current_user_optional),
    limit: int = 20
):
    # Logic lấy feed (đã lọc bài đã xem)
    user_id = user["id"] if user else None
    return PostService.get_feed_posts(user_id, limit)

# --- CÁC API MỚI CHO SUB-COLLECTIONS (LIKE, SHARE, COMMENT) ---

@router.post("/posts/{post_id}/like")
def like_post(post_id: str, user = Depends(get_current_user)):
    # Lấy avatar user (đề phòng nếu token không có field avatar thì để rỗng)
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="likes", 
            count_field="likeCount", 
            post_id=post_id, 
            user_id=user["id"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# @router.delete("/posts/{post_id}/like")
# def unlike_post(post_id: str, user = Depends(get_current_user)):
#     return PostService.remove_interaction(
#         collection_name="likes", 
#         count_field="likeCount", 
#         post_id=post_id, 
#         user_id=user["id"]
#     )

@router.post("/posts/{post_id}/share")
def share_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="shares", 
            count_field="shareCount", 
            post_id=post_id, 
            user_id=user["id"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/posts/{post_id}/repost")
def repost_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="reposts", 
            count_field="repostCount", 
            post_id=post_id, 
            user_id=user["id"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# @router.delete("/posts/{post_id}/share")
# def unshare_post(post_id: str, user = Depends(get_current_user)):
#     return PostService.remove_interaction(
#         collection_name="shares", 
#         count_field="shareCount", 
#         post_id=post_id, 
#         user_id=user["id"]
#     )

@router.post("/posts/{post_id}/save")
def save_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="saves", 
            count_field="saveCount", 
            post_id=post_id, 
            user_id=user["id"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# @router.delete("/posts/{post_id}/save")
# def unsave_post(post_id: str, user = Depends(get_current_user)):
#     return PostService.remove_interaction(
#         collection_name="saves", 
#         count_field="saveCount", 
#         post_id=post_id, 
#         user_id=user["id"]
#     )

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: str,
    form_data: CommentCreate = Depends(),
    user = Depends(get_current_user)
):
    avatar = user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.create_comment(
            post_id=post_id,
            user_id=user["id"],
            user_avatar=avatar,
            content=form_data.content
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/posts/{post_id}/comments/{comment_id}")
def delete_comment(
    post_id: str, 
    comment_id: str,
    user = Depends(get_current_user)
):
    result = PostService.delete_comment(post_id, comment_id, user["id"])
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
    return result

@router.post("/posts/{post_id}/seen")
def mark_seen(post_id: str, user = Depends(get_current_user)):
    PostService.mark_post_as_seen(user["id"], post_id)
    return {"status": "ok"}

@router.get("/posts/{post_id}")
def get_post_detail(
    post_id: str,
    page: int = 1,
    page_size: int = 10,
    user = Depends(get_current_user)
):
    """
    Fetch detailed post with:
    - Post metadata and content
    - Author information
    - Paginated comments (page_size capped at 100)
    - Likes & shares lists
    - Current user's interaction status (like, save, share)
    """
    # Validate pagination params
    if page < 1:
        raise HTTPException(status_code=400, detail="Page must be >= 1")
    if page_size < 1 or page_size > 100:
        raise HTTPException(status_code=400, detail="Page size must be between 1 and 100")
    
    current_user_id = user["id"] if user else None
    
    try:
        post_detail = PostService.get_post_detail(
            post_id=post_id,
            current_user_id=current_user_id,
            page=page,
            page_size=page_size
        )
        
        if not post_detail:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return post_detail
    except Exception as e:
        print(f"Error fetching post detail: {e}")
        raise HTTPException(status_code=500, detail="Error fetching post details")
