from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


def success_response(data=None, message="Success", code=200):
    content = {
        "code": code,
        "message": message,
        "data": data,
    }
    return JSONResponse(content=jsonable_encoder(content))
