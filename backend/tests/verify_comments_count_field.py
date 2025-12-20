import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.post_service import PostService

def verify_comments_count_field():
    print("Verifying comments_count field...")
    
    # 1. Create Parent Post
    print("Creating Parent Post...")
    parent_post = PostService.create_post(
        user_id="test_user_parent",
        content="This is a parent post for testing comments count field."
    )
    parent_id = parent_post["post_id"]
    
    # 2. Add a comment (reply) to increase count
    print("Creating Reply Post...")
    PostService.create_post(
        user_id="test_user_reply",
        content="This is a reply.",
        reply_to_id=parent_id
    )
    
    # 3. Get Post Detail
    print("Fetching Post Detail...")
    detail = PostService.get_post_detail(parent_id)
    
    # 4. Check for 'comments_count' in main post
    if "comments_count" in detail:
        print(f"SUCCESS: 'comments_count' found in main post. Value: {detail['comments_count']}")
    else:
        print("FAILURE: 'comments_count' NOT found in main post.")
        
    # 5. Check nested reply also has 'comments_count'
    # To test this, we need a nested reply structure.
    # create_post returns the created post, but get_post_detail fetches it properly.
    # Let's check the replies list in detail.
    if detail["replies"]:
        first_reply = detail["replies"][0]
        if "comments_count" in first_reply:
             print(f"SUCCESS: 'comments_count' found in reply item. Value: {first_reply['comments_count']}")
        else:
             print("FAILURE: 'comments_count' NOT found in reply item.")
             print(f"Keys found: {first_reply.keys()}")
    
    # Clean up
    print("Cleaning up...")
    from app.db.firebase import db
    db.collection("posts").document(parent_id).delete()
    # Delete reply too?
    # db.collection("posts").document(reply_id).delete() # We didn't save reply id
    print("Cleanup done.")

if __name__ == "__main__":
    try:
        verify_comments_count_field()
    except Exception as e:
        print(f"Error: {e}")
