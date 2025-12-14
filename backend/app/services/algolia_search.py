from algoliasearch.search_client import SearchClient
from typing import Dict, Any
from app.core.config import settings

class AlgoliaSearchService:
    def __init__(self):
        """Initialize Algolia client and index"""
        self.client = SearchClient.create(
            settings.ALGOLIA_APP_ID,
            settings.ALGOLIA_ADMIN_API_KEY
        )
        self.users_index = self.client.init_index(settings.ALGOLIA_USERS_INDEX_NAME)
    
    def search_users(
        self, 
        query: str,
        page: int = 0,
        hits_per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Search users by username or full name
        
        Args:
            query: Search query string
            page: Page number (0-indexed)
            hits_per_page: Number of results per page
        
        Returns:
            Dictionary containing:
                - hits: List of matching users
                - nbHits: Total number of matches
                - page: Current page
                - nbPages: Total number of pages
        """
        results = self.users_index.search(query, {
            'page': page,
            'hitsPerPage': hits_per_page
        })
        
        return {
            'hits': results['hits'],
            'total': results['nbHits'],
            'page': results['page'],
            'pages': results['nbPages']
        }

# Singleton instance
algolia_search_service = AlgoliaSearchService()