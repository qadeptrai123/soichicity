import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("app/secrets/soichicity-firebase-adminsdk-fbsvc-2f60fa38c3.json")
    except:
        # Try absolute path just in case
        cred = credentials.Certificate(r"d:\soichicity\backend\app\secrets\soichicity-firebase-adminsdk-fbsvc-2f60fa38c3.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

username = "laccoc123"
users_ref = db.collection("users")
query = users_ref.where("username", "==", username)
docs = list(query.stream())

print(f"Found {len(docs)} users for username '{username}':")
for doc in docs:
    data = doc.to_dict()
    print(f"UID: {doc.id}, Email: {data.get('email')}, Avatar URL: {data.get('avatar_url')}, Avatar: {data.get('avatar')}")
