from datetime import datetime
from typing import TYPE_CHECKING, List

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID

from app.infra.data.base import Base

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .Ship import ShipCrewAssignment, MaintainanceTask, Drill


class User(SQLAlchemyBaseUserTableUUID, Base):
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    designation: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, server_default="crew")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow(), nullable=True)

    # Relationships
    crew_assignments: Mapped[List["ShipCrewAssignment"]] = relationship(
        back_populates="crew_member"
    )
    assigned_tasks: Mapped[List["MaintainanceTask"]] = relationship(
        back_populates="assigned_to"
    )
    created_drills: Mapped[List["Drill"]] = relationship(
        back_populates="created_by_user"
    )

