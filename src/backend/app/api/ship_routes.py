from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, TypeAdapter
from sqlalchemy import select
from app.infra.data.database import get_db
from app.infra.data.models.Ship import Ship

router = APIRouter()


@router.get("", summary="Get ships")
async def get_ship_routes(db=Depends(get_db)):
    result = await db.execute(select(Ship).order_by(Ship.created_at.desc()).limit(10))
    data = result.scalars().all()
    return TypeAdapter(list[ShipDto]).validate_python(data)


@router.post("", summary="Create a ship")
async def create_ship_route(req: CreateShipRequest, db=Depends(get_db)):
    ship = Ship(
        name=req.name,
        type="Container Ship",
        imo=req.imo,
        description=req.description
    )
    db.add(ship)
    await db.commit()
    await db.refresh(ship)
    return CreateShipResponse(id=ship.id)


class CreateShipRequest(BaseModel):
    name: str
    imo: str
    description: str


class CreateShipResponse(BaseModel):
    id: str


class ShipDto(BaseModel):
    model_config = ConfigDict(from_attributes=True) 
    
    id: str
    name: str
    imo: str | None
    description: str | None
    type: str
    created_at: datetime


@router.get("/{ship_id}", summary="Get ship details")
async def get_ship_details_route(ship_id: str, db=Depends(get_db)):
    result = await db.execute(select(Ship).where(Ship.id == ship_id))
    ship = result.scalar_one_or_none()
    if not ship:
        return {"error": "Ship not found"}
    return TypeAdapter(ShipDto).validate_python(ship)
