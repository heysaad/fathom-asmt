from app.infra.data.base import Base
from sqlalchemy import Boolean, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import List
from uuid import uuid4


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


class ShipCrewAssignment(Base):
    __tablename__ = "ship_crew_assignments"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(String, nullable=False)
    crew_member_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)


class MaintainanceTask(Base):
    __tablename__ = "maintainance_tasks"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    # e.g. "routine", "repair", "inspection", "upgrade"
    type: Mapped[str] = mapped_column(String, nullable=False)
    # pending, in_progress, completed
    status: Mapped[str] = mapped_column(String, default="scheduled")
    due_date: Mapped[datetime] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    assigned_to_id: Mapped[str] = mapped_column(String, nullable=True)


class Drill(Base):
    __tablename__ = "drills"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    ship_id: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    # fire_drill, evacuation, man_overboard
    title: Mapped[str] = mapped_column(String, nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(nullable=False)
    started_at: Mapped[datetime] = mapped_column(nullable=True)
    completed_at: Mapped[datetime] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String, default="scheduled")
    # scheduled, in_progress, completed, missed, cancelled
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_by: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())


class DrillAssignment(Base):
    __tablename__ = "drill_assignments"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    drill_id: Mapped[str] = mapped_column(String, nullable=False)
    ship_crew_assignment_id: Mapped[str] = mapped_column(String, nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(default=datetime.utcnow())
    is_attended: Mapped[bool] = mapped_column(Boolean, default=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    attended_at: Mapped[datetime] = mapped_column(nullable=True)
    remarks: Mapped[str] = mapped_column(String, nullable=True)
