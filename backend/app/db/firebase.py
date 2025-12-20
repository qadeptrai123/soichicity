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

# --- NEW: Firebase Query Helpers ---

def get_subcollection_docs(collection: str, doc_id: str, subcollection: str, order_by: str = None, direction = None, limit: int = None, offset: int = None):
    """
    Efficiently fetch documents from a subcollection with optional filtering.
    
    Args:
        collection: Parent collection name (e.g., 'posts')
        doc_id: Parent document ID
        subcollection: Subcollection name (e.g., 'comments', 'likes')
        order_by: Field to order by
        direction: firestore.Query.DESCENDING or firestore.Query.ASCENDING
        limit: Max documents to return
        offset: Number of documents to skip
    
    Returns:
        List of documents as dicts
    """
    query = db.collection(collection).document(doc_id).collection(subcollection)
    
    if order_by:
        direction = direction or firestore.Query.ASCENDING
        query = query.order_by(order_by, direction=direction)
    
    if offset:
        query = query.offset(offset)
    
    if limit:
        query = query.limit(limit)
    
    return [doc.to_dict() for doc in query.stream()]

def count_subcollection(collection: str, doc_id: str, subcollection: str) -> int:
    """
    Efficiently count documents in a subcollection.
    
    Args:
        collection: Parent collection name
        doc_id: Parent document ID
        subcollection: Subcollection name
    
    Returns:
        Count of documents
    """
    docs = db.collection(collection).document(doc_id).collection(subcollection).stream()
    return sum(1 for _ in docs)

def get_subcollection_ids(collection: str, doc_id: str, subcollection: str) -> list:
    """
    Get all document IDs from a subcollection (e.g., user IDs who liked/shared).
    
    Args:
        collection: Parent collection name
        doc_id: Parent document ID
        subcollection: Subcollection name
    
    Returns:
        List of document IDs
    """
    return [doc.id for doc in db.collection(collection).document(doc_id).collection(subcollection).stream()]

def batch_get_users(user_ids: list) -> dict:
    """
    Batch fetch multiple user documents by their IDs.
    
    Args:
        user_ids: List of user IDs to fetch
    
    Returns:
        Dictionary with user_id as key and user data as value
    """
    if not user_ids:
        return {}
    
    users = {}
    for user_id in user_ids:
        user_doc = db.collection("users").document(user_id).get()
        if user_doc.exists:
            users[user_id] = user_doc.to_dict()
        else:
            users[user_id] = {
                "id": user_id,
                "username": "Unknown",
                "avatar_url": None,
                "full_name": None
            }
    
    return users

def get_user_by_id(user_id: str) -> dict:
    """
    Fetch a single user document by ID.
    
    Args:
        user_id: User ID
    
    Returns:
        User data dict or None if not found
    """
    user_doc = db.collection("users").document(user_id).get()
    if user_doc.exists:
        return user_doc.to_dict()
    return None

def check_subcollection_doc_exists(collection: str, doc_id: str, subcollection: str, sub_doc_id: str) -> bool:
    """
    Check if a specific document exists in a subcollection.
    
    Args:
        collection: Parent collection name
        doc_id: Parent document ID
        subcollection: Subcollection name
        sub_doc_id: Subcollection document ID
    
    Returns:
        True if exists, False otherwise
    """
    return db.collection(collection).document(doc_id).collection(subcollection).document(sub_doc_id).get().exists()