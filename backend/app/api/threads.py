from fastapi import APIRouter, Depends
from app.db.firebase import get_db
from app.services import thread_service
from app.schemas.thread import ThreadCreate

router = APIRouter()

@router.get("/threads/", tags=["threads"])
def read_threads(db=Depends(get_db)):
    return thread_service.get_threads(db)

@router.post("/threads/", tags=["threads"])
def create_thread(thread: ThreadCreate, db=Depends(get_db)):
    # This is a placeholder for the user_id
    # In a real app, you would get the user_id from the auth token
    user_id = "fake_user_id" 
    return thread_service.create_user_thread(db, thread, user_id)

@router.get("/threads/{thread_id}", tags=["threads"])
def read_thread(thread_id: str, db=Depends(get_db)):
    # In a real app, you would have a get_thread service function
    thread_ref = db.collection('threads').document(thread_id)
    thread = thread_ref.get()
    if thread.exists:
        return {"id": thread.id, **thread.to_dict()}
    return {"error": "Thread not found"}