from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, and_
from datetime import datetime

from app.infra.data.database import get_db
from app.infra.data.models.Ship import Drill, DrillAssignment
from app.services.paginator import Paginator, PaginationRequest, PaginationResponse

router = APIRouter()


# ==================== DTOs ====================

class DrillDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ship_id: str
    type: str
    title: str | None
    scheduled_at: str
    started_at: str | None
    completed_at: str | None
    status: str
    notes: str | None
    created_by: str | None
    created_at: str


class CreateDrillDto(BaseModel):
    type: str
    title: str | None = None
    scheduled_at: str
    notes: str | None = None


class UpdateDrillDto(BaseModel):
    title: str | None = None
    scheduled_at: str | None = None
    status: str | None = None
    started_at: str | None = None
    completed_at: str | None = None
    notes: str | None = None


class DrillAssignmentDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    drill_id: str
    ship_crew_assignment_id: str
    assigned_at: str
    is_attended: bool
    is_completed: bool
    attended_at: str | None
    remarks: str | None


class CreateDrillAssignmentDto(BaseModel):
    ship_crew_assignment_id: str


class UpdateDrillAssignmentDto(BaseModel):
    is_attended: bool | None = None
    is_completed: bool | None = None
    attended_at: str | None = None
    remarks: str | None = None


# ==================== DRILL ENDPOINTS ====================

@router.post("/{ship_id}/drills", summary="Create a drill", response_model=DrillDto)
async def create_drill_route(
    ship_id: str,
    payload: CreateDrillDto,
    db=Depends(get_db)
):
    """Create a new drill for a ship"""
    
    drill = Drill(
        ship_id=ship_id,
        type=payload.type,
        title=payload.title,
        scheduled_at=datetime.fromisoformat(payload.scheduled_at),
        status="scheduled",
        notes=payload.notes
    )
    
    db.add(drill)
    await db.commit()
    await db.refresh(drill)
    
    return DrillDto.model_validate(drill)


@router.get("/{ship_id}/drills", summary="Get drills with pagination", response_model=PaginationResponse[DrillDto])
async def get_drills_route(
    ship_id: str,
    page: int = 1,
    pageSize: int = 10,
    status: str | None = None,
    drill_type: str | None = None,
    db=Depends(get_db)
):
    """Get paginated list of drills for a ship"""
    
    filters = [Drill.ship_id == ship_id]
    
    if status:
        filters.append(Drill.status == status)
    
    if drill_type:
        filters.append(Drill.type == drill_type)
    
    query = select(Drill).where(and_(*filters)).order_by(Drill.scheduled_at.desc())
    
    paginator = Paginator(db)
    result = await paginator.get_paginated(
        PaginationRequest(page=page, pageSize=pageSize),
        query
    )
    
    return result.to_dto(DrillDto)


@router.get("/{ship_id}/drills/{drill_id}", summary="Get specific drill", response_model=DrillDto)
async def get_drill_route(
    ship_id: str,
    drill_id: str,
    db=Depends(get_db)
):
    """Get a specific drill by ID"""
    
    result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    drill = result.scalar_one_or_none()
    
    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    return DrillDto.model_validate(drill)


@router.put("/{ship_id}/drills/{drill_id}", summary="Update drill", response_model=DrillDto)
async def update_drill_route(
    ship_id: str,
    drill_id: str,
    payload: UpdateDrillDto,
    db=Depends(get_db)
):
    """Update a drill"""
    
    result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    drill = result.scalar_one_or_none()
    
    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
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


@router.delete("/{ship_id}/drills/{drill_id}", summary="Delete drill", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drill_route(
    ship_id: str,
    drill_id: str,
    db=Depends(get_db)
):
    """Delete a drill"""
    
    result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    drill = result.scalar_one_or_none()
    
    if not drill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    await db.delete(drill)
    await db.commit()


# ==================== DRILL ASSIGNMENT ENDPOINTS ====================

@router.post("/{ship_id}/drills/{drill_id}/assignments", summary="Assign crew to drill", response_model=DrillAssignmentDto)
async def create_drill_assignment_route(
    ship_id: str,
    drill_id: str,
    payload: CreateDrillAssignmentDto,
    db=Depends(get_db)
):
    """Assign a crew member to a drill"""
    
    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    # Check if assignment already exists
    existing = await db.execute(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.drill_id == drill_id,
                DrillAssignment.ship_crew_assignment_id == payload.ship_crew_assignment_id
            )
        )
    )
    
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Crew member is already assigned to this drill"
        )
    
    assignment = DrillAssignment(
        drill_id=drill_id,
        ship_crew_assignment_id=payload.ship_crew_assignment_id,
        is_attended=False,
        is_completed=False
    )
    
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    
    return DrillAssignmentDto.model_validate(assignment)


@router.get("/{ship_id}/drills/{drill_id}/assignments", summary="Get drill assignments with pagination", response_model=PaginationResponse[DrillAssignmentDto])
async def get_drill_assignments_route(
    ship_id: str,
    drill_id: str,
    page: int = 1,
    pageSize: int = 10,
    is_attended: bool | None = None,
    db=Depends(get_db)
):
    """Get paginated list of crew assignments for a drill"""
    
    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    filters = [DrillAssignment.drill_id == drill_id]
    
    if is_attended is not None:
        filters.append(DrillAssignment.is_attended == is_attended)
    
    query = select(DrillAssignment).where(and_(*filters)).order_by(DrillAssignment.assigned_at.desc())
    
    paginator = Paginator(db)
    result = await paginator.get_paginated(
        PaginationRequest(page=page, pageSize=pageSize),
        query
    )
    
    return result.to_dto(DrillAssignmentDto)


@router.put("/{ship_id}/drills/{drill_id}/assignments/{assignment_id}", summary="Update drill assignment", response_model=DrillAssignmentDto)
async def update_drill_assignment_route(
    ship_id: str,
    drill_id: str,
    assignment_id: str,
    payload: UpdateDrillAssignmentDto,
    db=Depends(get_db)
):
    """Update a drill assignment"""
    
    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    result = await db.execute(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.id == assignment_id,
                DrillAssignment.drill_id == drill_id
            )
        )
    )
    
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if payload.is_attended is not None:
        assignment.is_attended = payload.is_attended
    
    if payload.is_completed is not None:
        assignment.is_completed = payload.is_completed
    
    if payload.attended_at is not None:
        assignment.attended_at = datetime.fromisoformat(payload.attended_at)
    
    if payload.remarks is not None:
        assignment.remarks = payload.remarks
    
    await db.commit()
    await db.refresh(assignment)
    
    return DrillAssignmentDto.model_validate(assignment)


@router.delete("/{ship_id}/drills/{drill_id}/assignments/{assignment_id}", summary="Remove crew from drill", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drill_assignment_route(
    ship_id: str,
    drill_id: str,
    assignment_id: str,
    db=Depends(get_db)
):
    """Remove a crew member from a drill"""
    
    # Verify drill exists
    drill_result = await db.execute(
        select(Drill).where(
            and_(
                Drill.id == drill_id,
                Drill.ship_id == ship_id
            )
        )
    )
    
    if not drill_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drill not found"
        )
    
    result = await db.execute(
        select(DrillAssignment).where(
            and_(
                DrillAssignment.id == assignment_id,
                DrillAssignment.drill_id == drill_id
            )
        )
    )
    
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    await db.delete(assignment)
    await db.commit()
