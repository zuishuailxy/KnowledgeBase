from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from schemas.favorite import (
    FavoriteAddRequest,
    FavoriteCheckResponse,
    FavoriteListResponse,
    FavoriteNewsItem,
    FavoriteResponse,
)
from utils.auth import get_current_user
from models.users import User
from starlette import status
from utils.response import success_response
from config.db_config import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from crud import favorite

router = APIRouter(prefix="/api/favorite", tags=["favorite"])


@router.get("/check")
async def check_favorite(
    news_id: int = Query(..., alias="newsId", description="新闻ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    is_fav = await favorite.is_favorite(db, user.id, news_id)
    return success_response(
        message="Check favorite status successfully",
        data=FavoriteCheckResponse(isFavorite=is_fav),
    )


@router.post("/add")
async def add_favorite(
    request: FavoriteAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_favorite = await favorite.add_favorite(db, user.id, request.news_id)
    print(f"Added news {request.news_id} to user {user.id}'s favorites", new_favorite)
    return success_response(
        message="Added to favorites successfully",
        data=FavoriteResponse.model_validate(new_favorite),
    )


@router.delete("/remove")
async def remove_favorite(
    news_id: int = Query(..., alias="newsId", description="新闻ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await favorite.remove_favorite(db, user.id, news_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found or already removed",
        )
    return success_response(message="Removed from favorites successfully")


@router.get("/list")
async def get_favorites_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="每页数量"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # This function will be implemented later to list all favorites of the user
    favorites, total_count = await favorite.get_favorites_list(
        db, user.id, page, page_size
    )
    has_more = page * page_size < total_count

    return success_response(
        message="List favorites successfully",
        data=FavoriteListResponse.model_validate(
            {"list": favorites, "total": total_count, "hasMore": has_more}
        ),
    )


# clear favorites of the user
@router.delete("/clear")
async def clear_favorites(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await favorite.clear_favorites(db, user.id)
    return success_response(message=f"Cleared {result} favorites successfully")
