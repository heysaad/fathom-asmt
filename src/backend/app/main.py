from app.api import ship_routes
from fastapi import FastAPI

app = FastAPI(title="Fathom assessment API", version="0.1.0")

@app.get("/health", summary="Health check")
def health() -> dict[str, str]:
    return {"status": "Healthy"}

app.include_router(ship_routes.router, prefix="/ships", tags=["ships"])