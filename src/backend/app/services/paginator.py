from fastapi import Depends
from pydantic import BaseModel, TypeAdapter
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.data.database import get_db


class Paginator:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def get_paginated[TData](self, req: PaginationRequest, query: Select):
        total_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(total_query)).scalar() or 0

        data_query = query.offset(
            (req.page-1)*req.pageSize).limit(req.pageSize)
        data = (await self.db.execute(data_query)).scalars().all()

        return PaginationResponse[TData](total=total, data=data)


class PaginationRequest[TFilter](BaseModel):
    page: int = 1
    pageSize: int = 10
    search: str | None = None
    filters: TFilter | None = None


class PaginationResponse[TData](BaseModel):
    data: list[TData]
    total: int

    def to_dto[TDto](self, typ: type[TDto]) -> PaginationResponse[TDto]:
        return PaginationResponse[TDto](
            data=TypeAdapter(list[typ]).validate_python(self.data),
            total=self.total
        )
        