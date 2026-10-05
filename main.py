"""Compatibility entry point for ``uv run uvicorn main:app --reload``."""

from app.main import app

__all__ = ["app"]
