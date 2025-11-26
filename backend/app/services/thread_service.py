from app.schemas.thread import ThreadCreate
from app.db.firebase import get_db

def get_threads(db, skip: int = 0, limit: int = 100):
    threads_ref = db.collection('threads').limit(limit).offset(skip)
    results = threads_ref.stream()
    return [{"id": thread.id, **thread.to_dict()} for thread in results]

def create_user_thread(db, thread: ThreadCreate, user_id: str):
    thread_data = thread.dict()
    thread_data["owner_id"] = user_id
    
    update_time, thread_ref = db.collection('threads').add(thread_data)
    
    thread_doc = thread_ref.get()
    return {"id": thread_doc.id, **thread_doc.to_dict()}