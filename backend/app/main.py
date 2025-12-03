from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import users, threads, auth
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Thêm CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(threads.router, prefix=settings.API_V1_STR, tags=["threads"])
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Threads-like API"}