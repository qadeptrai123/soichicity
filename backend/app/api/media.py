from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import requests
import mimetypes
from urllib.parse import urlparse
import os

router = APIRouter(prefix="/media", tags=["media"])


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
