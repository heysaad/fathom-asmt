from app.api import ship_routes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", summary="Root endpoint")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "version": settings.version}

@app.get("/health", summary="Health check")
def health() -> dict[str, str]:
    return {"status": "Healthy"}

app.include_router(ship_routes.router, prefix="/ships", tags=["ships"])