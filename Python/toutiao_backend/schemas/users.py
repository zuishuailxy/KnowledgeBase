from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class UserRegisterRequest(BaseModel):
    username: str
    password: str


class UserInfoBase(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50, description="用户昵称")


class UserInfoResponse(UserInfoBase):
    id: int
    username: str

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class UserAuthResponse(BaseModel):
    token: str
    user_info: UserInfoResponse = Field(..., alias="userInfo")

    model_config = ConfigDict(
        populate_by_name=True,  # 允许通过字段名称进行赋值
        from_attributes=True,  # 允许从对象属性创建模型实例
    )


class UserUpdateRequest(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50, description="用户昵称")


class UserChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="旧密码", alias="oldPassword")
    new_password: str = Field(
        ..., description="新密码", alias="newPassword", min_length=6
    )
