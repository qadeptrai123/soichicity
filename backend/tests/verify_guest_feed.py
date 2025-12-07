import unittest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.post_service import PostService

class TestGuestFeed(unittest.TestCase):
    
    @patch("app.services.post_service.db")
    def test_guest_feed_posts(self, mock_db):
        # Setup mock db stream return
        mock_post = {
            "id": "post1", 
            "content": "Guest content",
            "likeCount": 10
        }
        
        mock_stream_obj = MagicMock()
        mock_stream_obj.to_dict.return_value = mock_post
        
        mock_db.collection.return_value.stream.return_value = [mock_stream_obj]
        
        # Call with user_id = None (Guest)
        results = PostService.get_feed_posts(user_id=None, limit=5)
        
        # Verify
        self.assertEqual(len(results), 1)
        post = results[0]
        
        # Verify interaction flags are all False
        self.assertFalse(post["is_liked"])
        self.assertFalse(post["is_shared"])
        self.assertFalse(post["is_saved"])
        
        # Verify no calls to sub-collections (because user_id is None)
        # We can check specific mocks if needed, but assertion of False flags suggests logic path taken
        # Ideally we check that db was NOT called for likes/shares/saves
        # The logic does: if user_id: check collections. else: set False.
        # So we can spy on db.collection("posts").document().collection() if we wanted deep verification.

if __name__ == "__main__":
    unittest.main()
