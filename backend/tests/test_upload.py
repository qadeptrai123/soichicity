import sys
import os

# Add the parent directory to sys.path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user

# Mock user to bypass authentication
mock_user = {
    "id": "test_integration_user",
    "username": "integration_tester",
    "email": "tester@example.com",
    "avatar": "https://ui-avatars.com/api/?name=Tester"
}

def override_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_upload():
    print("Starting upload test...")
    
    # Create a dummy file
    file_content = b"This is a test file for integration testing."
    files = [
        ('files', ('test_upload.txt', file_content, 'text/plain'))
    ]
    
    data = {
        "content": "This is an automated integration test post with a file."
    }
    
    print("Sending POST request to /api/v1/posts...")
    response = client.post("/api/v1/posts", data=data, files=files)
    
    print(f"Response Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"Response Body: {response.text}")
        return

    json_resp = response.json()
    print("Response JSON:")
    print(json_resp)
    
    if "link_url" in json_resp and len(json_resp["link_url"]) > 0:
        print("\nSUCCESS: File uploaded successfully!")
        print(f"Uploaded File URL: {json_resp['link_url'][0]}")
    else:
        print("\nFAILURE: link_url not found or empty.")

if __name__ == "__main__":
    test_upload()
