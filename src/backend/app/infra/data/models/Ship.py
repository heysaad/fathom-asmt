from app.infra.data.base import Base
from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List, TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from .User import User


class Ship(Base):
    __tablename__ = "ships"
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(nullable=False)
    imo: Mapped[str] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())

    # Relationships
    crew_assignments: Mapped[List["ShipCrewAssignment"]] = relationship(
        back_populates="ship", lazy="noload"
    )
    maintenance_tasks: Mapped[List["MaintainanceTask"]] = relationship(
        back_populates="ship", lazy="noload"
    )
    drills: Mapped[List["Drill"]] = relationship(back_populates="ship", lazy="noload")


class ShipCrewAssignment(Base):
    __tablename__ = "ship_crew_assignments"
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ship_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ships.id"), nullable=False
    )
    crew_member_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="crew_assignments", lazy="noload")
    crew_member: Mapped["User"] = relationship(back_populates="crew_assignments", lazy="noload")
    drill_assignments: Mapped[List["DrillAssignment"]] = relationship(
        back_populates="ship_crew_assignment", lazy="noload"
    )


class MaintainanceTask(Base):
    __tablename__ = "maintainance_tasks"
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ship_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ships.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(nullable=True)
    # e.g. "routine", "repair", "inspection", "upgrade"
    type: Mapped[str] = mapped_column(nullable=False)
    # pending, in_progress, completed
    status: Mapped[str] = mapped_column(default="scheduled")
    due_date: Mapped[datetime] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    assigned_to_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="maintenance_tasks", lazy="noload")
    assigned_to: Mapped["User"] = relationship(back_populates="assigned_tasks", lazy="noload")


class Drill(Base):
    __tablename__ = "drills"
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ship_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ships.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(nullable=False)
    # fire_drill, evacuation, man_overboard
    title: Mapped[str] = mapped_column(nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(nullable=False)
    started_at: Mapped[datetime] = mapped_column(nullable=True)
    completed_at: Mapped[datetime] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(default="scheduled")
    # scheduled, in_progress, completed, missed, cancelled
    notes: Mapped[str] = mapped_column(nullable=True)
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())

    # Relationships
    ship: Mapped["Ship"] = relationship(back_populates="drills", lazy="noload")
    created_by_user: Mapped["User"] = relationship(back_populates="created_drills", lazy="noload")
    assignments: Mapped[List["DrillAssignment"]] = relationship(
        back_populates="drill", lazy="noload"
    )


class DrillAssignment(Base):
    __tablename__ = "drill_assignments"
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    drill_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drills.id"), nullable=False
    )
    ship_crew_assignment_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ship_crew_assignments.id"), nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_attended: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    attended_at: Mapped[datetime] = mapped_column(nullable=True)
    remarks: Mapped[str] = mapped_column(nullable=True)

    # Relationships
    drill: Mapped["Drill"] = relationship(back_populates="assignments", lazy="noload")
    ship_crew_assignment: Mapped["ShipCrewAssignment"] = relationship(
        back_populates="drill_assignments", lazy="noload"
    )
