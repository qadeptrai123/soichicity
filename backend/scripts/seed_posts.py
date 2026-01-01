import sys
import os
import random
import uuid
from datetime import datetime

# Define the root of the project to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import app modules
try:
    from app.db.firebase import db
    from app.services.post_service import PostService
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def get_random_users(limit=20):
    try:
        users_ref = db.collection("users").limit(limit).stream()
        users = [u.id for u in users_ref]
        return users
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []

def generate_seed_posts(num_posts=50):
    users = get_random_users(limit=20) # Get up to 20 users
    if not users:
        print("No users found in database. Please create some users first or ensure connection.")
        # Fallback to a dummy user if we really want to force it, usually better to stop
        # But for 'testing', let's use a hardcoded valid-looking ID if connection works but no users
        # If connection fails, script dies above.
        print("Creating dummy user ID for seeding.")
        users = ["seed_user_test"]

    base_content = [
        "Mấy thằng em của tao no hip hop",
        "Just having a great day!",
        "Check out this amazing view!",
        "Learning something new today.",
        "Anyone else excited for the weekend?",
        "Coding is fun... mostly.",
        "Soichi City looks great.",
        "Creating some test data for the app.",
        "Hello world!",
        "Another random post.",
        "Life is good.",
        "Thử chức năng post bài mới xem sao.",
        "Hôm nay trời đẹp quá.",
        "Code xuyên màn đêm."
    ]

    media_samples = [
        "https://storage.googleapis.com/soichicity.firebasestorage.app/posts/92ae4942-b822-402f-9a55-d73c167f2d7e_524715124_24039956269018993_3841507972194342153_n.jpg",
        "https://storage.googleapis.com/soichicity.firebasestorage.app/posts/89d1f236-b855-48a0-bebb-0e8ceb59f889_524419100_1261024735519170_1128478290966972444_n.jpg",
        None,
        None,
        None
    ]

    print(f"Starting to seed {num_posts} posts...")

    for i in range(num_posts):
        user_id = random.choice(users)
        content = f"{random.choice(base_content)} (Seed #{i+1})"
        
        # Randomly assign media (20% chance of 2 images, 20% 1 image, 60% none)
        rand_val = random.random()
        if rand_val < 0.2:
             media_urls = [m for m in media_samples if m is not None][:2]
        elif rand_val < 0.4:
             media_urls = [media_samples[0]]
        else:
             media_urls = []
        
        try:
            # We use PostService directly
            # Note: create_post sets created_at to utcnow(). 
            # If we want diverse timestamps, we might need to patch it or update afterwards.
            # But "utcnow" is fine for "newest" posts.
            
            payload = PostService.create_post(
                user_id=user_id,
                content=content,
                media_urls=media_urls,
                level=0,
                reply_to_id=None,
                root_id=None
            )
            
            # Optional: Randomize created_at to be in the past
            if i % 2 == 0:
                 # Update created_at to random time in last 7 days
                 minutes_ago = random.randint(1, 10000)
                 past_time = (datetime.utcnow() - timedelta(minutes=minutes_ago)).isoformat()
                 db.collection("posts").document(payload["post_id"]).update({"created_at": past_time})
            
            print(f"Created post {i+1}/{num_posts} (ID: {payload['post_id']})")
        except Exception as e:
            print(f"Failed to create post {i+1}: {e}")

    print("Seeding completed!")

if __name__ == "__main__":
    generate_seed_posts(50)
