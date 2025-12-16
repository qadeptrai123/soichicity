
import sys
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Add backend directory to path to allow imports
# current file is in backend/scripts/
# we want to add backend/ to path
# os.path.dirname(__file__) -> backend/scripts
# .. -> backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import db from app
from app.db.firebase import db

def migrate_posts():
    print("Starting migration of 'posts' collection...")
    posts_ref = db.collection("posts")
    docs = posts_ref.stream()
    
    count = 0
    updated_count = 0
    
    for doc in docs:
        count += 1
        data = doc.to_dict()
        doc_ref = posts_ref.document(doc.id)
        
        updates = {}
        deletes = {}
        
        # 1. Map id -> post_id
        if "id" in data and "post_id" not in data:
            updates["post_id"] = data["id"]
            deletes["id"] = firestore.DELETE_FIELD
        
        # 2. Map link_url -> media_urls
        if "link_url" in data and "media_urls" not in data:
            # Ensure it's a list
            links = data["link_url"]
            if isinstance(links, str):
                links = [links]
            elif links is None:
                links = []
            updates["media_urls"] = links
            deletes["link_url"] = firestore.DELETE_FIELD
        
        # 3. Map counts
        # likeCount -> likes_count
        if "likeCount" in data and "likes_count" not in data:
            updates["likes_count"] = data["likeCount"]
            deletes["likeCount"] = firestore.DELETE_FIELD
            
        # shareCount -> reposts_count
        if "shareCount" in data and "reposts_count" not in data:
            updates["reposts_count"] = data["shareCount"]
            deletes["shareCount"] = firestore.DELETE_FIELD
            
        # repostCount -> reposts_count (override shareCount if exists and larger? or sum? usually separate or renamed)
        # If we have BOTH shareCount and repostCount?
        # User defined schema has reposts_count. OLD code had both shareCount and repostCount separately?
        # New PostService uses reposts_count.
        # Let's check data. If repostCount exists, use it. If shareCount exists, maybe merge?
        # Safe bet: If repostCount exists, take it. If shareCount exists and no repostCount, take shareCount.
        # But wait, we act as if share == repost.
        current_reposts = getattr(data, "reposts_count", 0)
        old_repost = data.get("repostCount", 0)
        old_share = data.get("shareCount", 0)
        
        # If we didn't update reposts_count yet from shareCount
        if "reposts_count" not in updates: 
            # Prefer repostCount if > 0
            if old_repost > 0:
                updates["reposts_count"] = old_repost
            elif old_share > 0:
                updates["reposts_count"] = old_share
            else:
                if "reposts_count" not in data:
                    updates["reposts_count"] = 0
        
        if "repostCount" in data:
             deletes["repostCount"] = firestore.DELETE_FIELD
             
        # saveCount -> saves_count
        if "saveCount" in data and "saves_count" not in data:
            updates["saves_count"] = data["saveCount"]
            deletes["saveCount"] = firestore.DELETE_FIELD

        # commentCount -> comments_count
        if "commentCount" in data and "comments_count" not in data:
            updates["comments_count"] = data["commentCount"]
            deletes["commentCount"] = firestore.DELETE_FIELD

        # 4. Set defaults for new fields
        if "level" not in data:
            updates["level"] = 0
            
        if "reply_to_id" not in data:
            updates["reply_to_id"] = None
            
        if "root_id" not in data:
            updates["root_id"] = None

        # Apply updates
        if updates or deletes:
            # Combine
            final_update = {**updates, **deletes}
            print(f"Updating doc {doc.id}: {final_update.keys()}")
            doc_ref.update(final_update)
            updated_count += 1
            
    print(f"Migration complete. Scanned {count} docs. Updated {updated_count} docs.")

if __name__ == "__main__":
    migrate_posts()
