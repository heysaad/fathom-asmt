from typing import Optional

from backend.app.infra.data.database import Base


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


from datetime import datetime
from uuid import uuid4


class ShipTask(Base):
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # User ID
    status: Mapped[str] = mapped_column(String, default="pending")  # pending, in_progress, completed
    created_at: Mapped[datetime] = mapped_column(default_factory=datetime.utcnow)