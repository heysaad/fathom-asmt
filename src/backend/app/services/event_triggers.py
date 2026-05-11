import logging
from typing import Awaitable, Callable
from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.data.models.Ship import Drill, MaintainanceTask
from app.infra.data.database import async_session
from app.services.compliance_service import ComplianceService


class EventTriggers:
    def __init__(self, background_tasks: BackgroundTasks):
        self.background_tasks = background_tasks
        self.log = logging.getLogger("EventTriggers")

    async def refresh_by_shipid(self, ship_id: UUID | str):
        self._queue(EventTriggerWorker._refresh_by_shipid, ship_id)

    async def on_task_created(self, task_id: UUID | str):
        self._queue(EventTriggerWorker._on_task_created, task_id)

    async def on_task_done(self, task_id: UUID | str):
        self._queue(EventTriggerWorker._on_task_done, task_id)

    async def on_drill_created(self, drill_id: UUID | str):
        self._queue(EventTriggerWorker._on_drill_created, drill_id)

    async def on_drill_done(self, drill_id: UUID | str):
        self._queue(EventTriggerWorker._on_drill_done, drill_id)

    def _queue(self, handler: Callable[..., Awaitable[None]], *args):
        self.background_tasks.add_task(self._run_in_background, handler, *args)

    async def _run_in_background(self, handler: Callable[..., Awaitable[None]], *args):
        try:
            async with async_session() as session:
                compliance = ComplianceService(session)
                worker = EventTriggerWorker(session, compliance)
                await handler(worker, *args)
        except Exception:
            self.log.exception("Event trigger background task failed")


class EventTriggerWorker:
    def __init__(self, db: AsyncSession, compliance: ComplianceService):
        self.db = db
        self.compliance = compliance
        self.log = logging.getLogger("EventTriggers")

    async def _refresh_by_shipid(self, ship_id: UUID | str | None):
        if not ship_id:
            self.log.warning("Skipping compliance refresh because ship_id was not found")
            return

        self.log.info("refreshing compliance: %s", ship_id)

        await self.compliance.update_crew_compliance(ship_id)
        await self.compliance.update_ship_compliance(ship_id)

    async def _on_task_created(self, task_id: UUID | str):
        ship_id = await self.db.scalar(select(MaintainanceTask.ship_id).where(MaintainanceTask.id == task_id))
        await self._refresh_by_shipid(ship_id)
        
    async def _on_task_done(self, task_id: UUID | str):
        ship_id = await self.db.scalar(select(MaintainanceTask.ship_id).where(MaintainanceTask.id == task_id))
        await self._refresh_by_shipid(ship_id)

    async def _on_drill_created(self, drill_id: UUID | str):
        ship_id = await self.db.scalar(select(Drill.ship_id).where(Drill.id == drill_id))
        await self._refresh_by_shipid(ship_id)

    async def _on_drill_done(self, drill_id: UUID | str):
        ship_id = await self.db.scalar(select(Drill.ship_id).where(Drill.id == drill_id))
        await self._refresh_by_shipid(ship_id)
