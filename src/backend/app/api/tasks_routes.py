from datetime import datetime

from fastapi import Depends, FastAPI, APIRouter
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.infra.data.models.Ship import MaintainanceTask
from app.services.paginator import PaginationRequest, Paginator

router = APIRouter()

@router.post("/paginated")
async def get_paginated_list(req: PaginationRequest[FilterVM], paginator: Paginator = Depends()):
    query = select(MaintainanceTask)
    filters = req.filters
    if req.search:
        query = query.where(MaintainanceTask.title.contains(req.search))

    if filters and filters.userId:
        query = query.where(MaintainanceTask.assigned_to_id == filters.userId)

    if filters and filters.status:
        query = query.where(MaintainanceTask.status == filters.status)

    paged = await paginator.get_paginated(req, query.order_by(MaintainanceTask.created_at.desc()))
    return paged.to_dto(TaskDto)

class FilterVM(BaseModel):
    userId: str | None
    status: str | None

class TaskDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    ship_id: str
    title: str
    description: str | None
    type: str
    dueDate: datetime | None = Field(alias="due_date", serialization_alias="dueDate")
    assignedToId: str | None = Field(alias="assigned_to_id", serialization_alias="assignedToId")