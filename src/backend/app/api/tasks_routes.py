from datetime import datetime

from fastapi import Depends, FastAPI, APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.infra.data.models.Ship import MaintainanceTask, Ship
from app.services.paginator import PaginationRequest, Paginator
from app.infra.auth.users import get_current_user
from app.infra.data.models.User import User
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.data.database import get_db
from app.api.user_routes import UserDto

router = APIRouter()


@router.post("/paginated")
async def get_paginated_list(req: PaginationRequest[FilterVM], paginator: Paginator = Depends()):
    query = select(MaintainanceTask)
    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.icontains(req.search))

    if filters and filters.userId:
        query = query.where(MaintainanceTask.assigned_to_id == filters.userId)

    if filters and filters.status:
        query = query.where(MaintainanceTask.status == filters.status)

    paged = await paginator.get_paginated(req, query.order_by(MaintainanceTask.created_at.desc()))
    for x in paged.data:
        x.ship
    return paged.to_dto(TaskDto)


@router.post("/me/paginated")
async def get_my_tasks(req: PaginationRequest[FilterVM], paginator: Paginator = Depends(), user: User = Depends(get_current_user)):
    query = select(MaintainanceTask, Ship) \
        .join(Ship, MaintainanceTask.ship_id == Ship.id)
    query = query.where(MaintainanceTask.assigned_to_id == str(user.id))

    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.icontains(req.search))

    if filters and filters.status:
        query = query.where(MaintainanceTask.status == filters.status)

    paged = await paginator.get_paginated(req, query.order_by(MaintainanceTask.created_at.desc()))
    return paged.to_dto(TaskDto)

@router.post("/update-by-crew")
async def update_by_crew(req: UpdateCrewTaskRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task_query = await db.execute(select(MaintainanceTask).where(MaintainanceTask.id == req.id))
    task = task_query.scalar_one()
    if user.role != "admin" and task.assigned_to_id == user.id:
        raise HTTPException(status_code=403, detail="You don't have rights to update")
    
    task.status = req.status
    task.description = req.description
    await db.commit()
    return { "message": "updated" }

class FilterVM(BaseModel):
    userId: str | None = None
    status: str | None = None


class TaskDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ship_id: str
    #ship: ShipDto | None = None
    title: str
    description: str | None = None
    status: str | None = None
    type: str
    dueDate: datetime | None = Field(
        alias="due_date", serialization_alias="dueDate")
    assignedToId: str | None = Field(
        alias="assigned_to_id", serialization_alias="assignedToId")
    assignedTo: UserDto | None = None

class UpdateCrewTaskRequest(BaseModel):
    id: str
    status: str
    description: str

class ShipDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    type: str | None = None
    imo: str | None = None
    description: str | None = None