from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

from schemas.base import NewsItemBase


class FavoriteCheckResponse(BaseModel):
    is_favorite: bool = Field(..., description="是否收藏", alias="isFavorite")


class FavoriteAddRequest(BaseModel):
    news_id: int = Field(..., description="新闻ID", alias="newsId")


class FavoriteResponse(BaseModel):
    id: int = Field(..., description="收藏ID")
    user_id: int = Field(..., description="用户ID", alias="userId")
    news_id: int = Field(..., description="新闻ID", alias="newsId")
    created_at: Optional[datetime] = Field(
        None, description="创建时间", alias="createdAt"
    )

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class FavoriteNewsItem(NewsItemBase):
    favorite_id: int = Field(..., description="收藏ID", alias="favoriteId")
    favorite_time: Optional[datetime] = Field(
        None, description="收藏时间", alias="favoriteTime"
    )

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class FavoriteListResponse(BaseModel):
    list: List[FavoriteNewsItem] = Field(..., description="收藏列表")
    total: int = Field(..., description="收藏总数")
    has_more: bool = Field(..., description="是否有更多数据", alias="hasMore")
    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )
