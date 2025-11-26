from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_DIR = BASE_DIR / "app/secrets"

# print(BASE_DIR)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Threads-like API"
    API_V1_STR: str = "/api/v1"
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: str = str(SECRET_DIR / "soichicity-firebase-adminsdk-fbsvc-2f60fa38c3.json")

    class Config:
        case_sensitive = True

settings = Settings()
print(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)