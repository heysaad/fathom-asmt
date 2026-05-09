from contextlib import asynccontextmanager
import logging

from alembic import command

from app.api import ship_routes, ship_crew_routes, drills_routes
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from fastapi_users.authentication import BearerTransport

from app.infra.data.database import run_migrations
from app.api import auth_routes, user_routes, tasks_routes
from app.infra.auth.role_checker import RoleChecker
from app.infra.auth.users import get_current_user

log = logging.getLogger("uvicorn")

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting up...")
    log.info("run alembic upgrade head...")
    run_migrations()
    yield
    log.info("Shutting down...")


@app.get("/", summary="Root endpoint")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "version": settings.version}

@app.get("/health", summary="Health check")
def health() -> dict[str, str]:
    return {"status": "Healthy"}

authorize = [Depends(get_current_user)]

app.include_router(ship_routes.router, prefix="/ships", dependencies=authorize)
app.include_router(ship_crew_routes.router, prefix="/ships", dependencies=authorize)
app.include_router(drills_routes.router, prefix="/ships", dependencies=authorize)
app.include_router(auth_routes.router, prefix="/auth")
app.include_router(user_routes.router, prefix="/users", dependencies=authorize)
app.include_router(tasks_routes.router, prefix="/tasks", dependencies=authorize)

bearer_transport = BearerTransport(tokenUrl="auth/login")
