"""
Test script để kiểm tra API feed integration
Chạy: python -m pytest tests/test_feed_integration.py -v
Hoặc: python tests/test_feed_integration.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_get_posts():
    """Test lấy danh sách posts"""
    print("\n=== Testing GET /posts ===")
    
    response = requests.get(f"{BASE_URL}/posts")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        posts = response.json()
        print(f"Number of posts: {len(posts)}")
        
        if posts:
            print("\n--- Sample Post ---")
            sample = posts[0]
            print(json.dumps(sample, indent=2))
            
            # Kiểm tra structure
            required_fields = ["id", "content", "created_at", "author_id", "likeCount", "commentCount"]
            missing = [f for f in required_fields if f not in sample]
            if missing:
                print(f"⚠️ Missing fields: {missing}")
            else:
                print("✅ All required fields present")
                
            # Kiểm tra author
            if "author" in sample and sample["author"]:
                print(f"✅ Author info: {sample['author'].get('username', 'N/A')}")
            else:
                print("⚠️ Author info missing")
    else:
        print(f"❌ Error: {response.text}")

if __name__ == "__main__":
    try:
        test_get_posts()
    except Exception as e:
        print(f"❌ Test failed: {e}")
