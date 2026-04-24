from fastapi import FastAPI, Query, Path, HTTPException, Depends
from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import Optional, List
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


app = FastAPI()


class Address(BaseModel):
    city: str
    zip_code: str


class User(BaseModel):
    name: str = Field(..., min_length=2, max_length=20)
    age: int = Field(..., gt=0, lt=120)
    height: Optional[float] = Field(None, gt=0)
    address: Optional[Address] = None

    @field_validator("name")
    def validate_name(cls, value):
        if not value.isalpha():
            raise ValueError("Name must contain only letters")
        return value


@app.get("/")
def read_root():
    return {"Hello": "World"}


# query 参数
@app.get("/users")
def get_users(limit: int = Query(10, gt=0, lt=100), q: Optional[str] = None):
    return {"limit": limit, "q": q}


# path 参数, ... 表示必填参数, gt=0 表示必须大于0
@app.get("/users/{user_id}")
def get_user(user_id: int = Path(..., gt=0)):
    if user_id == 1:
        raise AppException(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
    # if user_id == 2:
    #     raise RequestValidationError()
    return {"user_id": user_id}


# path 和 query
@app.get("/users/{user_id}/orders")
def get_orders(user_id: int = Path(..., gt=0), status: Optional[str] = Query(200)):
    return {"user_id": user_id, "status": status}


@app.post("/user/")
def create_user(user: User) -> User:
    return {**user.model_dump()}


@app.get("/products/{product_id}")
def get_product(
    product_id: int = Path(..., gt=0),
    page: int = Query(1, gt=0),
    page_size: int = Query(10, gt=0, le=100),
):
    return {"product_id": product_id, "page": page, "page_size": page_size}


@app.post("/users/batch")
def create_user(user: List[User]):
    return [user.model_dump() for user in user]


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None


@app.patch("/users/{id}")
def update_user(id: int, user: UserUpdate):
    return {"id": id, "update": user}


# 自定义异常
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code


@app.exception_handler(AppException)
def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "data": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Invalid request parameters",
            "data": exc.errors(),
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "data": None,
        },
    )

# 依赖

def get_current_user(token: str = Query(...)):
    return {"id": token}

@app.get("/profile")
def profile(user = Depends(get_current_user)):
    return user


def admin_required(user = Depends(get_current_user)):
    if user["id"] != str(1):
        raise AppException(code="UNAUTHORIZED", message="Unauthorized", status_code=401)
    return user


@app.get("/admin")
def admin_panel(user = Depends(admin_required)):
    return {"ok": True}

class CommonQuery:
    def __init__(self, q: str = Query(...)):
        self.q = q

@app.get("/query")
def get_items(common: CommonQuery = Depends()):
    return {"q": common.q}