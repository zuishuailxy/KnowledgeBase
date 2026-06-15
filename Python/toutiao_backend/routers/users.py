from fastapi import APIRouter, Depends, Query, HTTPException
from models.users import User
from config.db_config import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.users import (
    UserChangePasswordRequest,
    UserRegisterRequest,
    UserAuthResponse,
    UserInfoResponse,
    UserUpdateRequest,
)
from crud.users import (
    create_user,
    get_user_by_username,
    generate_user_token,
    auth_login,
    update_user_info as update_user_info_crud,
    update_user_password,
)
from starlette import status
from utils.response import success_response
from utils.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["users"])


@router.post("/register")
async def register_user(
    user_data: UserRegisterRequest = Query(..., description="用户注册信息"),
    db: AsyncSession = Depends(get_db),
):
    # 验证用户数据（这里只是示例，实际应用中需要更复杂的验证）
    existing_user = await get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    new_user = await create_user(db, user_data)
    token = await generate_user_token(db, new_user.id)
    response_data = UserAuthResponse(
        token=token,
        userInfo=UserInfoResponse.model_validate(new_user),
    )
    return success_response(
        data=response_data,
        message="User registration successful",
    )


@router.post("/login")
async def login_user(
    user_data: UserRegisterRequest = Query(..., description="用户注册信息"),
    db: AsyncSession = Depends(get_db),
):
    # This function will be implemented later to handle user login
    user = await auth_login(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = await generate_user_token(db, user.id)
    response_data = UserAuthResponse(
        token=token,
        userInfo=UserInfoResponse.model_validate(user),
    )
    return success_response(
        data=response_data,
        message="User login successful",
    )


@router.get("/info")
async def get_user_info(user: User = Depends(get_current_user)):

    return success_response(
        data=UserInfoResponse.model_validate(user),
        message="User info retrieved successfully",
    )


@router.put("/update")
async def update_user_info(
    user_data: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # This function will be implemented later to handle user info update
    updated_user = await update_user_info_crud(db, user.username, user_data)

    return success_response(
        data=UserInfoResponse.model_validate(updated_user),
        message="User info updated successfully",
    )


# change password endpoint
@router.put("/password")
async def change_password(
    password_data: UserChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    is_updated = await update_user_password(password_data, user, db)
    if not is_updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password",
        )

    return success_response(
        data=None,
        message="Password changed successfully",
    )
