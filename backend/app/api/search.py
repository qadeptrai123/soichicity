from fastapi import APIRouter, Query, Depends
from typing import Dict, Any, Optional
from app.services.algolia_search import algolia_search_service
from app.api.deps import get_current_user_optional

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
def search(
    q: str = Query(..., min_length=0),
    type: str = Query("all", regex="^(user|post|all)$"),
    page: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Search across users and posts using Algolia.
    Type can be: 'user', 'post', 'all' (default)
    """
    current_user_id = current_user['uid'] if current_user else None

    if type == "user":
        return algolia_search_service.search_users(
            query=q,
            page=page,
            hits_per_page=limit,
            current_user_id=current_user_id
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
            hits_per_page=limit,
            current_user_id=current_user_id
        )
