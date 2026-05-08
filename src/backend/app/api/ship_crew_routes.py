from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, TypeAdapter
from sqlalchemy import select

from app.infra.data.database import get_db
from app.infra.data.models.Ship import MaintainanceTask, ShipCrewAssignment
from app.api.user_routes import UserDto

router = APIRouter()


@router.get("/{ship_id}/crew", summary="Get all assigned crew members")
async def get_maintainance_tasks_route(ship_id: str, db=Depends(get_db)):
    result = await db.execute(
        select(ShipCrewAssignment)
        .where(ShipCrewAssignment.ship_id == ship_id)
        .order_by(ShipCrewAssignment.created_at.desc())
    )
    data = result.scalars().all()
    return TypeAdapter(list[ShipCrewDto]).validate_python(data)


@router.delete("/{ship_id}/crew/{user_id}", summary="Remove user from ship")
async def delete_maintainance_task_route(
    ship_id: str, user_id: str, db=Depends(get_db)
):
    result = await db.execute(
        select(ShipCrewAssignment).where(
            ShipCrewAssignment.id == user_id, ShipCrewAssignment.ship_id == ship_id
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        return {"error": "Crew record not found"}
    await db.delete(record)
    await db.commit()
    return {"message": "deleted successfully"}


class ShipCrewDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    crew_member = None | UserDto


class AddShipCrewDto(BaseModel):
    ship_id: str
    user_id: str
