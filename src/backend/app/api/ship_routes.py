from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.infra.data.database import get_db
from app.infra.data.models.Ship import Ship

router = APIRouter()

@router.get("/", summary="Get ships")
async def get_ship_routes(db=Depends(get_db)):
    result = await db.execute(select(Ship).limit(10))
    return result.scalars().all()