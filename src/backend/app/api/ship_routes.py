from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter
from sqlalchemy import String, cast, select
from sqlalchemy.orm import selectinload
from app.infra.data.database import get_db
from app.infra.data.models.Ship import MaintainanceTask, Ship
from app.services.paginator import PaginationRequest, PaginationResponse, Paginator
from app.api.tasks_routes import FilterVM, TaskDto
from app.infra.data.models.User import User
from app.api.user_routes import UserDto
from app.schemas.common import ShipDto
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.event_triggers import EventTriggers

router = APIRouter()


@router.get("", summary="Get ships")
async def get_ship_routes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ship).order_by(Ship.created_at.desc()).limit(10))
    data = result.scalars().all()
    return TypeAdapter(list[ShipDto]).validate_python(data)


@router.post("", summary="Create a ship")
async def create_ship_route(req: CreateShipRequest,
                            db: AsyncSession = Depends(get_db)):
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
    id: UUID


@router.get("/{ship_id}", summary="Get ship details")
async def get_ship_details_route(ship_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ship).where(Ship.id == ship_id))
    ship = result.scalar_one_or_none()
    if not ship:
        return {"error": "Ship not found"}
    return TypeAdapter(ShipDto).validate_python(ship)


# maintainance routes
@router.post(
    "/{ship_id}/maintainance-tasks",
    summary="Create a maintainance task for a ship"
)
async def add_task_route(
    ship_id: UUID,
    req: CreateMaintainanceTaskRequest,
    db: AsyncSession = Depends(get_db),
    triggers: EventTriggers = Depends(EventTriggers)
):
    task = MaintainanceTask(
        ship_id=ship_id,
        title=req.title,
        type=req.type,
        due_date=req.dueDate,
        status="scheduled",
        assigned_to_id=req.assignedToId
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    await triggers.on_task_created(task.id)

    return CreateMaintainanceTaskResponse(id=task.id)


@router.get(
    "/{ship_id}/maintainance-tasks", summary="Get maintainance tasks for a ship"
)
async def get_maintainance_tasks_route(ship_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MaintainanceTask)
        .where(MaintainanceTask.ship_id == ship_id)
        .order_by(MaintainanceTask.created_at.desc())
    )
    tasks = result.scalars().all()
    return TypeAdapter(list[MaintainanceTaskDto]).validate_python(tasks)


@router.post("/{ship_id}/tasks-paginated")
async def get_paginated_list(ship_id: UUID, req: PaginationRequest[FilterVM], paginator: Paginator = Depends()):
    query = select(MaintainanceTask)\
        .where(MaintainanceTask.ship_id == ship_id)\
        .options(selectinload(MaintainanceTask.assigned_to))

    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.icontains(req.search))

    if filters and filters.userId:
        query = query.where(MaintainanceTask.assigned_to_id == filters.userId)

    if filters and filters.status:
        query = query.where(MaintainanceTask.status == filters.status)

    paged = await paginator.get_paginated(req, query.order_by(MaintainanceTask.due_date.asc()))
    return paged.to_dto(TaskDto)


@router.delete(
    "/{ship_id}/maintainance-tasks/{task_id}", summary="Delete a maintainance task"
)
async def delete_maintainance_task_route(
    ship_id: str, 
    task_id: str, 
    db: AsyncSession = Depends(get_db),
    triggers: EventTriggers = Depends(EventTriggers)
):
    result = await db.execute(
        select(MaintainanceTask).where(
            MaintainanceTask.id == task_id, MaintainanceTask.ship_id == ship_id
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        return {"error": "Task not found"}
    await db.delete(task)
    await db.commit()

    await triggers.refresh_by_shipid(ship_id)
    return {"message": "Task deleted successfully"}


class CreateMaintainanceTaskRequest(BaseModel):
    title: str
    type: str
    dueDate: datetime | None
    assignedToId: str | None


class MaintainanceTaskDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ship_id: UUID
    title: str
    description: str | None
    type: str
    status: str
    dueDate: datetime | None = Field(
        None, alias="due_date", serialization_alias="dueDate"
    )
    created_at: datetime
    assigned_to_id: UUID | None = Field(
        None, alias="assigned_to_id", serialization_alias="assignedToId"
    )


class CreateMaintainanceTaskResponse(BaseModel):
    id: UUID
