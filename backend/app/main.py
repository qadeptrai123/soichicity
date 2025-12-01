from fastapi import FastAPI
from app.api import users, threads, auth
from app.core.config import settings
from app.api import posts, media


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Include routers
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(threads.router, prefix=settings.API_V1_STR, tags=["threads"])
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])

# Posts router
app.include_router(posts.router)

# Media router
app.include_router(media.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Threads-like API"}
