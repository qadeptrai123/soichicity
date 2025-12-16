import sys
import os

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.db.firebase import db
from app.services.user_service import follow_user, unfollow_user
from app.services.post_service import PostService
import uuid

def test_interactions():
    # Setup test data
    user1_id = "test_user_1_" + uuid.uuid4().hex[:6]
    user2_id = "test_user_2_" + uuid.uuid4().hex[:6]
    post_id = "test_post_" + uuid.uuid4().hex[:6]

    print(f"User 1: {user1_id}")
    print(f"User 2: {user2_id}")
    print(f"Post: {post_id}")

    # Create dummy user docs
    db.collection("users").document(user1_id).set({"username": "user1"})
    db.collection("users").document(user2_id).set({"username": "user2"})
    db.collection("posts").document(post_id).set({"author_id": user2_id, "content": "test content"})

    # 1. Test Follow
    print("\n--- Testing Follow ---")
    follow_user(db, user1_id, user2_id)
    
    # Verify sub-collections
    following_doc = db.collection("users").document(user1_id).collection("followings").document(user2_id).get()
    follower_doc = db.collection("users").document(user2_id).collection("followers").document(user1_id).get()
    
    assert following_doc.exists, "Following sub-collection missing"
    assert follower_doc.exists, "Follower sub-collection missing"
    print("Follow sub-collections verified.")
    
    # Verify notification
    notifs = db.collection("users").document(user2_id).collection("notifications").stream()
    has_follow_notif = False
    for n in notifs:
        data = n.to_dict()
        if data["type"] == "follow" and data["sender_id"] == user1_id:
            has_follow_notif = True
    assert has_follow_notif, "Follow notification missing"
    print("Follow notification verified.")

    # 2. Test Like (Activity Like)
    print("\n--- Testing Like ---")
    PostService.toggle_interaction("likes", "likeCount", post_id, user1_id)
    
    # Verify sub-collections
    # users/{user_id}/activity_likes/{post_id}
    activity_like = db.collection("users").document(user1_id).collection("activity_likes").document(post_id).get()
    assert activity_like.exists, "Activity Like sub-collection missing"
    assert "created_at" in activity_like.to_dict(), "created_at missing in activity_like"
    print("Like sub-collection verified.")

    # Verify notification for like
    notifs = db.collection("users").document(user2_id).collection("notifications").stream()
    has_like_notif = False
    for n in notifs:
        data = n.to_dict()
        if data["type"] == "like" and data["sender_id"] == user1_id and data["post_id"] == post_id:
            has_like_notif = True
    assert has_like_notif, "Like notification missing"
    print("Like notification verified.")

    # 3. Test Unfollow
    print("\n--- Testing Unfollow ---")
    unfollow_user(db, user1_id, user2_id)
    following_doc = db.collection("users").document(user1_id).collection("followings").document(user2_id).get()
    assert not following_doc.exists, "Following sub-collection should be deleted"
    print("Unfollow verified.")

    print("\nAll tests passed!")

if __name__ == "__main__":
    try:
        test_interactions()
    except Exception as e:
        print(f"FAILED: {e}")
