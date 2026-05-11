from math import ceil

from fastapi import Depends
from sqlalchemy import func, or_, select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.data.database import get_db
from app.infra.data.models.Ship import Drill, DrillAssignment, MaintainanceTask, Ship, ShipCrewAssignment


class ComplianceService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def update_crew_compliance(self, ship_id: int):
        assignments = await self.db.scalars(select(ShipCrewAssignment).where(ShipCrewAssignment.ship_id == ship_id))

        for x in assignments:
            drills = await self.get_drill_compliance(x.id)
            x.drills_total = drills.total
            x.drills_attended = drills.completed

            tasks = await self.get_task_compliance(x.id)
            x.tasks_total = tasks.total
            x.tasks_completed = tasks.completed

            x.compliance_score = ceil(drills.add(tasks).get_score())
            await self.db.commit()
            await self.db.refresh(x)

    async def calculate_crew_compliance(self, crew_assignment_id: int):
        drills = await self.get_drill_compliance(crew_assignment_id)
        task = await self.get_task_compliance(crew_assignment_id)

        return ComplianceResult(
            completed=drills.completed+task.completed,
            total=drills.total+task.total)

    async def get_drill_compliance(self, crew_assignment_id: int):

        total = await self.db.scalar(
            select(func.count(DrillAssignment.id))
            .select_from(DrillAssignment)
            .where(DrillAssignment.ship_crew_assignment_id == crew_assignment_id)
        ) or 0

        attended = await self.db.scalar(
            select(func.count(DrillAssignment.id))
            .select_from(DrillAssignment)
            .where(DrillAssignment.ship_crew_assignment_id == crew_assignment_id)
            .where(DrillAssignment.is_attended == True)
        ) or 0

        return ComplianceResult(completed=attended, total=total)

    async def get_task_compliance(self, crew_assignment_id: int):

        user_id = await self.db.scalar(
            select(ShipCrewAssignment.crew_member_id)
            .where(ShipCrewAssignment.id == crew_assignment_id)
        )

        total = await self.db.scalar(
            select(func.count(MaintainanceTask.id))
            .select_from(MaintainanceTask)
            .where(MaintainanceTask.assigned_to_id == user_id)
        ) or 0

        completed_on_time = await self.db.scalar(
            select(func.count(MaintainanceTask.id))
            .select_from(MaintainanceTask)
            .where(MaintainanceTask.assigned_to_id == user_id)
            .where(MaintainanceTask.completed_on != None, MaintainanceTask.completed_on < MaintainanceTask.due_date)
        ) or 0

        return ComplianceResult(completed=completed_on_time, total=total)

    async def update_ship_compliance(self, ship_id: int):
        compliance = await self.get_ship_compliance(ship_id)

        ship = await self.db.scalar(select(Ship).where(Ship.id == ship_id))
        ship.compliance_score = ceil(compliance.get_score())
        await self.db.commit()
        await self.db.refresh(ship)

    async def get_ship_compliance(self, ship_id: int):
        total_drills = await self.db.scalar(
            select(func.count(Drill.id))
            .where(Drill.ship_id == ship_id)
        )

        # completed on time
        completed_drills = await self.db.scalar(
            select(func.count(Drill.id))
            .where(Drill.completed_at is not None,
                   Drill.completed_at <= Drill.scheduled_at,
                   Drill.status == "completed"))

        return ComplianceResult(completed=completed_drills, total=total_drills)


class ComplianceResult:
    def __init__(self, completed: int, total: int):
        self.completed = completed
        self.total = total

    def get_score(self):
        return (self.completed/self.total)*100 if self.total > 0 else 0

    def add(self, second: ComplianceResult):
        return ComplianceResult(completed=self.completed+second.completed, total=self.total+second.total)
