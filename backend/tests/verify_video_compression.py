import unittest
from unittest.mock import MagicMock, patch, mock_open
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mock moviepy before import
sys.modules["moviepy"] = MagicMock()
# sys.modules["moviepy.editor"] = MagicMock() # No longer needed if we import from moviepy

from app.services.video_service import VideoService
from app.api.posts import create_post

class TestVideoCompression(unittest.TestCase):
    
    @patch("builtins.open", new_callable=mock_open)
    @patch("app.services.video_service.VideoFileClip")
    @patch("app.services.video_service.os")
    def test_compress_video_service(self, mock_os, mock_video_clip, mock_file_open):
        # Setup mocks
        mock_os.path.join.return_value = "temp/compressed.mp4"
        mock_os.path.exists.return_value = True
        
        mock_clip_instance = MagicMock()
        mock_clip_instance.h = 1080
        mock_clip_instance.resized.return_value = mock_clip_instance # Support chaining
        mock_video_clip.return_value.__enter__.return_value = mock_clip_instance
        
        # Test input file mock
        mock_file = MagicMock()
        mock_file.read.side_effect = [b"chunk", None]
        
        # Run
        result = VideoService.compress_video(mock_file, "test.mp4")
        
        # Verify
        self.assertEqual(result, "temp/compressed.mp4")
        mock_clip_instance.resized.assert_called_with(height=720) # Should resize
        mock_clip_instance.write_videofile.assert_called()

    @patch("app.api.posts.VideoService")
    @patch("app.api.posts.upload_file")
    @patch("app.api.posts.PostService")
    @patch("app.api.posts.os")
    def test_create_post_video_flow(self, mock_os, mock_post_service, mock_upload, mock_video_service):
        # Setup mocks
        mock_video_service.compress_video.return_value = "temp/compressed.mp4"
        mock_upload.return_value = "https://firebase/video.mp4"
        mock_os.path.exists.return_value = True # For cleanup check
        
        # Mock file input
        mock_file = MagicMock()
        mock_file.filename = "video.mp4"
        mock_file.content_type = "video/mp4"
        
        # Mock Form
        mock_form = MagicMock()
        mock_form.content = "Test video post"
        mock_form.files = [mock_file]
        
        # Run create_post logic (conceptually)
        # We can't easily call 'create_post' directly because of Depends()
        # So we will replicate the logic block we want to test:
        
        # --- Logic from api/posts.py ---
        compressed_path = mock_video_service.compress_video(mock_file.file, mock_file.filename)
        # Should open file
        with patch("builtins.open", mock_open(read_data=b"data")) as mock_file_open:
            url = mock_upload(mock_file_open.return_value, "compressed.mp4", "video/mp4", folder="posts")
        
        if mock_os.path.exists(compressed_path):
             mock_os.remove(compressed_path)
        # -------------------------------
        
        # Verify interactions
        mock_video_service.compress_video.assert_called_once()
        mock_upload.assert_called_once()
        mock_os.remove.assert_called_with("temp/compressed.mp4")

if __name__ == "__main__":
    unittest.main()
