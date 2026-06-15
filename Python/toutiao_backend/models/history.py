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
    func,
)
from models.users import User
from models.news import News


class Base(DeclarativeBase):
    pass


class History(Base):
    __tablename__ = "history"

    # Add an index on user_id and news_id for faster queries filtering by user and news
    __table_args__ = (
        # we can also add a unique constraint to prevent duplicate history entries for the same user and news
        UniqueConstraint("user_id", "news_id", name="unique_user_news_history"),
        Index("idx_user_id_history", "user_id"),
        Index("idx_news_id_history", "news_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey(User.id), nullable=False, comment="用户ID"
    )
    news_id: Mapped[int] = mapped_column(
        Integer, ForeignKey(News.id), nullable=False, comment="新闻ID"
    )
    # 创建时间：由数据库在 INSERT 时生成
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="创建时间",
        nullable=False,
    )

    # 更新时间：由数据库在 INSERT 和 UPDATE 时自动生成
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
        nullable=False,
    )

    def __repr__(self):
        return (
            f"<History(id={self.id}, user_id={self.user_id}, news_id={self.news_id})>"
        )
