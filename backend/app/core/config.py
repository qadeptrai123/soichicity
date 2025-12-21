from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_DIR = BASE_DIR / "app/secrets"

# print(BASE_DIR)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SoiChiCity API"
    API_V1_STR: str = "/api/v1"
    
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: str = str(SECRET_DIR / "soichicity-firebase-adminsdk-fbsvc-2f60fa38c3.json")

    # --- FIREBASE AUTH ---
    FIREBASE_API_KEY: str
    FIREBASE_AUTH_DOMAIN: str
    FIREBASE_PROJECT_ID: str
    FIREBASE_STORAGE_BUCKET: str
    FIREBASE_MESSAGING_SENDER_ID: str
    FIREBASE_APP_ID: str
    FIREBASE_MEASUREMENT_ID: str

    # --- EMAIL CONFIG ---
    # MAIL_USERNAME: str
    # MAIL_PASSWORD: str
    # MAIL_FROM: str
    # MAIL_PORT: int = 587
    # MAIL_SERVER: str = "smtp.gmail.com"
    # MAIL_FROM_NAME: str = "Soichi Threads App"
    
    # Algolia Configuration
    ALGOLIA_APP_ID: str
    ALGOLIA_API_KEY: str
    ALGOLIA_ADMIN_API_KEY: str
    ALGOLIA_USERS_INDEX_NAME: str = "UsersIndex"
    ALGOLIA_POSTS_INDEX_NAME: str = "PostsIndex"

        # --- CẤU HÌNH ĐỂ ĐỌC FILE .ENV ---
    class Config:
        case_sensitive = True
        env_file = str(SECRET_DIR / ".env")
        env_file_encoding = 'utf-8'
        extra = "ignore"

settings = Settings()
print(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)