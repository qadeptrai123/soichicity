from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
import requests
import mimetypes
from urllib.parse import urlparse
import os
from PIL import Image
import io
import uuid
from app.db.firebase import upload_file

router = APIRouter(prefix="/media", tags=["media"])

def compress_image(file_bytes: bytes, filename: str) -> tuple[io.BytesIO, str, str]:
    """
    Compress image to max 1024x1024 and convert to JPEG/WebP.
    Returns (compressed_io, new_filename, content_type)
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        
        # Orient the image if it has EXIF data (e.g. from mobile)
        try:
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # Convert to RGB if necessary (e.g. PNG with alpha to JPEG)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Resize if too large
        max_size = (1024, 1024)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to buffer
        output = io.BytesIO()
        # Default to JPEG for avatars/photos
        img.save(output, format="JPEG", quality=80, optimize=True)
        output.seek(0)
        
        new_filename = os.path.splitext(filename)[0] + ".jpg"
        return output, new_filename, "image/jpeg"
        
    except Exception as e:
        print(f"Image compression failed: {e}")
        # Return original if compression fails, but need a BytesIO of original
        return io.BytesIO(file_bytes), filename, mimetypes.guess_type(filename)[0] or "application/octet-stream"


@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    """
    Upload generic media (mainly for avatars/images).
    Includes auto-compression for images.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed for this endpoint")
        
    try:
        content = await file.read()
        
        # Compress
        compressed_io, new_filename, content_type = compress_image(content, file.filename)
        
        # Upload to Firebase
        # Using a distinct folder 'uploads' or 'avatars'? Let's use 'uploads' for generic
        # or 'avatars' if we want. Let's use 'media' for now.
        # Add random suffix to avoid collision
        suffix = str(uuid.uuid4())[:8]
        distinct_filename = f"{os.path.splitext(new_filename)[0]}_{suffix}{os.path.splitext(new_filename)[1]}"
        
        url = upload_file(compressed_io, distinct_filename, content_type, folder="media")
        
        return {"url": url}
        
    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.get("/download")
def download_media(url: str = Query(...)):
    try:
        # request stream từ firebase
        resp = requests.get(url, stream=True, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Cannot fetch media")

        content_type = resp.headers.get("content-type", "application/octet-stream")

        # đoán extension
        ext = mimetypes.guess_extension(content_type) or ""

        # fallback nếu firebase không trả chuẩn
        if ext == "" and "video" in content_type:
            ext = ".mp4"
        elif ext == "" and "image" in content_type:
            ext = ".jpg"

        filename = f"media{ext}"

        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"'
        }

        return StreamingResponse(
            resp.iter_content(chunk_size=8192),
            media_type=content_type,
            headers=headers
        )

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Download failed")
