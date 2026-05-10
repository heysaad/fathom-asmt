from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from operator import contains, iand
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, TypeAdapter
from sqlalchemy import or_, select, and_
from sqlalchemy.orm import contains_eager, selectinload

from app.infra.data.database import get_db
from app.infra.data.models.Ship import ShipCrewAssignment
from app.api.user_routes import UserDto
from app.services.paginator import Paginator, PaginationRequest, PaginationResponse
from app.infra.data.models.User import User

router = APIRouter()


# ==================== DTOs ====================


class ShipCrewDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ship_id: UUID
    crew_member_id: UUID
    crew_member: Optional[UserDto] = None
    is_active: bool | None = None
    created_at: datetime | None = None
    drills_total: int | None = None
    drills_attended: int | None = None
    tasks_completed: int | None = None
    compliance_score: int | None = None


class ShipCrewDetailDto(ShipCrewDto):
    crew_member: Optional[UserDto] = None


class AddShipCrewDto(BaseModel):
    crew_member_id: UUID


class UpdateShipCrewDto(BaseModel):
    is_active: bool | None = None


class FilterVM(BaseModel):
    is_active: bool | None = None


# ==================== CREATE Endpoints ====================


@router.post(
    "/{ship_id}/crew",
    summary="Add crew member to ship",
    response_model=ShipCrewDetailDto,
)
async def add_crew_to_ship_route(
    ship_id: UUID, payload: AddShipCrewDto, db=Depends(get_db)
):
    """Add a new crew member to a ship"""

    # Check if assignment already exists
    existing = await db.execute(
        select(ShipCrewAssignment).where(
            and_(
                ShipCrewAssignment.ship_id == ship_id,
                ShipCrewAssignment.crew_member_id == payload.crew_member_id,
                ShipCrewAssignment.is_active == True
            )
        )
    )

    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Crew member is already assigned to this ship",
        )

    assignment = ShipCrewAssignment(
        ship_id=ship_id, crew_member_id=payload.crew_member_id, is_active=True
    )

    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return ShipCrewDetailDto.model_validate(assignment)


# ==================== READ Endpoints ====================


@router.post(
    "/{ship_id}/crew/list",
    summary="Get all assigned crew members with pagination",
    response_model=PaginationResponse[ShipCrewDto],
)
async def get_ship_crew_list_route(
    ship_id: UUID, req: PaginationRequest[FilterVM], db=Depends(get_db)
):
    """Get paginated list of crew members assigned to a ship"""

    filters = [ShipCrewAssignment.ship_id == ship_id]

    if req.filters and req.filters.is_active is not None:
        filters.append(ShipCrewAssignment.is_active == req.filters.is_active)
    else:
        filters.append(ShipCrewAssignment.is_active == True)

    if req.search:
        filters.append(or_(
            User.name.icontains(req.search),
            User.designation.icontains(req.search),
            User.email.icontains(req.search)
        ))

    query = (
        select(ShipCrewAssignment)
        .join(ShipCrewAssignment.crew_member)
        .options(contains_eager(ShipCrewAssignment.crew_member))
        .where(and_(*filters))
        .order_by(ShipCrewAssignment.created_at.desc())
    )

    paginator = Paginator(db)
    result = await paginator.get_paginated(req, query)

    return result.to_dto(ShipCrewDto)


@router.get(
    "/{ship_id}/crew/{assignment_id}",
    summary="Get specific crew assignment",
    response_model=ShipCrewDetailDto,
)
async def get_crew_assignment_route(
    ship_id: UUID, assignment_id: UUID, db=Depends(get_db)
):
    """Get a specific crew assignment by ID"""

    result = await db.execute(
        select(ShipCrewAssignment).where(
            and_(
                ShipCrewAssignment.id == assignment_id,
                ShipCrewAssignment.ship_id == ship_id,
            )
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Crew assignment not found"
        )

    return ShipCrewDetailDto.model_validate(assignment)


# ==================== UPDATE Endpoints ====================


@router.put(
    "/{ship_id}/crew/{assignment_id}",
    summary="Update crew assignment",
    response_model=ShipCrewDetailDto,
)
async def update_crew_assignment_route(
    ship_id: str, assignment_id: str, payload: UpdateShipCrewDto, db: AsyncSession = Depends(get_db)
):
    """Update a crew assignment (e.g., activate/deactivate)"""

    result = await db.execute(
        select(ShipCrewAssignment).where(
            and_(
                ShipCrewAssignment.id == assignment_id,
                ShipCrewAssignment.ship_id == ship_id,
            )
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Crew assignment not found"
        )

    if payload.is_active is not None:
        assignment.is_active = payload.is_active

    await db.commit()
    await db.refresh(assignment)

    return ShipCrewDetailDto.model_validate(assignment)


# ==================== DELETE Endpoints ====================


@router.delete(
    "/{ship_id}/crew/{assignment_id}",
    summary="Remove crew member from ship",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_crew_from_ship_route(
    ship_id: str, assignment_id: str, db=Depends(get_db)
):
    """Remove a crew member from a ship"""

    result = await db.execute(
        select(ShipCrewAssignment).where(
            and_(
                ShipCrewAssignment.id == assignment_id,
                ShipCrewAssignment.ship_id == ship_id,
            )
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Crew assignment not found"
        )

    await db.delete(assignment)
    await db.commit()
