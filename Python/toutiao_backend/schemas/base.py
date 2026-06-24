from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class NewsItemBase(BaseModel):
    id: int = Field(..., description="新闻ID")
    title: Optional[str] = Field(None, description="新闻标题")
    description: Optional[str] = Field(None, description="新闻描述")
    content: Optional[str] = Field(None, description="新闻内容")
    category_id: int = Field(..., description="分类ID")
    views: Optional[int] = Field(None, description="浏览量")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )
