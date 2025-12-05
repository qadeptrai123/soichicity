import os
import tempfile
from moviepy import VideoFileClip
import uuid

class VideoService:
    @staticmethod
    def compress_video(file_obj, filename: str) -> str:
        """
        Compresses a video file:
        1. Saves stream to a temp file.
        2. Uses moviepy to resize/reduce bitrate.
        3. Returns path to the new compressed file.
        """
        temp_dir = tempfile.gettempdir()
        temp_input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}_{filename}")
        temp_output_path = os.path.join(temp_dir, f"compressed_{uuid.uuid4()}.mp4")

        # 1. Save input file to temp
        try:
            with open(temp_input_path, "wb") as buffer:
                # If file_obj is SpooledTemporaryFile from FastAPI UploadFile using "wb" usually works if we read it
                # or shutil.copyfileobj if available. Here we assume we can read.
                file_obj.seek(0)
                while content := file_obj.read(1024 * 1024): # 1MB chunks
                    buffer.write(content)
            
            # 2. Compress using moviepy
            # Resize height to 720p if larger, keep aspect ratio
            # Set audio codec to aac, code to libx264, medium preset
            with VideoFileClip(temp_input_path) as clip:
                if clip.h > 720:
                    clip = clip.resize(height=720)
                
                # Write to temp output
                # Using a lower bitrate target or preset can help compression
                clip.write_videofile(
                    temp_output_path,
                    codec="libx264", 
                    audio_codec="aac",
                    preset="medium",
                    threads=4,
                    logger=None # Suppress output
                )
            
            # Clean up input file
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)

            return temp_output_path

        except Exception as e:
            # Cleanup on failure
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            if os.path.exists(temp_output_path):
                os.remove(temp_output_path)
            raise e
