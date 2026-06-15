from fastapi import APIRouter, Depends, Query, HTTPException
from crud.new import (
    get_categories,
    get_news_list as get_news_list_crud,
    get_news_total,
    get_news_detail as get_news_detail_crud,
    increase_news_view,
    get_related_news,
)
from config.db_config import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/categories")
async def get_news_categories(
    skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)
):
    categories = await get_categories(db, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "get news categories successfully",
        "data": categories,
    }


@router.get("/list")
async def get_news_list(
    category_id: int = Query(..., alias="categoryId", description="新闻分类ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=10, le=100, description="每页数量", alias="pageSize"),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    news_list = await get_news_list_crud(
        db, category_id=category_id, skip=offset, limit=page_size
    )
    total = await get_news_total(db, category_id=category_id)
    has_more = offset + len(news_list) < total
    return {
        "code": 200,
        "message": "get news list successfully",
        "data": news_list,
        "total": total,
        "hasMore": has_more,
    }


@router.get("/detail")
async def get_news_detail(
    new_id: int = Query(..., alias="id"), db: AsyncSession = Depends(get_db)
):
    news_detail = await get_news_detail_crud(db, new_id=new_id)
    if not news_detail:
        raise HTTPException(status_code=404, detail="News not found")

    view_updated = await increase_news_view(db, new_id=new_id)
    if not view_updated:
        raise HTTPException(status_code=500, detail="Failed to update news view count")

    related_news = await get_related_news(
        db, category_id=news_detail.category_id, exclude_new_id=new_id
    )

    return {
        "code": 200,
        "message": "get news detail successfully",
        "data": news_detail,
        "relatedNews": related_news,
    }
