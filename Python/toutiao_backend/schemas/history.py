from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

from schemas.base import NewsItemBase


class HistoryAddRequest(BaseModel):
    news_id: int = Field(..., description="新闻ID", alias="newsId")


class HistoryResponse(BaseModel):
    id: int = Field(..., description="历史记录ID")
    user_id: int = Field(..., description="用户ID", alias="userId")
    news_id: int = Field(..., description="新闻ID", alias="newsId")
    created_at: Optional[datetime] = Field(
        None, description="创建时间", alias="createdAt"
    )
    updated_at: Optional[datetime] = Field(
        None, description="更新时间", alias="updatedAt"
    )

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class HistoryNewsItem(NewsItemBase):
    history_id: int = Field(..., description="历史记录ID", alias="historyId")
    view_time: Optional[datetime] = Field(
        None, description="历史记录时间", alias="viewTime"
    )

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class HistoryListResponse(BaseModel):
    list: List[HistoryNewsItem] = Field(..., description="历史记录列表")
    total: int = Field(..., description="历史记录总数")
    has_more: bool = Field(..., description="是否有更多数据", alias="hasMore")

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )
