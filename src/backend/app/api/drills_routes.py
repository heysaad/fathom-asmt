from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, and_
from sqlalchemy.orm import contains_eager, joinedload
from datetime import datetime, timezone

from app.infra.data.database import get_db
from app.infra.data.models.Ship import Drill, DrillAssignment, ShipCrewAssignment
from app.services.paginator import Paginator, PaginationRequest, PaginationResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.user_routes import UserDto
from app.infra.data.models.User import User
from app.infra.auth.role_checker import RoleChecker
from app.infra.auth.users import get_current_user
from app.schemas.common import DrillDto, ShipDto
from app.api.ship_drill_assignment_routes import DrillAssignmentDto
from app.services.event_triggers import EventTriggers

router = APIRouter()


def to_db_datetime(value: datetime | None):
    if value and value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


# ==================== DTOs ====================


class CreateDrillDto(BaseModel):
    type: str
    title: str | None = None
    scheduled_at: datetime
    notes: str | None = None


class UpdateDrillDto(BaseModel):
    ship_id: UUID
    title: str | None = None
    scheduled_at: datetime | None = None
    status: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    notes: str | None = None


class FilterVM(BaseModel):
    shipId: UUID | None = None
    status: str | None = None
    drill_type: str | None = None
    dateFrom: datetime | None = None
    dateTo: datetime | None = None


# ==================== DRILL ENDPOINTS ====================


@router.post("/ships/{ship_id}/drills", summary="Create a drill", response_model=DrillDto)
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
    "/drills/paginated",
    summary="Get all drills with pagination",
    response_model=PaginationResponse[DrillDto],
)
async def get_paginated_drills_route(
    req: PaginationRequest[FilterVM],
    db=Depends(get_db),
    user: User = Depends(RoleChecker(["admin"])),
):
    filters = []

    if req.filters and req.filters.shipId:
        filters.append(Drill.ship_id == req.filters.shipId)

    if req.filters and req.filters.status:
        if req.filters.status == "missed":
            filters.append(Drill.status == "scheduled")
            filters.append(Drill.scheduled_at < datetime.utcnow())
        else:
            filters.append(Drill.status == req.filters.status)

    if req.filters and req.filters.drill_type:
        filters.append(Drill.type == req.filters.drill_type)

    if req.filters and req.filters.dateFrom:
        filters.append(Drill.scheduled_at >=
                       to_db_datetime(req.filters.dateFrom))

    if req.filters and req.filters.dateTo:
        filters.append(Drill.scheduled_at <=
                       to_db_datetime(req.filters.dateTo))

    query = select(Drill).options(joinedload(Drill.ship))

    if filters:
        query = query.where(and_(*filters))

    if req.search:
        query = query.where(Drill.title.icontains(req.search))

    query = query.order_by(Drill.scheduled_at.desc())

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    return result.to_dto(DrillDto)


@router.post(
    "/drills/my-drills",
    summary="Get drills with pagination",
    response_model=PaginationResponse[DrillAssignmentDto],
)
async def get_my_drills_route(
    req: PaginationRequest[FilterVM], db=Depends(get_db), user: User = Depends(get_current_user)
):
    """Get paginated list of drills for a ship"""

    filters = []

    if req.filters and req.filters.status:
        filters.append(Drill.status == req.filters.status)

    if req.filters and req.filters.drill_type:
        filters.append(Drill.type == req.filters.drill_type)

    if req.filters and req.filters.dateFrom:
        filters.append(Drill.scheduled_at >=
                       to_db_datetime(req.filters.dateFrom))

    if req.filters and req.filters.dateTo:
        filters.append(Drill.scheduled_at <=
                       to_db_datetime(req.filters.dateTo))

    query = select(DrillAssignment)\
        .join(DrillAssignment.drill)\
        .options(
            contains_eager(DrillAssignment.drill)
            .joinedload(Drill.ship)
    )\
        .where(
            DrillAssignment.ship_crew_assignment.has(
                user.id == ShipCrewAssignment.crew_member_id))\
        .where(and_(*filters)).order_by(Drill.scheduled_at.desc())

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    return result.to_dto(DrillAssignmentDto)


@router.post(
    "/ships/{ship_id}/drills/list",
    summary="Get drills with pagination",
    response_model=PaginationResponse[DrillDto],
)
async def get_my_drills_route(
    ship_id: UUID, req: PaginationRequest[FilterVM], db=Depends(get_db)
):
    """Get paginated list of drills for a ship"""

    filters = [Drill.ship_id == ship_id]

    if req.filters and req.filters.status:
        filters.append(Drill.status == req.filters.status)

    if req.filters and req.filters.drill_type:
        filters.append(Drill.type == req.filters.drill_type)

    if req.filters and req.filters.dateFrom:
        filters.append(Drill.scheduled_at >=
                       to_db_datetime(req.filters.dateFrom))

    if req.filters and req.filters.dateTo:
        filters.append(Drill.scheduled_at <=
                       to_db_datetime(req.filters.dateTo))

    query = select(Drill).where(
        and_(*filters)).order_by(Drill.scheduled_at.desc())

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


@router.put("/drills/{drill_id}", summary="Update drill", response_model=DrillDto)
async def update_drill_route(
    drill_id: str, payload: UpdateDrillDto,
    db: AsyncSession = Depends(get_db),
    triggers: EventTriggers = Depends(EventTriggers)
):
    """Update a drill"""

    drill = await db.scalar(
        select(Drill).where(
            and_(Drill.id == drill_id, Drill.ship_id == payload.ship_id))
    )

    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    if payload.title is not None:
        drill.title = payload.title

    if payload.scheduled_at is not None:
        drill.scheduled_at = payload.scheduled_at

    completed = False
    if payload.status is not None and payload.status != drill.status:
        drill.status = payload.status
        completed = drill.status == "completed"
        if completed:
            drill.completed_at = datetime.utcnow()

    if payload.started_at is not None:
        drill.started_at = payload.started_at

    if payload.completed_at is not None:
        drill.completed_at = payload.completed_at

    if payload.notes is not None:
        drill.notes = payload.notes

    await db.commit()
    await db.refresh(drill)

    if completed:
        await triggers.on_drill_done(drill_id)

    return DrillDto.model_validate(drill)


@router.delete(
    "/ships/{ship_id}/drills/{drill_id}",
    summary="Delete drill",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_drill_route(
        ship_id: str,
        drill_id: str,
        db: AsyncSession = Depends(get_db),
        triggers: EventTriggers = Depends(EventTriggers)):
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

    await triggers.on_drill_done(drill_id)
