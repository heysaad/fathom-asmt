from backend.app.infra.data.database import Base


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


from datetime import datetime
from uuid import uuid4


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default_factory=datetime.utcnow)