from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Index


class Base(DeclarativeBase):
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="更新时间", nullable=False
    )


class Category(Base):
    __tablename__ = "news_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, comment="分类名称"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="排序字段，数值越小优先展示"
    )

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', sort_order={self.sort_order})>"


class News(Base):
    __tablename__ = "news"

    # Add an index on category_id for faster queries filtering by category
    __table_args__ = (Index("idx_category_id", "category_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="新闻标题")
    description: Mapped[str] = mapped_column(Text, nullable=False, comment="新闻描述")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="新闻内容")
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("news_categories.id"), nullable=False, comment="分类ID"
    )
    views: Mapped[int] = mapped_column(Integer, default=0, comment="浏览量")

    def __repr__(self):
        return f"<News(id={self.id}, title='{self.title}', category_id={self.category_id})>"
