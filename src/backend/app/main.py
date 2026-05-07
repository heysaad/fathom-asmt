from contextlib import asynccontextmanager
import logging

from alembic import command

from app.api import ship_routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from fastapi_users.authentication import BearerTransport

from app.infra.data.database import run_migrations
from app.api import auth_routes

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


app.include_router(ship_routes.router, prefix="/ships", tags=["ships"])
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])

bearer_transport = BearerTransport(tokenUrl="auth/login")