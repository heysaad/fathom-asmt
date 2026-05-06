from backend.app.infra.data.database import Base
from backend.app.infra.data.models.ShipTask import ShipTask


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


from datetime import datetime
from typing import List
from uuid import uuid4


class Ship(Base):
    __tablename__ = "ships"
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    tasks: List[ShipTask] = []
    created_at: Mapped[datetime] = mapped_column(default_factory=datetime.utcnow)