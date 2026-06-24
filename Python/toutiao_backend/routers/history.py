from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from schemas.favorite import (
    FavoriteAddRequest,
    FavoriteCheckResponse,
    FavoriteListResponse,
    FavoriteNewsItem,
    FavoriteResponse,
)
from schemas.history import HistoryAddRequest, HistoryResponse, HistoryListResponse
from utils.auth import get_current_user
from models.users import User
from starlette import status
from utils.response import success_response
from config.db_config import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from crud import history

router = APIRouter(prefix="/api/history", tags=["history"])


@router.post("/add")
async def add_history(
    request: HistoryAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_history = await history.add_history(db, user.id, request.news_id)
    print(f"Added news {request.news_id} to user {user.id}'s history", new_history)
    return success_response(
        message="Added to history successfully",
        data=HistoryResponse.model_validate(new_history),
    )


@router.get("/list")
async def list_history(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    histories, total_count = await history.list_history(db, user.id, page, page_size)

    has_more = page * page_size < total_count
    return success_response(
        message="Retrieved history successfully",
        data=HistoryListResponse.model_validate(
            {"list": histories, "total": total_count, "has_more": has_more}
        ),
    )


@router.delete("/delete")
async def delete_history(
    history_id: int = Query(..., alias="historyId", description="历史记录ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await history.delete_history(db, user.id, history_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History not found",
        )
    return success_response(message="Deleted history successfully")


@router.delete("/clear")
async def clear_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await history.clear_history(db, user.id)
    return success_response(message=f"Cleared {result} history records successfully")
