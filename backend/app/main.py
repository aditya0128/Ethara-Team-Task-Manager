"""ETHARA TEAM TASK MANAGER - FastAPI application factory."""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from .database import Base, engine, SessionLocal  # noqa: E402
from .seed import seed_database  # noqa: E402
from .routers import auth as auth_router  # noqa: E402
from .routers import users as users_router  # noqa: E402
from .routers import teams as teams_router  # noqa: E402
from .routers import projects as projects_router  # noqa: E402
from .routers import tasks as tasks_router  # noqa: E402
from .routers import attendance as attendance_router  # noqa: E402
from .routers import analytics as analytics_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("ethara")

app = FastAPI(
    title="ETHARA TEAM TASK MANAGER",
    version="1.0.0"
)

# CORS FIX
# CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


api = APIRouter(prefix="/api")


@api.get("/")
def root():
    return {
        "app": "ETHARA TEAM TASK MANAGER",
        "status": "ok",
        "version": "1.0.0"
    }


@api.get("/health")
def health():
    return {"status": "healthy"}


api.include_router(auth_router.router)
api.include_router(users_router.router)
api.include_router(teams_router.router)
api.include_router(projects_router.router)
api.include_router(tasks_router.router)
api.include_router(attendance_router.router)
api.include_router(analytics_router.router)

app.include_router(api)


@app.on_event("startup")
def startup():
    logger.info("Creating tables if not exist...")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        seed_database(db)
        logger.info("Database seeded.")

    except Exception as e:
        logger.exception("Seeding failed: %s", e)

    finally:
        db.close()


@app.get("/")
def hello():
    return {
        "app": "ETHARA TEAM TASK MANAGER",
        "docs": "/docs",
        "api": "/api"
    }