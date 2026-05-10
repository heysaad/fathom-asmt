from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, and_
from sqlalchemy.orm import contains_eager
from datetime import datetime

from app.infra.data.database import get_db
from app.infra.data.models.Ship import Drill, DrillAssignment, ShipCrewAssignment
from app.services.paginator import Paginator, PaginationRequest, PaginationResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.user_routes import UserDto
from app.infra.data.models.User import User

router = APIRouter()


# ==================== DTOs ====================


class DrillDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ship_id: UUID
    type: str
    title: str | None
    scheduled_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    status: str
    notes: str | None
    created_by: str | None
    created_at: datetime


class CreateDrillDto(BaseModel):
    type: str
    title: str | None = None
    scheduled_at: datetime
    notes: str | None = None


class UpdateDrillDto(BaseModel):
    title: str | None = None
    scheduled_at: datetime | None = None
    status: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    notes: str | None = None



class FilterVM(BaseModel):
    status: str | None = None
    drill_type: str | None = None



# ==================== DRILL ENDPOINTS ====================


@router.post("/{ship_id}/drills", summary="Create a drill", response_model=DrillDto)
async def create_drill_route(ship_id: str, payload: CreateDrillDto, db=Depends(get_db)):
    """Create a new drill for a ship"""

    drill = Drill(
        ship_id=ship_id,
        type=payload.type,
        title=payload.title,
        scheduled_at=payload.scheduled_at,
        status="scheduled",
        notes=payload.notes,
    )

    db.add(drill)
    await db.commit()
    await db.refresh(drill)

    return DrillDto.model_validate(drill)


@router.post(
    "/drills/list",
    summary="Get drills with pagination",
    response_model=PaginationResponse[DrillDto],
)
async def get_drills_route(
    req: PaginationRequest[FilterVM], db=Depends(get_db)
):
    """Get paginated list of drills for a ship"""

    filters = []

    if req.filters and req.filters.status:
        filters.append(Drill.status == req.filters.status)

    if req.filters and req.filters.drill_type:
        filters.append(Drill.type == req.filters.drill_type)

    query = select(Drill).where(and_(*filters)).order_by(Drill.scheduled_at.desc())

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    return result.to_dto(DrillDto)

@router.post(
    "/ships/{ship_id}/drills/list",
    summary="Get drills with pagination",
    response_model=PaginationResponse[DrillDto],
)
async def get_drills_route(
    ship_id: UUID, req: PaginationRequest[FilterVM], db=Depends(get_db)
):
    """Get paginated list of drills for a ship"""

    filters = [Drill.ship_id == ship_id]

    if req.filters and req.filters.status:
        filters.append(Drill.status == req.filters.status)

    if req.filters and req.filters.drill_type:
        filters.append(Drill.type == req.filters.drill_type)

    query = select(Drill).where(and_(*filters)).order_by(Drill.scheduled_at.desc())

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    return result.to_dto(DrillDto)


@router.get(
    "/ships/{ship_id}/drills/{drill_id}",
    summary="Get specific drill",
    response_model=DrillDto,
)
async def get_drill_route(ship_id: str, drill_id: str, db=Depends(get_db)):
    """Get a specific drill by ID"""

    result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    return DrillDto.model_validate(drill)


@router.put(
    "/ships/{ship_id}/drills/{drill_id}", summary="Update drill", response_model=DrillDto
)
async def update_drill_route(
    ship_id: str, drill_id: str, payload: UpdateDrillDto, db=Depends(get_db)
):
    """Update a drill"""

    result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    if payload.title is not None:
        drill.title = payload.title

    if payload.scheduled_at is not None:
        drill.scheduled_at = datetime.fromisoformat(payload.scheduled_at)

    if payload.status is not None:
        drill.status = payload.status

    if payload.started_at is not None:
        drill.started_at = datetime.fromisoformat(payload.started_at)

    if payload.completed_at is not None:
        drill.completed_at = datetime.fromisoformat(payload.completed_at)

    if payload.notes is not None:
        drill.notes = payload.notes

    await db.commit()
    await db.refresh(drill)

    return DrillDto.model_validate(drill)


@router.delete(
    "/ships/{ship_id}/drills/{drill_id}",
    summary="Delete drill",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_drill_route(ship_id: str, drill_id: str, db=Depends(get_db)):
    """Delete a drill"""

    result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    drill = result.scalar_one_or_none()

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    await db.delete(drill)
    await db.commit()
