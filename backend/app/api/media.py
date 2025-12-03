# from fastapi import APIRouter, UploadFile, File
# from app.db.firebase import upload_file_to_storage, db

# router = APIRouter(
#     prefix="/api/v1",
#     tags=["media"]
# )

# @router.post("/upload-media/{username}")
# async def upload_media(username: str, file: UploadFile = File(...)):

#     file_location = f"/tmp/{file.filename}"

#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     storage_path = f"media/{username}/{file.filename}"

#     public_url = upload_file_to_storage(file_location, storage_path)

#     db.collection("users").document(username).update({
#         "media": public_url
#     })

#     return {
#         "success": True,
#         "media_url": public_url
#     }
