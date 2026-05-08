from datetime import datetime

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID

from app.infra.data.base import Base

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class User(SQLAlchemyBaseUserTableUUID, Base):
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    designation: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, server_default="crew")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow(), nullable=True)

