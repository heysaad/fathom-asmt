from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID

from app.infra.data.base import Base

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


from datetime import datetime
from uuid import uuid4

class User(SQLAlchemyBaseUserTableUUID, Base):
    pass

