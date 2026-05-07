from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter
from sqlalchemy import select
from app.infra.data.database import get_db
from app.infra.data.models.Ship import MaintainanceTask, Ship

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
    description: str | None


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

# maintainance routes


@router.post("/{ship_id}/maintainance-tasks", summary="Create a maintainance task for a ship")
async def create_maintainance_task_route(ship_id: str, req: CreateMaintainanceTaskRequest, db=Depends(get_db)):
    task = MaintainanceTask(
        ship_id=ship_id,
        title=req.title,
        type=req.type,
        due_date=req.dueDate,
        status="scheduled"
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return CreateMaintainanceTaskResponse(id=task.id)


@router.get("/{ship_id}/maintainance-tasks", summary="Get maintainance tasks for a ship")
async def get_maintainance_tasks_route(ship_id: str, db=Depends(get_db)):
    result = await db.execute(select(MaintainanceTask).where(MaintainanceTask.ship_id == ship_id).order_by(MaintainanceTask.created_at.desc()))
    tasks = result.scalars().all()
    return TypeAdapter(list[MaintainanceTaskDto]).validate_python(tasks)

@router.delete("/{ship_id}/maintainance-tasks/{task_id}", summary="Delete a maintainance task")
async def delete_maintainance_task_route(ship_id: str, task_id: str, db=Depends(get_db)):
    result = await db.execute(select(MaintainanceTask).where(MaintainanceTask.id == task_id, MaintainanceTask.ship_id == ship_id))
    task = result.scalar_one_or_none()
    if not task:
        return {"error": "Task not found"}
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted successfully"}

class CreateMaintainanceTaskRequest(BaseModel):
    title: str
    type: str
    dueDate: datetime | None


class MaintainanceTaskDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ship_id: str
    title: str
    description: str | None
    type: str
    status: str
    dueDate: datetime | None = Field(
        None, alias="due_date", serialization_alias="dueDate")
    created_at: datetime


class CreateMaintainanceTaskResponse(BaseModel):
    id: str

