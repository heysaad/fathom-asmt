from backend.app.infra.data.database import Base


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


from datetime import datetime
from uuid import uuid4


class TaskNote(Base):
    __tablename__ = "task_notes"
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )
    task_id: Mapped[str] = mapped_column(String, nullable=False)  # ShipTask ID
    user_id: Mapped[str] = mapped_column(String, nullable=False)  # User ID
    note: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default_factory=datetime.utcnow)