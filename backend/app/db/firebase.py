import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.core.config import settings
import os
import uuid

# Check if the app is already initialized
if not firebase_admin._apps:
    # If you have the service account file locally
    if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH):
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
    else:
        # Or if you have the credentials in environment variables (e.g., for deployment)
        cred = credentials.Certificate({
            "type": os.environ.get("FIREBASE_TYPE"),
            "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
            "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.environ.get("FIREBASE_PRIVATE_KEY").replace('\n', '\n'),
            "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
            "auth_uri": os.environ.get("FIREBASE_AUTH_URI"),
            "token_uri": os.environ.get("FIREBASE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.environ.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
            "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_X509_CERT_URL")
        })

    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })

db = firestore.client()
bucket = storage.bucket()


async def get_user_by_username(username: str):
    doc_ref = db.collection("users").document(username)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None

async def create_new_user(user_data: dict):
    username = user_data["username"]
    doc_ref = db.collection("users").document(username)
    
    if doc_ref.get().exists:
        return False
        
    doc_ref.set(user_data)
    return True

def get_db():
    return db

def upload_file(file, filename: str, content_type: str, folder: str = "uploads") -> str:
    blob = bucket.blob(f"{folder}/{uuid.uuid4()}_{filename}")
    blob.upload_from_file(file, content_type=content_type)
    blob.make_public()
    return blob.public_url