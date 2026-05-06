from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 1. Database URL
# 'check_same_thread' is only needed for SQLite
engine = create_async_engine(
    settings.database_url, 
    echo=False,
    pool_size=10,
    max_overflow=20,
    connect_args={"check_same_thread": False}
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# 5. Dependency to get DB session
async def get_db():
    async with async_session() as session:
        yield session