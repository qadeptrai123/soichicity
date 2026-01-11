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

# ... existing imports ...
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

import asyncio
from concurrent.futures import ProcessPoolExecutor
import shutil
import tempfile

# Global ProcessPoolExecutor (Lazy)
_process_pool = None

def get_process_pool():
    global _process_pool
    if _process_pool is None:
        _process_pool = ProcessPoolExecutor(max_workers=2)
    return _process_pool

def save_to_temp_file(upload_file, suffix):
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, 'wb') as tmp:
        shutil.copyfileobj(upload_file.file, tmp)
    return path

def compress_video_process(input_path):
    # Wrapper for ProcessPool
    # Must import VideoService here if not picklable? 
    # VideoService is a class, imports should be fine.
    try:
        # Re-import inside process to avoid pickling complex objects if necessary, 
        # though VideoService is just a class with static methods.
        # But we need to ensure 'input_path' is valid.
        with open(input_path, "rb") as f:
            return VideoService.compress_video(f, os.path.basename(input_path))
    except Exception as e:
        print(f"Compression error: {e}")
        # Ensure cleanup if wrapper fails
        if os.path.exists(input_path):
            os.remove(input_path)
        raise e

def upload_post_media(path, folder="posts"):
    with open(path, "rb") as f:
        new_filename = os.path.basename(path)
        return upload_file(f, new_filename, "video/mp4", folder=folder)

@router.post("/posts", response_model=PostResponse)
async def create_post(
    form_data: PostCreateForm = Depends(),
    user = Depends(get_current_user)
):
    image_urls = []
    if form_data.files:
        loop = asyncio.get_event_loop()
        
        for file in form_data.files:
            # file.file is the file-like object
            if file.content_type.startswith("video/"):
                # 1. Compress Video (Process Bound)
                # Save to temp
                temp_input_path = await run_in_threadpool(
                    save_to_temp_file, 
                    file, 
                    f"_{file.filename}"
                )

                # Run compression in Process Pool
                try:
                    compressed_path = await loop.run_in_executor(
                        get_process_pool(), 
                        compress_video_process, 
                        temp_input_path
                    )
                except Exception as e:
                    # Cleanup temp if compression failed
                    if os.path.exists(temp_input_path):
                        os.remove(temp_input_path)
                    print(f"Compression processing failed: {e}")
                    raise HTTPException(status_code=500, detail="Video processing failed")
                
                # Cleanup input
                if os.path.exists(temp_input_path):
                    os.remove(temp_input_path)

                # 2. Upload to Firebase Storage (IO Bound)
                try:
                    url = await run_in_threadpool(upload_post_media, compressed_path, "posts")
                finally:
                   # 3. Cleanup compressed file
                   if os.path.exists(compressed_path):
                       os.remove(compressed_path)
            else:
                # Upload Image (IO Bound)
                def upload_params_wrapper(f_obj, f_name, f_type):
                    return upload_file(f_obj, f_name, f_type, folder="posts")

                url = await run_in_threadpool(
                    upload_params_wrapper, 
                    file.file, 
                    file.filename, 
                    file.content_type
                )
            
            image_urls.append(url)

    # Database operation
    created = await run_in_threadpool(
        PostService.create_post,
        user_id=user["uid"],
        content=form_data.content,
        media_urls=image_urls,
        level=form_data.level,
        reply_to_id=form_data.reply_to_id
    )
    return created

