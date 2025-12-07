import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock missing google libraries before importing app modules
sys.modules["google_auth_oauthlib"] = MagicMock()
sys.modules["google_auth_oauthlib.flow"] = MagicMock()
sys.modules["googleapiclient"] = MagicMock()
sys.modules["googleapiclient.discovery"] = MagicMock()
sys.modules["googleapiclient.http"] = MagicMock()
sys.modules["googleapiclient.errors"] = MagicMock()

from app.services.post_service import PostService
from app.api.posts import create_post, unlike_post, unshare_post, unsave_post, delete_comment

class TestBackendUpdates(unittest.TestCase):
    
    @patch("app.services.post_service.db")
    def test_reverse_interactions(self, mock_db):
        # Setup mocks
        mock_post_ref = MagicMock()
        mock_sub_ref = MagicMock()
        mock_doc = MagicMock()
        
        mock_db.collection.return_value.document.return_value = mock_post_ref
        mock_post_ref.collection.return_value.document.return_value = mock_sub_ref
        
        # Scenario 1: Interaction exists (Should be removed)
        mock_doc.exists = True
        mock_sub_ref.get.return_value = mock_doc
        
        result = PostService.remove_interaction("likes", "likeCount", "post123", "user123")
        
        self.assertEqual(result["status"], "removed")
        mock_sub_ref.delete.assert_called_once()
        mock_post_ref.update.assert_called_once() # Should update count
        
        # Scenario 2: Interaction does not exist (Should not be removed)
        mock_doc.exists = False
        # Reset mocks
        mock_sub_ref.delete.reset_mock()
        mock_post_ref.update.reset_mock()
        
        result = PostService.remove_interaction("likes", "likeCount", "post123", "user123")
        
        self.assertEqual(result["status"], "not_found")
        mock_sub_ref.delete.assert_not_called()

    @patch("app.services.post_service.db")
    def test_delete_comment(self, mock_db):
        mock_post_ref = MagicMock()
        mock_comment_ref = MagicMock()
        mock_doc = MagicMock()
        
        mock_db.collection.return_value.document.return_value = mock_post_ref
        mock_post_ref.collection.return_value.document.return_value = mock_comment_ref
        mock_comment_ref.get.return_value = mock_doc
        
        # Scenario 1: Owner deletes (Success)
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"user_id": "user123"}
        
        result = PostService.delete_comment("post123", "comment123", "user123")
        self.assertEqual(result["status"], "deleted")
        mock_comment_ref.delete.assert_called()
        
        # Scenario 2: Non-owner deletes (Fail)
        mock_doc.to_dict.return_value = {"user_id": "otherUser"}
        result = PostService.delete_comment("post123", "comment123", "user123")
        self.assertEqual(result["error"], "Permission denied")
        


if __name__ == "__main__":
    unittest.main()
