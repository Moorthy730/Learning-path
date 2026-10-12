"""
exceptions.py — Custom exception types and global FastAPI exception handlers.
"""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class PathPilotError(Exception):
    """Base error for PathPilot."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthError(PathPilotError):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(PathPilotError):
    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class NotFoundError(PathPilotError):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(f"{resource} not found", status_code=status.HTTP_404_NOT_FOUND)


class ValidationError(PathPilotError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class AIServiceError(PathPilotError):
    def __init__(self, message: str = "AI service error") -> None:
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class RateLimitError(PathPilotError):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message, status_code=status.HTTP_429_TOO_MANY_REQUESTS)


class DatabaseError(PathPilotError):
    def __init__(self, message: str = "Database operation failed") -> None:
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI app."""

    @app.exception_handler(PathPilotError)
    async def pathpilot_exception_handler(
        request: Request, exc: PathPilotError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "detail": exc.message},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Never expose internal details in production
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred. Please try again."},
        )
