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


class DrillAssignmentDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    drill_id: UUID
    assigned_at: datetime
    is_attended: bool
    is_completed: bool
    attended_at: datetime | None
    remarks: str | None
    crew_member: Optional[UserDto] = None


class CreateDrillAssignmentDto(BaseModel):
    crew_id: UUID


class UpdateDrillAssignmentDto(BaseModel):
    is_attended: bool | None = None
    is_completed: bool | None = None
    attended_at: datetime | None = None
    remarks: str | None = None


class FilterVM(BaseModel):
    status: str | None = None
    drill_type: str | None = None


class AssignmentFilterVM(BaseModel):
    is_attended: bool


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
    "/{ship_id}/drills/list",
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
    "/{ship_id}/drills/{drill_id}",
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
    "/{ship_id}/drills/{drill_id}", summary="Update drill", response_model=DrillDto
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
    "/{ship_id}/drills/{drill_id}",
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


# ==================== DRILL ASSIGNMENT ENDPOINTS ====================


@router.post(
    "/{ship_id}/drills/{drill_id}/assignments",
    summary="Assign crew to drill",
    response_model=DrillAssignmentDto,
)
async def create_drill_assignment_route(
    ship_id: UUID,
    drill_id: UUID,
    payload: CreateDrillAssignmentDto,
    db: AsyncSession = Depends(get_db),
):
    """Assign a crew member to a drill"""

    assignment_query = await db.execute(
        select(ShipCrewAssignment).where(
            ShipCrewAssignment.crew_member_id == payload.crew_id,
            ShipCrewAssignment.ship_id == ship_id,
            ShipCrewAssignment.is_active == True,
        )
    )
    crew_assignment_id = assignment_query.scalar_one_or_none().id

    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    # Check if assignment already exists
    existing = await db.execute(
        select(DrillAssignment)
        .join(
            ShipCrewAssignment,
            ShipCrewAssignment.id == DrillAssignment.ship_crew_assignment_id
            and ShipCrewAssignment.is_active == True,
        )
        .where(
            and_(
                DrillAssignment.drill_id == drill_id,
                ShipCrewAssignment.crew_member_id == payload.crew_id,
            )
        )
    )

    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Crew member is already assigned to this drill",
        )

    assignment = DrillAssignment(
        drill_id=drill_id,
        ship_crew_assignment_id=crew_assignment_id,
        is_attended=False,
        is_completed=False,
    )

    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return DrillAssignmentDto.model_validate(assignment)


@router.post(
    "/{ship_id}/drills/{drill_id}/assignments/list",
    summary="Get drill assignments with pagination",
    response_model=PaginationResponse[DrillAssignmentDto],
)
async def get_drill_assignments_route(
    ship_id: str,
    drill_id: str,
    req: PaginationRequest[AssignmentFilterVM],
    db=Depends(get_db),
):
    """Get paginated list of crew assignments for a drill"""

    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    filters = [DrillAssignment.drill_id == drill_id]

    if req.filters and req.filters.is_attended is not None:
        filters.append(DrillAssignment.is_attended == req.filters.is_attended)

    query = (
        select(DrillAssignment)
        .join(ShipCrewAssignment)
        .options(contains_eager(DrillAssignment.ship_crew_assignment))
        .where(and_(*filters))
        .order_by(DrillAssignment.assigned_at.desc())
    )

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    for x in result.data:
        x.crew_member = x.ship_crew_assignment.crew_member

    return result.to_dto(DrillAssignmentDto)


@router.put(
    "/{ship_id}/drills/{drill_id}/assignments/{assignment_id}",
    summary="Update drill assignment",
    response_model=DrillAssignmentDto,
)
async def update_drill_assignment_route(
    ship_id: str,
    drill_id: str,
    assignment_id: str,
    payload: UpdateDrillAssignmentDto,
    db=Depends(get_db),
):
    """Update a drill assignment"""

    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    result = await db.execute(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.id == assignment_id,
                DrillAssignment.drill_id == drill_id,
            )
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    if payload.is_attended is not None:
        assignment.is_attended = payload.is_attended

    if payload.is_completed is not None:
        assignment.is_completed = payload.is_completed

    if payload.attended_at is not None:
        assignment.attended_at = payload.attended_at

    if payload.remarks is not None:
        assignment.remarks = payload.remarks

    await db.commit()
    await db.refresh(assignment)

    return DrillAssignmentDto.model_validate(assignment)


@router.delete(
    "/{ship_id}/drills/{drill_id}/assignments/{assignment_id}",
    summary="Remove crew from drill",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_drill_assignment_route(
    ship_id: str, drill_id: str, assignment_id: str, db=Depends(get_db)
):
    """Remove a crew member from a drill"""

    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    result = await db.execute(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.id == assignment_id,
                DrillAssignment.drill_id == drill_id,
            )
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    await db.delete(assignment)
    await db.commit()
