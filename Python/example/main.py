from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel, Field
from fastapi.responses import HTMLResponse, FileResponse

app = FastAPI()


@app.middleware("http")
async def middleware1(request, call_next):
    print("Middleware 1: Before request")
    response = await call_next(request)
    print("Middleware 1: After request")
    return response


class User(BaseModel):
    id: int = Field(..., description="The unique identifier for the user")
    name: str = Field(default="123", min_length=2, description="The name of the user")


class News(BaseModel):
    id: int = Field(..., description="The unique identifier for the news article")
    title: str = Field(..., description="The title of the news article")
    content: str = Field(..., description="The content of the news article")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/html", response_class=HTMLResponse)
def get_html():
    return "<h1>Hello, World!</h1>"


@app.get("/file", response_class=FileResponse)
def get_file():
    file_path = "example.txt"  # Ensure this file exists in the same directory
    return FileResponse(file_path, media_type="text/plain", filename="example.txt")


@app.get("/news/news_list")
def get_news_list(
    skip: int = Query(0, le=100, description="Number of items to skip"),
    limit: int = Query(10, le=100, description="Maximum number of items to return"),
):
    return {"skip": skip, "limit": limit, "news": "This is a news list"}


@app.get("/news/{news_id}", response_model=News)
async def get_news(news_id: int):
    if news_id < 1:
        raise HTTPException(status_code=400, detail="Invalid news ID")
    
    print(f"Fetching news with ID: {news_id}")
    return {"id": news_id, "title": f"News Title {news_id}", "content": "News Content"}


@app.post("/register")
def create_user(user: User):
    return {"message": "User created successfully", "user": user}
