import sys
import os
import time

# Define the root of the project to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.db.firebase import db
    from app.services.post_service import PostService
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def test_pagination():
    print("Testing pagination...")
    
    # 1. Fetch first page (limit 5)
    print("Fetching Page 1 (Limit 5)...")
    page1 = PostService.get_feed_posts(limit=5)
    
    if not page1:
        print("No posts found. Seed data first.")
        return
        
    print(f"Page 1 count: {len(page1)}")
    for p in page1:
        print(f" - {p['post_id']} ({p['created_at']})")
        
    last_post = page1[-1]
    cursor = last_post['created_at']
    print(f"\nCursor (last created_at): {cursor}")
    
    # 2. Fetch second page
    print("\nFetching Page 2 (Limit 5)...")
    page2 = PostService.get_feed_posts(limit=5, cursor=cursor)
    
    if not page2:
        print("Page 2 is empty.")
    else:
        print(f"Page 2 count: {len(page2)}")
        for p in page2:
            print(f" - {p['post_id']} ({p['created_at']})")
            
    # 3. Verify
    p1_ids = [p['post_id'] for p in page1]
    p2_ids = [p['post_id'] for p in page2]
    
    # Check for duplicates or overlap (should be none)
    overlap = set(p1_ids).intersection(set(p2_ids))
    if overlap:
        print(f"\n❌ FAILED: Overlap found: {overlap}")
    else:
        print("\n✅ SUCCESS: No overlap between pages.")
        
    # Check if page 2 is actually older than page 1 cursor
    if page2 and page2[0]['created_at'] >= cursor:
        print(f"❌ FAILED: Page 2 first post is not older than cursor. {page2[0]['created_at']} >= {cursor}")
    elif page2:
         print(f"✅ SUCCESS: Page 2 correctly follows cursor.")

if __name__ == "__main__":
    test_pagination()
