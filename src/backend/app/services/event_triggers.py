import logging

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.data.models.Ship import Drill, MaintainanceTask
from app.infra.data.database import get_db
from app.services.compliance_service import ComplianceService


class EventTriggers:
    def __init__(self, db: AsyncSession = Depends(get_db), compliance: ComplianceService = Depends(ComplianceService)):
        self.db = db
        self.compliance = compliance
        self.log = logging.getLogger("EventTriggers")

    async def refresh_by_shipid(self, ship_id: int):
        self.log.info("refreshing compliance: %s", ship_id)

        await self.compliance.update_crew_compliance(ship_id)
        await self.compliance.update_ship_compliance(ship_id)

    async def on_task_created(self, task_id: int):
        ship_id = await self.db.scalar(select(MaintainanceTask.ship_id).where(MaintainanceTask.id == task_id))
        await self.refresh_by_shipid(ship_id)
        
    async def on_task_done(self, task_id: int):
        ship_id = await self.db.scalar(select(MaintainanceTask.ship_id).where(MaintainanceTask.id == task_id))
        await self.refresh_by_shipid(ship_id)

    async def on_drill_created(self, drill_id: int):
        ship_id = await self.db.scalar(select(Drill.ship_id).where(Drill.id == drill_id))
        await self.refresh_by_shipid(ship_id)

    async def on_drill_done(self, drill_id: int):
        ship_id = await self.db.scalar(select(Drill.ship_id).where(Drill.id == drill_id))
        await self.refresh_by_shipid(ship_id)
