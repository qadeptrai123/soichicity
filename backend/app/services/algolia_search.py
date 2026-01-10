from algoliasearch.search_client import SearchClient
from typing import Dict, Any, List
from urllib.parse import urlencode
from app.core.config import settings
from app.db.firebase import db


class AlgoliaSearchService:
    def __init__(self):
        """Initialize Algolia client and indices"""
        self.client = SearchClient.create(
            settings.ALGOLIA_APP_ID,
            settings.ALGOLIA_ADMIN_API_KEY
        )

        # Algolia indices
        self.users_index = self.client.init_index(
            settings.ALGOLIA_USERS_INDEX_NAME
        )
        self.posts_index = self.client.init_index(
            settings.ALGOLIA_POSTS_INDEX_NAME
        )
    
    def _enrich_posts_with_full_data(self, hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Hydrate Algolia hits with full Post data from Firestore, then enrich with Author info.
        This ensures media_urls, stats, and author details are always up-to-date.
        """
        if not hits:
            return []

        # 1. Collect Post IDs from Algolia hits
        post_ids = [hit["objectID"] for hit in hits]
        
        # 2. Batch Fetch Posts from Firestore
        post_refs = [db.collection("posts").document(pid) for pid in post_ids]
        posts_map = {}
        
        try:
            post_docs = db.get_all(post_refs)
            for doc in post_docs:
                if doc.exists:
                    data = doc.to_dict()
                    # Normalized Post Object
                    posts_map[doc.id] = {
                        "objectID": doc.id, # Keep consistency with frontend expectation
                        "post_id": doc.id,
                        "content": data.get("content"),
                        "media_urls": data.get("media_urls") or data.get("link_url") or [], # Handle legacy/fallback
                        "created_at": data.get("created_at"),
                        "author_id": data.get("author_id"),
                        "likes_count": data.get("likes_count", 0),
                        "comments_count": data.get("comments_count", 0),
                        "reposts_count": data.get("reposts_count", 0),
                        "saves_count": data.get("saves_count", 0),
                        # Preserve highlighting from Algolia if needed, but usually we display raw content
                        # "_highlightResult": mapped_hit.get("_highlightResult") 
                    }
        except Exception as e:
            print(f"Error fetching posts from DB: {e}")
            return hits # Fallback to raw Algolia data if DB fails

        # 3. Merge DB data back into Hits order (to maintain search relevance rank)
        hydrated_posts = []
        for hit in hits:
            pid = hit["objectID"]
            if pid in posts_map:
                # Merge: DB data takes precedence, but we can keep algolia specific fields if we want
                # For now, just use DB data as the source of truth for display
                hydrated_posts.append(posts_map[pid])
            else:
                # Post might be deleted in DB but exists in Index
                # Skip it or show raw hit? Standard is skip if data consistency is key.
                # Let's show raw hit as fallback but marked
                 hydrated_posts.append(hit)

        # 4. Enrich with Authors (using the fresh author_ids from DB)
        return self._enrich_posts_with_authors(hydrated_posts)

    def _enrich_posts_with_authors(self, posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich a list of post objects with author information fetched from Firestore.
        """
        if not posts:
            return []

        # Collect unique author IDs
        author_ids = list(set([p.get("author_id") for p in posts if p.get("author_id")]))
        
        if not author_ids:
            return posts

        authors_map = {}
        user_refs = [db.collection("users").document(uid) for uid in author_ids]
        
        try:
            users_docs = db.get_all(user_refs)
            for doc in users_docs:
                if doc.exists:
                    d = doc.to_dict()
                    authors_map[doc.id] = {
                        "uid": doc.id,
                        "username": d.get("username", "unknown"),
                        "full_name": d.get("full_name"),
                        "avatar_url": d.get("avatar_url") or d.get("avatar") or d.get("picture"),
                    }
        except Exception as e:
            print(f"Error enriching authors: {e}")
            pass

        # Attach author info
        for post in posts:
            author_id = post.get("author_id")
            if author_id and author_id in authors_map:
                post["author"] = authors_map[author_id]
            else:
                post["author"] = {
                    "uid": author_id or "unknown",
                    "username": "Unknown",
                    "full_name": "Unknown User",
                    "avatar_url": None
                }
        return posts

    def _enrich_users_with_follow_status(self, users: List[Dict[str, Any]], current_user_id: str = None) -> List[Dict[str, Any]]:
        """
        Enrich user hits with 'is_following' and 'is_self' status relative to current_user_id.
        """
        if not users:
            return []

        # Initialize defaults
        for user in users:
            user["is_following"] = False
            user["is_self"] = False
            if current_user_id and user["objectID"] == current_user_id:
                user["is_self"] = True

        if not current_user_id:
            return users

        # Collect refs for checking follow status
        # Path: users/{current_user_id}/followings/{target_user_id}
        refs = []
        mapping = [] # to map ref back to user object if needed, or we just rely on doc id
        
        for user in users:
            target_uid = user["objectID"]
            if target_uid != current_user_id:
                ref = db.collection("users").document(current_user_id).collection("followings").document(target_uid)
                refs.append(ref)

        if not refs:
            return users

        try:
            # Batch get
            docs = db.get_all(refs)
            following_map = {d.id: d.exists for d in docs}

            for user in users:
                if user["objectID"] in following_map:
                    user["is_following"] = following_map[user["objectID"]]
        except Exception as e:
            print(f"Error enriching users with follow status: {e}")
        
        return users

    def _filter_out_blocked_items(self, items: List[Dict[str, Any]], type: str, current_user_id: str) -> List[Dict[str, Any]]:
        """
        Filter out items (users or posts) where there is a block relationship 
        (I blocked them OR they blocked me).
        """
        if not items or not current_user_id:
            return items

        # 1. Get List of Users I Blocked
        my_blocks_stream = db.collection("users").document(current_user_id).collection("blocks").stream()
        my_blocked_ids = {b.id for b in my_blocks_stream}

        # 2. Identify Target User IDs from items
        target_uids = set()
        for item in items:
            uid = None
            if type == "users":
                uid = item.get("objectID")
            elif type == "posts":
                # Ensure author_id is present (should be after enrichment)
                uid = item.get("author_id")
            
            if uid and uid != current_user_id:
                target_uids.add(uid)
        
        if not target_uids:
            return items

        # 3. Batch Check: Are they blocking me?
        # Check users/{target_uid}/blocks/{current_user_id}
        blocking_me_ids = set()
        
        check_refs = []
        ref_map = {} # target_uid -> ref

        for uid in target_uids:
            ref = db.collection("users").document(uid).collection("blocks").document(current_user_id)
            check_refs.append(ref)
            ref_map[uid] = ref
            
        try:
            # Batch Get
            # Note: db.get_all accepts a list of references
            block_docs = db.get_all(check_refs)
            
            # Map back: If exists, then uid is blocking me
            # But get_all returns docs in order (usually), need to be careful mapping back?
            # actually get_all returns snapshots. snapshot.reference.parent.parent.id is the target_uid
            
            for doc in block_docs:
                if doc.exists:
                    # Access the user ID who owns this block collection
                    # Path: users/{uid}/blocks/{me}
                    # Parent = blocks, Parent.Parent = users/{uid}
                    # This works for standard collections
                    blocker_uid = doc.reference.parent.parent.id
                    blocking_me_ids.add(blocker_uid)

        except Exception as e:
            print(f"Error checking block status in search: {e}")
            pass

        # 4. Filter
        filtered_items = []
        for item in items:
            uid = None
            if type == "users":
                uid = item.get("objectID")
            elif type == "posts":
                uid = item.get("author_id")
            
            # Allow if:
            # 1. Unknown UID (fallback)
            # 2. It's me
            # 3. Not in my_blocked_ids AND not in blocking_me_ids
            if not uid or uid == current_user_id:
                 filtered_items.append(item)
                 continue
            
            if uid in my_blocked_ids:
                continue
            if uid in blocking_me_ids:
                continue
            
            filtered_items.append(item)
            
        return filtered_items

    # ---------------- USERS ----------------
    def search_users(
        self,
        query: str,
        page: int = 0,
        hits_per_page: int = 20,
        current_user_id: str = None
    ) -> Dict[str, Any]:
        results = self.users_index.search(query, {
            "page": page,
            "hitsPerPage": hits_per_page
        })
        
        hits = results["hits"]
        
        # Filter Blocked
        if current_user_id:
            hits = self._filter_out_blocked_items(hits, "users", current_user_id)

        enriched_users = self._enrich_users_with_follow_status(hits, current_user_id)

        return {
            "type": "users",
            "hits": enriched_users,
            "total": results["nbHits"], # Note: "Total" might be inaccurate after filter, but fixing nbHits is hard without full scan
            "page": results["page"],
            "pages": results["nbPages"]
        }

    # ---------------- POSTS ----------------
    def search_posts(
        self,
        query: str,
        page: int = 0,
        hits_per_page: int = 20,
        only_root_posts: bool = True,
        current_user_id: str = None # Added param
    ) -> Dict[str, Any]:
        filters = "level = 0" if only_root_posts else None

        results = self.posts_index.search(query, {
            "page": page,
            "hitsPerPage": hits_per_page,
            "filters": filters
        })
        
        hits = results["hits"]
        
        # Enrich FIRST to get author_id
        enriched_hits = self._enrich_posts_with_full_data(hits)
        
        # Filter Blocked (requires author_id from enriched data)
        if current_user_id:
            enriched_hits = self._filter_out_blocked_items(enriched_hits, "posts", current_user_id)

        return {
            "type": "posts",
            "hits": enriched_hits,
            "total": results["nbHits"],
            "page": results["page"],
            "pages": results["nbPages"]
        }

    # ----------- USERS + POSTS -------------
    def search_all(
        self,
        query: str,
        page: int = 0,
        hits_per_page: int = 10,
        only_root_posts: bool = True,
        current_user_id: str = None
    ) -> Dict[str, Any]:
        """
        Search users + posts using Algolia multi-index search
        """

        # Prepare params for users
        users_params = {
            "page": page,
            "hitsPerPage": hits_per_page
        }

        # Prepare params for posts
        posts_params = {
            "page": page,
            "hitsPerPage": hits_per_page
        }
        if only_root_posts:
            posts_params["filters"] = "level = 0"

        requests: List[Dict[str, Any]] = [
            {
                "indexName": settings.ALGOLIA_USERS_INDEX_NAME,
                "query": query,
                "params": urlencode(users_params)
            },
            {
                "indexName": settings.ALGOLIA_POSTS_INDEX_NAME,
                "query": query,
                "params": urlencode(posts_params)
            }
        ]

        response = self.client.multiple_queries(requests)

        users_result = response["results"][0]
        posts_result = response["results"][1]
        
        user_hits = users_result["hits"]
        post_hits = posts_result["hits"]
        
        # Filter & Enrich Users
        if current_user_id:
             user_hits = self._filter_out_blocked_items(user_hits, "users", current_user_id)
        enriched_users = self._enrich_users_with_follow_status(user_hits, current_user_id)
        
        # Enrich & Filter Posts
        enriched_posts = self._enrich_posts_with_full_data(post_hits)
        if current_user_id:
             enriched_posts = self._filter_out_blocked_items(enriched_posts, "posts", current_user_id)

        return {
            "users": {
                "hits": enriched_users,
                "total": users_result["nbHits"],
                "page": users_result["page"],
                "pages": users_result["nbPages"]
            },
            "posts": {
                "hits": enriched_posts,
                "total": posts_result["nbHits"],
                "page": posts_result["page"],
                "pages": posts_result["nbPages"]
            }
        }


# Singleton instance
algolia_search_service = AlgoliaSearchService()
