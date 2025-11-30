from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_DIR = BASE_DIR / "app/secrets"

# print(BASE_DIR)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Threads-like API"
    API_V1_STR: str = "/api/v1"
    
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: str = str(SECRET_DIR / "soichicity-firebase-adminsdk-fbsvc-2f60fa38c3.json")

    # --- JWT AUTH ---
    SECRET_KEY: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- EMAIL CONFIG ---
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Soichi Threads App"

    # --- CẤU HÌNH ĐỂ ĐỌC FILE .ENV ---
    class Config:
        case_sensitive = True
        # Chỉ định đường dẫn tới file .env trong thư mục secrets
        env_file = str(SECRET_DIR / ".env")
        env_file_encoding = 'utf-8'
        # Nếu trong .env có biến thừa thì bỏ qua, không báo lỗi
        extra = "ignore"

settings = Settings()
print(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)