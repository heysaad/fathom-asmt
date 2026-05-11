from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import Depends, FastAPI, APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.infra.data.models.Ship import MaintainanceTask, Ship
from app.services.paginator import PaginationRequest, Paginator
from app.infra.auth.users import get_current_user
from app.infra.auth.role_checker import RoleChecker
from app.infra.data.models.User import User
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.data.database import get_db
from app.schemas.common import ShipDto, UserDto
from app.services.event_triggers import EventTriggers

router = APIRouter()


def to_db_datetime(value: datetime | None):
    if value and value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


@router.post("/paginated")
async def get_paginated_list(
    req: PaginationRequest[FilterVM],
    paginator: Paginator = Depends(),
    user: User = Depends(RoleChecker(["admin"])),
):
    query = select(MaintainanceTask).options(
        joinedload(MaintainanceTask.ship),
        joinedload(MaintainanceTask.assigned_to),
    )
    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.icontains(req.search))

    if filters and filters.userId:
        query = query.where(MaintainanceTask.assigned_to_id == filters.userId)

    if filters and filters.status:
        if filters.status == "missed":
            query = query.where(MaintainanceTask.status != "completed",
                                MaintainanceTask.due_date < datetime.utcnow())
        else:
            query = query.where(MaintainanceTask.status == filters.status)

    if filters and filters.dateFrom:
        query = query.where(
            MaintainanceTask.due_date >= to_db_datetime(filters.dateFrom))

    if filters and filters.dateTo:
        query = query.where(
            MaintainanceTask.due_date <= to_db_datetime(filters.dateTo))

    paged = await paginator.get_paginated(
        req, query.order_by(MaintainanceTask.created_at.desc())
    )

    return paged.to_dto(TaskDto)


@router.post("/my-tasks")
async def get_my_tasks(
    req: PaginationRequest[FilterVM],
    paginator: Paginator = Depends(),
    user: User = Depends(get_current_user),
):
    query = select(MaintainanceTask)\
        .options(joinedload(MaintainanceTask.ship))
    query = query.where(MaintainanceTask.assigned_to_id == str(user.id))

    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.icontains(req.search))

    if filters and filters.status:
        query = query.where(MaintainanceTask.status == filters.status)

    if filters and filters.dateFrom:
        query = query.where(
            MaintainanceTask.due_date >= to_db_datetime(filters.dateFrom))

    if filters and filters.dateTo:
        query = query.where(
            MaintainanceTask.due_date <= to_db_datetime(filters.dateTo))

    paged = await paginator.get_paginated(
        req, query.order_by(MaintainanceTask.created_at.desc())
    )
    return paged.to_dto(TaskDto)


@router.post("/update-by-crew")
async def update_by_crew(
    req: UpdateCrewTaskRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    triggers: EventTriggers = Depends(EventTriggers)
):
    task = await db.scalar(
        select(MaintainanceTask).where(MaintainanceTask.id == req.id)
    )

    if user.role != "admin" and task.assigned_to_id == user.id:
        raise HTTPException(
            status_code=403, detail="You don't have rights to update")

    if req.status == "completed" and task.status != req.status:
        task.completed_on = datetime.utcnow()

    task.status = req.status

    if req.description is not None:
        task.description = req.description

    await db.commit()
    await db.refresh(task)

    await triggers.on_task_done(task.id)
    return {"message": "updated"}


class FilterVM(BaseModel):
    userId: UUID | None = None
    status: str | None = None
    dateFrom: datetime | None = None
    dateTo: datetime | None = None


class TaskDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ship_id: UUID
    # ship: ShipDto | None = None
    title: str
    description: str | None = None
    status: str | None = None
    type: str
    dueDate: datetime | None = Field(
        alias="due_date", serialization_alias="dueDate")
    assignedToId: UUID | None = Field(None,
                                      alias="assigned_to_id", serialization_alias="assignedToId"
                                      )
    ship: Optional[ShipDto] = None
    assignedTo: Optional[UserDto] = Field(
        None, alias="assigned_to", serialization_alias="assignedTo")


class UpdateCrewTaskRequest(BaseModel):
    id: UUID
    status: str
    description: str | None = None
