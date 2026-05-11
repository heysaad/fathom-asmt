from datetime import UTC, datetime
from typing import Literal
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic import TypeAdapter
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.infra.auth.role_checker import RoleChecker
from app.infra.auth.users import UserManager, get_user_manager
from app.infra.data.database import get_db
from app.infra.data.models.Ship import Drill, MaintainanceTask, ShipCrewAssignment
from app.infra.data.models.User import User
from app.schemas.common import ShipDto, UserDto
from app.schemas.schemas import UserCreate, UserUpdate

router = APIRouter()

admin_only = [Depends(RoleChecker(["admin"]))]


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    designation: str | None = None
    role: Literal["admin", "crew"] = "crew"


class UserUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    designation: str | None = None
    role: Literal["admin", "crew"] | None = None


class UserActivitySummaryDto(BaseModel):
    assigned_ships: int = 0
    active_ship_assignments: int = 0
    scheduled_tasks: int = 0
    in_progress_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    drills_created: int = 0


class UserShipAssignmentDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ship_id: uuid.UUID
    ship: ShipDto | None = None
    is_active: bool | None = None
    created_at: datetime | None = None
    drills_total: int | None = None
    drills_attended: int | None = None
    tasks_total: int | None = None
    tasks_completed: int | None = None
    compliance_score: int | None = None


class UserDetailsDto(UserDto):
    created_at: datetime | None = None
    summary: UserActivitySummaryDto
    ship_assignments: list[UserShipAssignmentDto] = Field(default_factory=list)


@router.get("", summary="Get users", dependencies=admin_only)
async def list_users_route(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.email))
    users = result.scalars().all()
    return TypeAdapter(list[UserDto]).validate_python(users)


@router.post("", summary="Create a user", dependencies=admin_only)
async def create_user_route(
    req: UserCreateRequest,
    user_manager: UserManager = Depends(get_user_manager),
):
    user_create = UserCreate(
        email=req.email,
        password="admin123",
        name=req.name,
        designation=req.designation,
        role=req.role,
    )
    created_user = await user_manager.create(user_create, safe=False)
    return TypeAdapter(UserDto).validate_python(created_user)


@router.get("/{user_id}", summary="Get user details", dependencies=admin_only)
async def get_user_route(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    assignments_result = await db.execute(
        select(ShipCrewAssignment)
        .options(joinedload(ShipCrewAssignment.ship))
        .where(ShipCrewAssignment.crew_member_id == user.id)
        .order_by(ShipCrewAssignment.created_at.desc())
    )
    assignments = assignments_result.scalars().all()

    task_counts_result = await db.execute(
        select(MaintainanceTask.status, func.count(MaintainanceTask.id))
        .where(MaintainanceTask.assigned_to_id == user.id)
        .group_by(MaintainanceTask.status)
    )
    task_counts = {status: count for status, count in task_counts_result.all()}

    overdue_tasks = await db.scalar(
        select(func.count(MaintainanceTask.id)).where(
            MaintainanceTask.assigned_to_id == user.id,
            MaintainanceTask.status != "completed",
            MaintainanceTask.due_date < datetime.now(UTC),
        )
    )
    drills_created = await db.scalar(
        select(func.count(Drill.id)).where(Drill.created_by == user.id)
    )

    active_ship_assignments = [
        assignment for assignment in assignments if assignment.is_active
    ]
    details = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "designation": user.designation,
        "role": user.role,
        "created_at": user.created_at,
        "summary": UserActivitySummaryDto(
            assigned_ships=len(assignments),
            active_ship_assignments=len(active_ship_assignments),
            scheduled_tasks=task_counts.get("scheduled", 0),
            in_progress_tasks=task_counts.get("in_progress", 0),
            completed_tasks=task_counts.get("completed", 0),
            overdue_tasks=overdue_tasks or 0,
            drills_created=drills_created or 0,
        ),
        "ship_assignments": assignments,
    }
    return UserDetailsDto.model_validate(details)


@router.put("/{user_id}", summary="Update a user", dependencies=admin_only)
async def update_user_route(
    user_id: str,
    req: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user_manager: UserManager = Depends(get_user_manager),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_update = UserUpdate(**req.dict(exclude_unset=True))
    updated_user = await user_manager.update(user_update, user, safe=False)
    return TypeAdapter(UserDto).validate_python(updated_user)


@router.delete("/{user_id}", summary="Delete a user", dependencies=admin_only)
async def delete_user_route(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.post("/search", summary="Search user by text")
async def search_users(q: str | None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(
            or_(
                User.email.ilike(f"%{q}%"),
                User.name.ilike(f"%{q}%")
            )
        )
        .order_by(User.email)
        .limit(10))
    users = result.scalars().all()
    return TypeAdapter(list[UserDto]).validate_python(users)
