from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, func, update
from models.favorite import Favorite
from models.news import Category, News


# check if a news is in user's favorites
async def is_favorite(db: AsyncSession, user_id: int, news_id: int) -> bool:
    # This function will be implemented later to check if the news is in the user's favorites
    # For now, we will just return False as a placeholder
    stmt = select(Favorite).where(
        Favorite.user_id == user_id, Favorite.news_id == news_id
    )

    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


# add a news to user's favorites
async def add_favorite(db: AsyncSession, user_id: int, news_id: int):
    new_favorite = Favorite(user_id=user_id, news_id=news_id)
    db.add(new_favorite)
    await db.commit()
    await db.refresh(new_favorite)

    return new_favorite


# remove a news from user's favorites
async def remove_favorite(db: AsyncSession, user_id: int, news_id: int):
    stmt = delete(Favorite).where(
        Favorite.user_id == user_id, Favorite.news_id == news_id
    )
    result = await db.execute(stmt)
    await db.commit()

    return getattr(result, "rowcount", 0) > 0


# list all favorites of the user
async def get_favorites_list(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 10
):
    total = await db.execute(select(func.count()).where(Favorite.user_id == user_id))
    total_count = total.scalar_one_or_none() or 0

    stmt = (
        select(
            *News.__table__.c,
            Favorite.created_at.label("favorite_time"),
            Favorite.id.label("favorite_id"),
        )
        .join(Favorite, Favorite.news_id == News.id)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(stmt)
    favorites = [dict(row) for row in result.mappings().all()]
    return favorites, total_count


async def clear_favorites(db: AsyncSession, user_id: int):
    stmt = delete(Favorite).where(Favorite.user_id == user_id)
    result = await db.execute(stmt)
    await db.commit()

    return getattr(result, "rowcount", 0)
