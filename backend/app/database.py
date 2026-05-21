"""Database setup"""

from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Absolute path to backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Database file inside backend folder
DB_PATH = BASE_DIR / "ethara.db"

DATABASE_URL = f"sqlite:///{DB_PATH}"

# Railway postgres fix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )

connect_args = {
    "check_same_thread": False
}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()