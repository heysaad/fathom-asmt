import uuid
from typing import Literal

from fastapi_users import schemas

class UserRead(schemas.BaseUser[uuid.UUID]):
    name: str | None = None
    designation: str | None = None
    role: Literal["admin", "crew"]

class UserCreate(schemas.BaseUserCreate):
    name: str | None = None
    designation: str | None = None
    role: Literal["admin", "crew"] = "crew"

class UserUpdate(schemas.BaseUserUpdate):
    name: str | None = None
    designation: str | None = None
    role: Literal["admin", "crew"] | None = None
