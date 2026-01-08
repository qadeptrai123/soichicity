from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.services.algolia_search import algolia_search_service

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
def search(
    q: str = Query(..., min_length=0),
    type: str = Query("all", regex="^(user|post|all)$"),
    page: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Search across users and posts using Algolia.
    Type can be: 'user', 'post', 'all' (default)
    """
    if type == "user":
        return algolia_search_service.search_users(
            query=q,
            page=page,
            hits_per_page=limit
        )
    elif type == "post":
        return algolia_search_service.search_posts(
            query=q,
            page=page,
            hits_per_page=limit
        )
    else:
        return algolia_search_service.search_all(
            query=q,
            page=page,
            hits_per_page=limit
        )
