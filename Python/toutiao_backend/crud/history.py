from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, func, update
from models.history import History
from models.news import Category, News


async def add_history(db: AsyncSession, user_id: int, news_id: int):
    # check if the history entry already exists for the user and news
    stmt = select(History).where(History.user_id == user_id, History.news_id == news_id)
    result = await db.execute(stmt)
    existing_history = result.scalar_one_or_none()
    if existing_history:
        # if it exists, update the updated_at timestamp to now
        existing_history.updated_at = func.now()
        db.add(existing_history)
        await db.commit()
        await db.refresh(existing_history)
        return existing_history

    else:
        # add a news to user's history

        new_history = History(user_id=user_id, news_id=news_id)
        db.add(new_history)
        await db.commit()
        await db.refresh(new_history)

        return new_history


async def list_history(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 10
):
    count_stmt = select(func.count()).where(History.user_id == user_id)
    total_count = (await db.execute(count_stmt)).scalar_one_or_none() or 0

    stmt = (
        select(
            *News.__table__.c,
            History.updated_at.label("view_time"),
            History.id.label("history_id"),
        )
        .join(History, History.news_id == News.id)
        .where(History.user_id == user_id)
        .order_by(History.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(stmt)
    histories = [dict(row) for row in result.mappings().all()]
    return histories, total_count


async def delete_history(db: AsyncSession, user_id: int, history_id: int):
    stmt = delete(History).where(History.user_id == user_id, History.id == history_id)
    result = await db.execute(stmt)
    await db.commit()

    return getattr(result, "rowcount", 0) > 0


async def clear_history(db: AsyncSession, user_id: int):
    stmt = delete(History).where(History.user_id == user_id)
    result = await db.execute(stmt)
    await db.commit()

    return getattr(result, "rowcount", 0)