@router.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    form_data: PostCreateForm = Depends(),
    user = Depends(get_current_user)
):
    # Process new files if any
    new_media_urls = []
    if form_data.files:
        loop = asyncio.get_event_loop()
        
        for file in form_data.files:
            if file.content_type.startswith("video/"):
                 # 1. Compress Video (Same logic as create)
                temp_input_path = await run_in_threadpool(
                    save_to_temp_file, 
                    file, 
                    f"_{file.filename}"
                )

                try:
                    compressed_path = await loop.run_in_executor(
                        get_process_pool(), 
                        compress_video_process, 
                        temp_input_path
                    )
                except Exception as e:
                    if os.path.exists(temp_input_path):
                        os.remove(temp_input_path)
                    raise HTTPException(status_code=500, detail="Video processing failed")
                
                if os.path.exists(temp_input_path):
                    os.remove(temp_input_path)

                try:
                    url = await run_in_threadpool(upload_post_media, compressed_path, "posts")
                finally:
                   if os.path.exists(compressed_path):
                       os.remove(compressed_path)
            else:
                def upload_params_wrapper(f_obj, f_name, f_type):
                    return upload_file(f_obj, f_name, f_type, folder="posts")

                url = await run_in_threadpool(
                    upload_params_wrapper, 
                    file.file, 
                    file.filename, 
                    file.content_type
                )
            
            new_media_urls.append(url)

    # Get existing media URLs from form/body if sent as 'gallery' or special field
    # In FastAPI Form, repeated keys like 'gallery' come as list if defined in schema or handled manually
    # But PostCreateForm definition might not include 'gallery'.
    # We need to update PostCreateForm or handle it here. 
    # Since PostCreateForm uses Form(...), we can use Request or update Schema.
    # Let's check PostCreateForm in `app/schemas/post.py`. 
    # It currently has: content, files, level, reply_to_id.
    # We should add 'gallery' or 'kept_media' to it or a new Schema for Update.
    
    # For now, let's assume we update PostCreateForm or just use Request to get extra form fields 
    # OR simpler: The user sends existing urls in 'content' if they are embedded? No, they are attachments.
    
    # Let's rely on Service to handle logic, but we need to pass data.
    # We will assume client sends 'kept_media' in body? 
    # But strict Form parsing might ignore it.
    
    # Let's update `PostCreateForm` in next step or assume we can get it via standard Form param in this function signature?
    # Adding `gallery: List[str] = Form([])` to signature works for multiple values.
    
    return await run_in_threadpool(
        PostService.update_post,
        post_id=post_id,
        user_id=user["uid"],
        content=form_data.content,
        new_media_urls=new_media_urls,
        existing_media_urls=form_data.gallery
    )

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    user = Depends(get_current_user_optional),
    limit: int = 20,
    filter: str = "all", # New optional parameter
    cursor: str = None # New cursor parameter
):
    # Logic lấy feed (đã lọc bài đã xem)
    user_id = user["uid"] if user else None
    try:
        return PostService.get_feed_posts(user_id, limit, filter, cursor)
    except Exception as e:
        print(f"Error in get_posts: {e}")
        raise HTTPException(status_code=500, detail=f"Feed Error: {str(e)}")

# --- CÁC API MỚI CHO SUB-COLLECTIONS (LIKE, SHARE, COMMENT) ---

@router.post("/posts/{post_id}/like")
def like_post(post_id: str, user = Depends(get_current_user)):
    # Lấy avatar user (đề phòng nếu token không có field avatar thì để rỗng)
    avatar = user.get("avatar_url", "") or user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="likes", 
            count_field="likes_count", 
            post_id=post_id, 
            user_id=user["uid"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error liking post: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# @router.delete("/posts/{post_id}/like")
# def unlike_post(post_id: str, user = Depends(get_current_user)):
#     return PostService.remove_interaction(
#         collection_name="likes", 
#         count_field="likeCount", 
#         post_id=post_id, 
#         user_id=user["uid"]
#     )

@router.post("/posts/{post_id}/share")
def share_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar_url", "") or user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="shares", 
            count_field="reposts_count", 
            post_id=post_id, 
            user_id=user["uid"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error sharing post: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/posts/{post_id}/repost")
def repost_post(post_id: str, user = Depends(get_current_user)):
    avatar = user.get("avatar_url", "") or user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="reposts", 
            count_field="reposts_count", 
            post_id=post_id, 
            user_id=user["uid"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error reposting post: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
    avatar = user.get("avatar_url", "") or user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.toggle_interaction(
            collection_name="saves", 
            count_field="saves_count", 
            post_id=post_id, 
            user_id=user["uid"],
            user_avatar=avatar
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error saving post: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
    avatar = user.get("avatar_url", "") or user.get("avatar", "") or user.get("picture", "")
    
    try:
        return PostService.create_comment(
            post_id=post_id,
            user_id=user["uid"],
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
    result = PostService.delete_comment(post_id, comment_id, user["uid"])
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
    return result

@router.post("/posts/{post_id}/seen")
def mark_seen(post_id: str, user = Depends(get_current_user)):
    PostService.mark_post_as_seen(user["uid"], post_id)
    return {"status": "ok"}

@router.get("/posts/{post_id}")
def get_post_detail(
    post_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Fetch complete post detail.
    """
    current_user_id = user["uid"] if user else None
    
    try:
        post_detail = PostService.get_post_detail(
            post_id=post_id,
            current_user_id=current_user_id
        )
        
        if not post_detail:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return post_detail
    except Exception as e:
        print(f"Error fetching post detail: {e}")
        raise HTTPException(status_code=500, detail="Error fetching post details")

@router.get("/posts/{post_id}/replies")
def get_post_replies(
    post_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Fetch all replies to a target post (Level 1).
    """
    current_user_id = user["uid"] if user else None
    print(f"DTO DEBUG: get_post_replies user={user} user_id={current_user_id}")
    try:
        replies = PostService.get_replies(post_id, current_user_id)
        return replies
    except Exception as e:
        print(f"Error fetching replies: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error fetching replies")

@router.get("/posts/{post_id}/activity")
def get_post_activity(
    post_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Fetch detailed activity (likes, reposts) for a post.
    """
    current_user_id = user["uid"] if user else None
    
    try:
        activity_data = PostService.get_post_activity(post_id, current_user_id)
        return activity_data
    except Exception as e:
        print(f"Error fetching post activity: {e}")
        raise HTTPException(status_code=500, detail="Error fetching post activity")
