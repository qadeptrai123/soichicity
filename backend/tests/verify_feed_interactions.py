import unittest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.post_service import PostService

class TestFeedInteractions(unittest.TestCase):
    
    @patch("app.services.post_service.db")
    def test_get_feed_interactions(self, mock_db):
        # Mock Seen Posts
        mock_seen_doc = MagicMock()
        mock_seen_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = mock_seen_doc
        
        # Mock Posts Stream
        mock_post_doc = MagicMock()
        mock_post_doc.to_dict.return_value = {
            "id": "post1", 
            "content": "test", 
            "created_at": "2023-01-01",
            "author_id": "author1"
        }
        mock_db.collection.return_value.stream.return_value = [mock_post_doc]
        
        # Mock Sub-collections Existence
        # We need to structure the mock chain to handle iteration
        # db.collection("posts").document(p_id).collection("likes").document(user_id).get().exists
        
        mock_post_ref = MagicMock()
        # Ensure db.collection("posts").document("post1") returns mock_post_ref
        
        # This is tricky because `db.collection("posts").document(p_id)` is called inside the loop
        # We need side_effect or return_value based on call args ??
        # Or simpler: just return the same mock_post_ref for any document() call
        mock_db.collection.return_value.document.return_value = mock_post_ref
        
        mock_sub_doc_true = MagicMock()
        mock_sub_doc_true.exists = True
        
        mock_sub_doc_false = MagicMock()
        mock_sub_doc_false.exists = False
        
        # Setup specific returns for likes vs shares vs saves
        # Using side_effect on collection()
        def collection_side_effect(name):
            sub_col = MagicMock()
            if name == "likes":
                 # Mock Like exists
                 sub_col.document.return_value.get.return_value = mock_sub_doc_true
            else:
                 # Others False
                 sub_col.document.return_value.get.return_value = mock_sub_doc_false
            return sub_col

        mock_post_ref.collection.side_effect = collection_side_effect
        
        # Run
        result = PostService.get_feed_posts("user1", limit=10)
        
        # Verify
        self.assertEqual(len(result), 1)
        post = result[0]
        self.assertTrue(post["is_liked"])
        self.assertFalse(post["is_shared"])
        self.assertFalse(post["is_saved"])

if __name__ == "__main__":
    unittest.main()
