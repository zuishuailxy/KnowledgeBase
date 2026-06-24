from config.db_config import get_db
from crud.users import get_user_by_token
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, Header
from starlette import status


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
):
    # This function will be implemented later to get current user info based on the token
    # Bearer xxx.yyy.zzz
    token = authorization.split(" ")[1] if " " in authorization else None
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = await get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user
