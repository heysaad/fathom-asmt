from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from app.infra.data.database import get_db
from app.infra.data.models.Ship import Ship

router = APIRouter()


@router.get("", summary="Get ships")
async def get_ship_routes(db=Depends(get_db)):
    result = await db.execute(select(Ship).order_by(Ship.created_at.desc()).limit(10))
    return result.scalars().all()


@router.post("", summary="Create a ship")
async def create_ship_route(req: CreateShipRequest, db=Depends(get_db)):
    ship = Ship(name=req.name, type="Container Ship")
    db.add(ship)
    await db.commit()
    await db.refresh(ship)
    return CreateShipResponse(id=ship.id)

class CreateShipRequest(BaseModel):
    name: str

class CreateShipResponse(BaseModel):
    id: str