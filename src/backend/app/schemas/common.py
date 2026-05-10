
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ShipDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    imo: str | None
    description: str | None
    type: str
    created_at: datetime

class UserDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str | None = None
    email: str | None = None
    designation: str | None = None
    role: str | None = None
