from app.infra.data.base import Base
from sqlalchemy import Boolean, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from .User import User


class Ship(Base):
    __tablename__ = "ships"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    imo: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())

    # Relationships
    crew_assignments: Mapped[List["ShipCrewAssignment"]] = relationship(
        back_populates="ship"
    )
    maintenance_tasks: Mapped[List["MaintainanceTask"]] = relationship(
        back_populates="ship"
    )
    drills: Mapped[List["Drill"]] = relationship(back_populates="ship")


class ShipCrewAssignment(Base):
    __tablename__ = "ship_crew_assignments"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(
        String, ForeignKey("ships.id"), nullable=False
    )
    crew_member_id: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="crew_assignments")
    crew_member: Mapped["User"] = relationship(back_populates="crew_assignments")
    drill_assignments: Mapped[List["DrillAssignment"]] = relationship(
        back_populates="ship_crew_assignment"
    )


class MaintainanceTask(Base):
    __tablename__ = "maintainance_tasks"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(
        String, ForeignKey("ships.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    # e.g. "routine", "repair", "inspection", "upgrade"
    type: Mapped[str] = mapped_column(String, nullable=False)
    # pending, in_progress, completed
    status: Mapped[str] = mapped_column(String, default="scheduled")
    due_date: Mapped[datetime] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    assigned_to_id: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), nullable=True
    )

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="maintenance_tasks")
    assigned_to: Mapped["User"] = relationship(back_populates="assigned_tasks")


class Drill(Base):
    __tablename__ = "drills"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(
        String, ForeignKey("ships.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    # fire_drill, evacuation, man_overboard
    title: Mapped[str] = mapped_column(String, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(nullable=False)
    started_at: Mapped[datetime] = mapped_column(nullable=True)
    completed_at: Mapped[datetime] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String, default="scheduled")
    # scheduled, in_progress, completed, missed, cancelled
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_by: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="drills")
    created_by_user: Mapped["User"] = relationship(back_populates="created_drills")
    assignments: Mapped[List["DrillAssignment"]] = relationship(
        back_populates="drill"
    )


class DrillAssignment(Base):
    __tablename__ = "drill_assignments"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    drill_id: Mapped[str] = mapped_column(
        String, ForeignKey("drills.id"), nullable=False
    )
    ship_crew_assignment_id: Mapped[str] = mapped_column(
        String, ForeignKey("ship_crew_assignments.id"), nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_attended: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    attended_at: Mapped[datetime] = mapped_column(nullable=True)
    remarks: Mapped[str] = mapped_column(String, nullable=True)

    # Relationships
    drill: Mapped["Drill"] = relationship(back_populates="assignments")
    ship_crew_assignment: Mapped["ShipCrewAssignment"] = relationship(
        back_populates="drill_assignments"
    )
