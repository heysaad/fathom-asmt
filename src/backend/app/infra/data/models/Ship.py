from app.infra.data.base import Base
from sqlalchemy import String
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
