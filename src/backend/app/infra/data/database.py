from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from alembic.config import Config

from app.config import settings
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from alembic import command

from app.infra.data.base import Base

_engine: AsyncEngine | None = None
_async_session: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine

    if _engine is None:
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL is required before opening a database connection")

        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
        )

    return _engine


def get_async_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _async_session

    if _async_session is None:
        _async_session = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )

    return _async_session


async def get_db():
    async_session = get_async_sessionmaker()
    async with async_session() as session:
        yield session


async def create_db_and_tables():
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


async def get_user_db(session: AsyncSession = Depends(get_db)):
    from app.infra.data.models.User import User
    yield SQLAlchemyUserDatabase(session, User)
