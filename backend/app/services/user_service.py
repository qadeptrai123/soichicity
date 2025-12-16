# app/services/user_service.py
from firebase_admin import auth
from app.schemas.user import UserCreate
from fastapi import HTTPException
from google.cloud import firestore
import uuid
from datetime import datetime

def get_user(db, user_id: str):
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        data = user.to_dict()
        # Map DB fields to Schema fields if necessary (though we plan to store snake_case locally)
        return {"uid": user.id, **data}
    return None

def get_user_by_email_admin(email: str):
    """
    Use Firebase Admin SDK to get user info from Auth (not Firestore)
    To check if this user registered with Google or Password
    """
    try:
        user_record = auth.get_user_by_email(email)
        return user_record
    except auth.UserNotFoundError:
        return None
    
def get_user_by_username(db, username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).limit(1)
    results = query.stream()
    for user in results:
        return {"uid": user.id, **user.to_dict()}
    return None

def create_user(db, user: UserCreate):
    # 1. Create User on Firebase Authentication
    try:
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.username, # Temporarily store username in display_name
            email_verified=True
        )
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered in Firebase Auth")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating user: {str(e)}")

    # 2. Get UID from Firebase response to use as Document ID
    user_id = user_record.uid
    
    # 3. Prepare data to save to Firestore
    # Initialize all new fields with defaults
    user_data = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or user.username, # Fallback
        "bio": None,
        "avatar_url": None,
        "is_active": True,
        "provider": "password",
        "created_at": datetime.now(),
        "followers_count": 0,
        "followings_count": 0,
        "blocks_count": 0,
        "reposts_count": 0,
        "saves_count": 0,
        "likes_count": 0,
        "notifications_count": 0,
        "followers": [],
        "following": []
    }

    user_ref = db.collection('users').document(user_id)
    
    # Check if document already exists (to prevent rare conflicts)
    if user_ref.get().exists:
         pass 

    user_ref.set(user_data)
    
    return {"uid": user_id, **user_data}

# Function to update user when logging in with Google for the first time (Sync User)
def sync_google_user(db, decoded_token):
    # Get information from Google's Token
    uid = decoded_token['uid']
    email = decoded_token.get('email')
    name = decoded_token.get('name', '')
    picture = decoded_token.get('picture', None)

    # Create a random Username (Because Google doesn't have username)
    base_username = email.split('@')[0]
    username = f"{base_username}_{uuid.uuid4().hex[:4]}"

    # Prepare data
    user_data = {
        "username": username,
        "email": email,
        "full_name": name,
        "bio": None,
        "avatar_url": picture,
        "is_active": True,
        "provider": "google",
        "created_at": datetime.now(),
        "followers_count": 0,
        "followings_count": 0,
        "blocks_count": 0,
        "reposts_count": 0,
        "saves_count": 0,
        "likes_count": 0,
        "notifications_count": 0,
        "followers": [],
        "following": []
    }
    
    # Save to Firestore here
    db.collection('users').document(uid).set(user_data)
    
    return {"uid": uid, **user_data}

def follow_user(db, current_user_id:str, target_user_id:str):
    """
    1. Add target_user_id to current_user's following sub-collection
    2. Add current_user_id to target_user's followers sub-collection
    3. Update counts
    4. Trigger notification
    """
    from datetime import datetime
    from app.services.notification_service import NotificationService
    from app.schemas.user_interactions import NotificationCreate

    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself.")
    
    target_ref = db.collection('users').document(target_user_id)
    current_ref = db.collection('users').document(current_user_id)

    # Check existence of target user
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="Target user not found.")
    
    batch = db.batch()

    timestamp = datetime.utcnow().isoformat()

    # 1. Add to current_user's following list (Sub-collection)
    # users/{current_user_id}/followings/{target_user_id}
    current_following_ref = current_ref.collection("followings").document(target_user_id)
    batch.set(current_following_ref, {"user_id": target_user_id, "created_at": timestamp})

    # 2. Add to target_user's followers list (Sub-collection)
    # users/{target_user_id}/followers/{current_user_id}
    target_follower_ref = target_ref.collection("followers").document(current_user_id)
    batch.set(target_follower_ref, {"user_id": current_user_id, "created_at": timestamp})

    # Update counts (keep using counters on main doc for performance)
    batch.update(current_ref, {
        "followings_count": firestore.Increment(1)
    })

    batch.update(target_ref, {
        "followers_count": firestore.Increment(1)
    })
    
    # Also update the arrays for backward compatibility if needed, OR remove them if we fully migrate.
    # The prompt implies we should "update all interaction api that affect to all that collection".
    # I will maintain arrays for safety unless explicitly told otherwise, but the prompt emphasizes sub-collections.
    # "Create schemas for all the sub-collection below... update all interaction api that affect to all that collection."
    # I'll Assume we can stop updating the arrays 'following' and 'followers' field on the user doc if we want to be pure, 
    # but the UserResponse still has them. I will try to keep them in sync if possible or just rely on sub-collections.
    # Given the schemas in `user.py` still have `followers: List[str]`, I should probably keep them or update `user.py`.
    # For now, I will ONLY update sub-collections as requested and counts. Arrays might become stale.
    # actually, let's keep arrays in sync for now to avoid breaking clients that read them.
    batch.update(current_ref, {
        "following": firestore.ArrayUnion([target_user_id])
    })
    batch.update(target_ref, {
        "followers": firestore.ArrayUnion([current_user_id])
    })

    try:
        batch.commit()
        
        # 4. Trigger Notification
        NotificationService.create_notification(
            user_id=target_user_id,
            notification_data=NotificationCreate(
                type="follow",
                sender_id=current_user_id
            )
        )

        return {"status": "success", "message": f"User {current_user_id} followed {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error following user: {str(e)}")
    
def unfollow_user(db, current_user_id:str, target_user_id:str):
    """
    1. Remove from sub-collections
    2. Update counts
    """

    if current_user_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot unfollow yourself.")
    
    target_ref = db.collection('users').document(target_user_id)
    current_ref = db.collection('users').document(current_user_id)

    # Check existence of target user
    if not target_ref.get().exists:
        raise HTTPException(status_code=404, detail="Target user not found.")
    
    batch = db.batch()

    # 1. Remove from sub-collections
    current_following_ref = current_ref.collection("followings").document(target_user_id)
    batch.delete(current_following_ref)

    target_follower_ref = target_ref.collection("followers").document(current_user_id)
    batch.delete(target_follower_ref)

    # Update counts
    batch.update(current_ref, {
        "followings_count": firestore.Increment(-1)
    })

    batch.update(target_ref, {
        "followers_count": firestore.Increment(-1)
    })

    # Sync arrays
    batch.update(current_ref, {
        "following": firestore.ArrayRemove([target_user_id])
    })
    batch.update(target_ref, {
        "followers": firestore.ArrayRemove([current_user_id])
    })
    
    try:
        batch.commit()
        return {"status": "success", "message": f"User {current_user_id} unfollowed {target_user_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error unfollowing user: {str(e)}")
    
    