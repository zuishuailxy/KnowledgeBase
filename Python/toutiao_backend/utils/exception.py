"""
define global exception handlers for the application
"""

import traceback
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from starlette import status

DEBUG_MODE = True  # Set to False in production


# for business logic errors, we can raise HTTPException with appropriate status code and message
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": exc.detail, "data": None},
    )


# for integrity constraint errors
def integrity_error_handler(request: Request, exc: IntegrityError):
    # Log the error with traceback for debugging
    error_message = str(exc.orig) if exc.orig else str(exc)
    print(error_message)  # In production, use a proper logging framework

    if "username_UNIQUE" in error_message:
        detail_message = "Username already exists."
    elif "Duplicate entry" in error_message:
        detail_message = "Duplicate entry found."
    elif "FOREIGN KEY" in error_message:
        detail_message = "Related resource not found."
    else:
        detail_message = "Data integrity constraint violated."
    # Return a generic error message to the client
    error_data = None
    if DEBUG_MODE:
        error_data = {
            "error_detail": error_message,
            "error_type": "IntegrityError",
            "path": str(request.url.path),
        }

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "code": status.HTTP_400_BAD_REQUEST,
            "message": detail_message,
            "data": error_data,
        },
    )


# for database errors, we can log the error and return a generic message to the client
def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    # Log the error with traceback for debugging
    error_message = f"Database error: {str(exc)}\n{traceback.format_exc()}"
    print(error_message)  # In production, use a proper logging framework

    error_data = None
    if DEBUG_MODE:
        error_data = {
            "error_detail": error_message,
            "error_type": type(exc).__name__,
            "path": str(request.url.path),
        }

    # Return a generic error message to the client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "An internal server error occurred. Please try again later.",
            "data": error_data,
        },
    )


# general exception handler for uncaught exceptions
def general_exception_handler(request: Request, exc: Exception):
    # Log the error with traceback for debugging
    error_message = f"Unexpected error: {str(exc)}\n{traceback.format_exc()}"
    print(error_message)  # In production, use a proper logging framework

    error_data = None
    if DEBUG_MODE:
        error_data = {
            "error_detail": error_message,
            "error_type": type(exc).__name__,
            "path": str(request.url.path),
        }

    # Return a generic error message to the client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "An unexpected error occurred. Please try again later.",
            "data": error_data,
        },
    )


# register handlers
def register_exception_handlers(app):
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
