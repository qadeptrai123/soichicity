import sys
import os
import time

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.db.firebase import db
    from app.services.post_service import PostService
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def test_performance():
    print("Testing performance for fetching 20 posts...")
    
    # Warm up (optional, or just run)
    start_time = time.time()
    posts = PostService.get_feed_posts(limit=20, user_id="test_user")
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"Fetched {len(posts)} posts in {duration:.4f} seconds.")
    
    # Basic check to ensure data is still populated
    if posts:
        print(f"Sample author: {posts[0].get('author')}")
        print(f"Sample is_liked: {posts[0].get('is_liked')}")

if __name__ == "__main__":
    test_performance()
