from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from cache.news_cache import (
    get_cached_categories,
    set_cached_categories,
    get_cached_news_list,
    set_cached_news_list,
)
from models.news import Category, News
from schemas.base import NewsItemBase


async def get_categories(db: AsyncSession, skip: int = 0, limit: int = 10):
    cached_categories = await get_cached_categories()
    if cached_categories is not None:
        print("Categories fetched from cache", cached_categories)
        return cached_categories

    stmt = select(Category).offset(skip).limit(limit)
    result = await db.execute(stmt)
    categories = result.scalars().all()
    if categories:
        categories = jsonable_encoder(categories)
        await set_cached_categories(categories)
    return categories


async def get_news_list(
    db: AsyncSession, category_id: int, skip: int = 0, limit: int = 10
):
    # 通过 skip 计算 page
    page = (skip // limit) + 1
    cached_news_list = await get_cached_news_list(category_id, page, limit)
    if cached_news_list is not None:
        print("News list fetched from cache", cached_news_list)
        # 如果缓存中有数据，直接返回， dict -> ORM对象
        news_list = [News(**news) for news in cached_news_list]
        return cached_news_list

    stmt = select(News).where(News.category_id == category_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    news_list = result.scalars().all()
    if news_list:
        # 将 ORM 对象转换为 dict 列表以便缓存
        # ORM -> Pydantic 模型 -> dict
        news_list = [
            NewsItemBase.model_validate(news).model_dump(mode="json", by_alias=False)
            for news in news_list
        ]

        news_list = jsonable_encoder(news_list)
        await set_cached_news_list(category_id, page, limit, news_list)

    return news_list


async def get_news_total(db: AsyncSession, category_id: int):
    stmt = select(func.count(News.id)).where(News.category_id == category_id)
    result = await db.execute(stmt)
    return result.scalar_one()


async def get_news_detail(db: AsyncSession, new_id: int):
    # This function will be implemented later to fetch news detail based on new_id
    stmt = select(News).where(News.id == new_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def increase_news_view(db: AsyncSession, new_id: int):
    stmt = update(News).where(News.id == new_id).values(views=News.views + 1)
    result = await db.execute(stmt)
    await db.commit()

    return bool(
        getattr(result, "rowcount", 0)
    )  # Return True if at least one row was updated


async def get_related_news(
    db: AsyncSession, category_id: int, exclude_new_id: int, limit: int = 5
):
    stmt = (
        select(News)
        .where(News.category_id == category_id, News.id != exclude_new_id)
        .order_by(News.views.desc(), News.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
