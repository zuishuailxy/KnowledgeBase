from datetime import datetime, timedelta
import uuid

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from models.users import User, UserToken
from schemas.users import (
    UserChangePasswordRequest,
    UserRegisterRequest,
    UserUpdateRequest,
)
from utils.security import hash_password, verify_password
from starlette import status


# get user info by username
async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


# create new user by username and password
async def create_user(db: AsyncSession, userdata: UserRegisterRequest) -> User:
    # hash password
    userdata.password = hash_password(userdata.password)
    new_user = User(username=userdata.username, password=userdata.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# generate user token
async def generate_user_token(db: AsyncSession, user_id: int) -> str:
    # This function will be implemented later to generate a JWT token for the user

    # generate a new token
    new_token = uuid.uuid4().hex
    expire_at = datetime.now() + timedelta(days=7)  # token expires in 7 days

    query = select(UserToken).where(UserToken.user_id == user_id)
    result = await db.execute(query)

    user_token = result.scalar_one_or_none()
    try:
        if user_token:
            # 情况1：更新现有的令牌
            user_token.token = new_token
            user_token.expire_at = expire_at
            user_token.updated_at = datetime.now()
        else:
            # 情况2：创建新的令牌
            user_token = UserToken(
                user_id=user_id, token=new_token, expire_at=expire_at, login_type="web"
            )
            db.add(user_token)

        # 无论走哪个分支，都需要统一提交事务以持久化数据
        await db.commit()

        # 刷新对象状态，确保获取最新的数据库数据（可选，视业务需求而定）
        await db.refresh(user_token)

    except Exception as e:
        # 发生错误时回滚事务，防止脏数据或锁表
        await db.rollback()
        raise e

    return new_token


# auth login by username and password
async def auth_login(db: AsyncSession, username: str, password: str) -> User | None:
    user = await get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None

    return user


# get user info by token
async def get_user_by_token(db: AsyncSession, token: str) -> User | None:
    query = select(UserToken).where(UserToken.token == token)
    result = await db.execute(query)
    user_token = result.scalar_one_or_none()
    if not user_token or user_token.expire_at < datetime.now():
        return None

    query = select(User).where(User.id == user_token.user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


# update user info
async def update_user_info(
    db: AsyncSession, user_name: str, userdata: UserUpdateRequest
) -> User | None:
    stmt = (
        update(User)
        .where(User.username == user_name)
        .values(
            **userdata.model_dump(
                exclude_unset=True,  # 只更新提供的字段
                exclude={"password"},  # 明确排除密码字段，防止意外更新
                exclude_none=True,  # 排除值为 None 的字段，避免将字段设置为 None
            ),
            updated_at=datetime.now(),
        )
    )
    result = await db.execute(stmt)
    await db.commit()
    # check if the update was successful
    if getattr(result, "rowcount", 0) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    updated_user = await get_user_by_username(db, user_name)
    return updated_user


async def update_user_password(
    password_data: UserChangePasswordRequest, user: User, db: AsyncSession
):
    # verify old password
    if not verify_password(password_data.old_password, user.password):
        print(f"Verifying old password for user {user.username} failed.")
        return False

    # update password
    hashed_new_password = hash_password(password_data.new_password)
    user.password = hashed_new_password
    user.updated_at = datetime.now()

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return True
