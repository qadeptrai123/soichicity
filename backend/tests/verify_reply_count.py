import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.post_service import PostService

def verify_reply_count():
    print("Verifying Reply Count Increment...")
    
    # 1. Initialize Firebase (if not already initialized in app context, but here we run standalone)
    # Assuming app.db.firebase handles init, we just need to ensure we can run this.
    # Since we import PostService, it imports app.db.firebase.
    
    # 2. Create Parent Post
    print("Creating Parent Post...")
    parent_post = PostService.create_post(
        user_id="test_user_parent",
        content="This is a parent post for testing comments count."
    )
    parent_id = parent_post["post_id"]
    print(f"Parent Post Created: {parent_id}")
    
    # Check initial count
    from app.db.firebase import db
    parent_ref = db.collection("posts").document(parent_id)
    initial_count = parent_ref.get().to_dict().get("comments_count", 0)
    print(f"Initial Comments Count: {initial_count}")
    
    if initial_count != 0:
        print("WARNING: Initial count is not 0. Might be okay if DB reused ID (unlikely).")

    # 3. Create Reply Post
    print("Creating Reply Post...")
    reply_post = PostService.create_post(
        user_id="test_user_reply",
        content="This is a reply.",
        reply_to_id=parent_id
    )
    reply_id = reply_post["post_id"]
    print(f"Reply Post Created: {reply_id}")
    
    # 4. Verify Count Incremented
    updated_parent = parent_ref.get().to_dict()
    updated_count = updated_parent.get("comments_count", 0)
    print(f"Updated Comments Count: {updated_count}")
    
    if updated_count == initial_count + 1:
        print("SUCCESS: Comments count incremented correctly.")
    else:
        print(f"FAILURE: Expected {initial_count + 1}, got {updated_count}")
    
    # Clean up
    print("Cleaning up...")
    parent_ref.delete()
    db.collection("posts").document(reply_id).delete()
    print("Cleanup done.")

if __name__ == "__main__":
    # We need to make sure firebase is initialized. 
    # The import of PostService triggers 'from app.db.firebase import db'
    # which usually initializes the app if not already. 
    # If not, we might fail here. Let's try running it via python -m tests.verify_reply_count
    try:
        verify_reply_count()
    except Exception as e:
        print(f"Error during verification: {e}")
