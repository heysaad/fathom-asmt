from typing import Literal
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic import TypeAdapter
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.auth.role_checker import RoleChecker
from app.infra.auth.users import UserManager, get_user_manager
from app.infra.data.database import get_db
from app.infra.data.models.User import User
from app.schemas.common import UserDto
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
async def get_user_route(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return TypeAdapter(UserDto).validate_python(user)


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
async def search_users(q: str | None):
    result = await db.execute(
        select(User)
        .where(
            or_(
                User.email.ilike(f"%{q}%"),
                User.username.ilike(f"%{q}%")
            )
        )
        .order_by(User.email)
        .limit(10))
    users = result.scalars().all()
    return TypeAdapter(list[UserDto]).validate_python(users)
