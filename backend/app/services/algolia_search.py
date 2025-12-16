from algoliasearch.search_client import SearchClient
from typing import Dict, Any, List
from urllib.parse import urlencode
from app.core.config import settings


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

    # ---------------- USERS ----------------
    def search_users(
        self,
        query: str,
        page: int = 0,
        hits_per_page: int = 20
    ) -> Dict[str, Any]:
        results = self.users_index.search(query, {
            "page": page,
            "hitsPerPage": hits_per_page
        })

        return {
            "type": "users",
            "hits": results["hits"],
            "total": results["nbHits"],
            "page": results["page"],
            "pages": results["nbPages"]
        }

    # ---------------- POSTS ----------------
    def search_posts(
        self,
        query: str,
        page: int = 0,
        hits_per_page: int = 20,
        only_root_posts: bool = True
    ) -> Dict[str, Any]:
        filters = "level = 0" if only_root_posts else None

        results = self.posts_index.search(query, {
            "page": page,
            "hitsPerPage": hits_per_page,
            "filters": filters
        })

        return {
            "type": "posts",
            "hits": results["hits"],
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
        only_root_posts: bool = True
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

        print(f"DEBUG: requests payload: {requests}")
        print(f"DEBUG: App ID: {settings.ALGOLIA_APP_ID}")
        print(f"DEBUG: Index Names: {settings.ALGOLIA_USERS_INDEX_NAME}, {settings.ALGOLIA_POSTS_INDEX_NAME}")
        response = self.client.multiple_queries(requests)

        users_result = response["results"][0]
        posts_result = response["results"][1]

        return {
            "users": {
                "hits": users_result["hits"],
                "total": users_result["nbHits"],
                "page": users_result["page"],
                "pages": users_result["nbPages"]
            },
            "posts": {
                "hits": posts_result["hits"],
                "total": posts_result["nbHits"],
                "page": posts_result["page"],
                "pages": posts_result["nbPages"]
            }
        }


# Singleton instance
algolia_search_service = AlgoliaSearchService()
