from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.infra.data.models.Ship import Drill, DrillAssignment, ShipCrewAssignment
from app.infra.data.models.User import User
from app.infra.auth.users import get_current_user
from app.services.paginator import PaginationRequest, PaginationResponse, Paginator
from app.infra.data.database import get_db
from app.schemas.common import DrillDto
from app.api.ship_crew_routes import ShipCrewDto
from app.services.event_triggers import EventTriggers
from app.utils.datetime import utc_now

router = APIRouter()


class DrillAssignmentDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    drill_id: UUID
    drill: DrillDto | None = None
    assigned_at: datetime
    is_attended: bool
    is_completed: bool
    attended_at: datetime | None = None
    remarks: str | None = None
    ship_crew_assignment: Optional[ShipCrewDto] = None


class CreateDrillAssignmentDto(BaseModel):
    crew_id: UUID


class UpdateDrillAssignmentDto(BaseModel):
    is_attended: bool | None = None
    is_completed: bool | None = None
    attended_at: datetime | None = None
    remarks: str | None = None


class MarkMyAttendanceDto(BaseModel):
    remarks: str | None = None


class AssignmentFilterVM(BaseModel):
    is_attended: bool


async def get_my_drill_assignment(
    ship_id: UUID,
    drill_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> DrillAssignment | None:
    return await db.scalar(
        select(DrillAssignment)
        .join(DrillAssignment.drill)
        .join(DrillAssignment.ship_crew_assignment)
        .options(
            joinedload(DrillAssignment.drill).joinedload(Drill.ship),
            joinedload(DrillAssignment.ship_crew_assignment).joinedload(
                ShipCrewAssignment.crew_member
            ),
        )
        .where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id,
                ShipCrewAssignment.crew_member_id == user_id,
                ShipCrewAssignment.is_active == True,
            )
        )
    )


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
    triggers: EventTriggers = Depends(EventTriggers)
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
        raise HTTPException(status_code=404, detail="Drill not found")

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
        .options(
            joinedload(DrillAssignment.ship_crew_assignment)
            .joinedload(ShipCrewAssignment.crew_member)
        )
        .where(and_(*filters))
        .order_by(DrillAssignment.assigned_at.desc())
    )

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)
    return result.to_dto(DrillAssignmentDto)


@router.get(
    "/{ship_id}/drills/{drill_id}/assignments/me",
    summary="Get my drill assignment",
    response_model=DrillAssignmentDto,
)
async def get_my_drill_assignment_route(
    ship_id: UUID,
    drill_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the current user's assignment for a drill."""

    assignment = await get_my_drill_assignment(ship_id, drill_id, user.id, db)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    return DrillAssignmentDto.model_validate(assignment)


@router.put(
    "/{ship_id}/drills/{drill_id}/assignments/me/attendance",
    summary="Mark my drill attendance",
    response_model=DrillAssignmentDto,
)
async def mark_my_drill_attendance_route(
    ship_id: UUID,
    drill_id: UUID,
    payload: MarkMyAttendanceDto,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    triggers: EventTriggers = Depends(EventTriggers),
):
    """Mark attendance for the current user's drill assignment."""

    assignment = await get_my_drill_assignment(ship_id, drill_id, user.id, db)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    assignment.is_attended = True
    assignment.attended_at = assignment.attended_at or utc_now()

    if payload.remarks is not None:
        assignment.remarks = payload.remarks

    await db.commit()
    await db.refresh(assignment)

    await triggers.on_drill_done(drill_id)

    return DrillAssignmentDto.model_validate(assignment)


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
    db: AsyncSession = Depends(get_db),
    triggers: EventTriggers = Depends(EventTriggers)
):
    """Update a drill assignment"""

    # Verify drill exists
    drill_result = await db.scalar(
        select(Drill).where(and_(Drill.id == drill_id, Drill.ship_id == ship_id))
    )

    if not drill_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found"
        )

    assignment = await db.scalar(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.id == assignment_id,
                DrillAssignment.drill_id == drill_id,
            )
        )
    )

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

    await triggers.on_drill_done(drill_id)

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
