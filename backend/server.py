"""
ETHARA TEAM TASK MANAGER - FastAPI Backend Entry Point
Imports the FastAPI application defined in app/main.py.
This file exists for supervisor compatibility; production uses `uvicorn app.main:app`.
"""
from app.main import app  # noqa: F401
