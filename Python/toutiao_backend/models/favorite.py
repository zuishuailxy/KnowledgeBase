from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from models.users import User
from models.news import News


class Base(DeclarativeBase):
    pass


class Favorite(Base):
    __tablename__ = "user_favorites"

    # Add an index on user_id and news_id for faster queries filtering by user and news
    __table_args__ = (
        # we can also add a unique constraint to prevent duplicate favorites for the same user and news
        UniqueConstraint("user_id", "news_id", name="unique_user_news"),
        Index("idx_user_id", "user_id"),
        Index("idx_news_id", "news_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey(User.id), nullable=False, comment="用户ID"
    )
    news_id: Mapped[int] = mapped_column(
        Integer, ForeignKey(News.id), nullable=False, comment="新闻ID"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间", nullable=False
    )

    def __repr__(self):
        return (
            f"<Favorite(id={self.id}, user_id={self.user_id}, news_id={self.news_id})>"
        )
