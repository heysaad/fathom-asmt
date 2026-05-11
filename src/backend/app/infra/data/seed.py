from datetime import timedelta

from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infra.auth.users import UserManager
from app.infra.data.database import get_async_sessionmaker
from app.infra.data.models.Ship import (
    Drill,
    DrillAssignment,
    MaintainanceTask,
    Ship,
    ShipCrewAssignment,
)
from app.infra.data.models.User import User
from app.schemas.schemas import UserCreate
from app.utils.datetime import utc_now

DEFAULT_PASSWORD = "admin123"


USERS = [
    {
        "email": "admin@fathom.com",
        "name": "Avery Morgan",
        "designation": "Fleet Administrator",
        "role": "admin",
    },
    {
        "email": "captain@fathom.com",
        "name": "Maya Patel",
        "designation": "Captain",
        "role": "crew",
    },
    {
        "email": "engineer@fathom.com",
        "name": "Leo Anders",
        "designation": "Chief Engineer",
        "role": "crew",
    },
    {
        "email": "officer@fathom.com",
        "name": "Nora Singh",
        "designation": "Safety Officer",
        "role": "crew",
    },
    {
        "email": "bosun@fathom.com",
        "name": "Owen Clarke",
        "designation": "Bosun",
        "role": "crew",
    },
]

SHIPS = [
    {
        "name": "Fathom Voyager",
        "type": "Container Ship",
        "imo": "IMO9001001",
        "description": "Long-haul container vessel assigned to northern routes.",
    },
    {
        "name": "Fathom Horizon",
        "type": "Bulk Carrier",
        "imo": "IMO9001002",
        "description": "Bulk cargo vessel with mixed safety and maintenance workload.",
    },
    {
        "name": "Fathom Meridian",
        "type": "Oil Tanker",
        "imo": "IMO9001003",
        "description": "Tanker vessel operating under enhanced inspection routines.",
    },
    {
        "name": "Fathom Sentinel",
        "type": "Research Vessel",
        "imo": "IMO9001004",
        "description": "Research vessel with rotating crew readiness checks.",
    },
    {
        "name": "Fathom Atlas",
        "type": "Ro-Ro Cargo Ship",
        "imo": "IMO9001005",
        "description": "Roll-on roll-off vessel used for regional cargo operations.",
    },
]

TASK_TEMPLATES = [
    ("Inspect emergency generator", "inspection", "scheduled", 2),
    ("Service lifeboat release gear", "routine", "scheduled", 5),
    ("Check bilge pump alarms", "repair", "in_progress", 7),
]

DRILL_TEMPLATES = [
    ("Fire response drill", "fire_drill", "scheduled", 3),
    ("Abandon ship drill", "evacuation", "scheduled", 10),
]


async def seed_initial_data() -> None:
    async_session = get_async_sessionmaker()

    async with async_session() as session:
        await _seed_initial_data(session)


async def _seed_initial_data(session: AsyncSession) -> None:
    user_count = await session.scalar(select(func.count(User.id)))
    if user_count:
        return

    user_manager = UserManager(SQLAlchemyUserDatabase(session, User))

    users_by_email: dict[str, User] = {}
    for item in USERS:
        user = await user_manager.create(
            UserCreate(
                email=item["email"],
                password=DEFAULT_PASSWORD,
                name=item["name"],
                designation=item["designation"],
                role=item["role"],
                is_active=True,
                is_verified=True,
                is_superuser=item["role"] == "admin",
            ),
            safe=False,
        )
        users_by_email[item["email"]] = user

    admin = users_by_email["admin@fathom.com"]
    crew = [user for user in users_by_email.values() if user.role == "crew"]

    now = utc_now()

    for ship_index, item in enumerate(SHIPS):
        ship = Ship(
            name=item["name"],
            type=item["type"],
            imo=item["imo"],
            description=item["description"],
            compliance_score=0,
        )
        session.add(ship)
        await session.flush()

        assignments = []
        for user in crew:
            assignment = ShipCrewAssignment(
                ship_id=ship.id,
                crew_member_id=user.id,
                is_active=True,
                drills_total=0,
                drills_attended=0,
                tasks_total=0,
                tasks_completed=0,
                compliance_score=0,
            )
            session.add(assignment)
            await session.flush()
            assignments.append(assignment)

        for task_index, (title, task_type, status, due_days) in enumerate(TASK_TEMPLATES):
            task_title = f"{title} - {ship.name}"
            assignee = crew[(ship_index + task_index) % len(crew)]
            session.add(
                MaintainanceTask(
                    ship_id=ship.id,
                    title=task_title,
                    description=f"Seed task for {ship.name}.",
                    type=task_type,
                    status=status,
                    due_date=now + timedelta(days=due_days + ship_index),
                    assigned_to_id=assignee.id,
                )
            )

        for drill_index, (title, drill_type, status, scheduled_days) in enumerate(DRILL_TEMPLATES):
            drill_title = f"{title} - {ship.name}"
            drill = Drill(
                ship_id=ship.id,
                type=drill_type,
                title=drill_title,
                scheduled_at=now + timedelta(days=scheduled_days + ship_index),
                status=status,
                notes=f"Seed drill for {ship.name}.",
                created_by=admin.id,
            )
            session.add(drill)
            await session.flush()

            for assignment in assignments[:2]:
                session.add(
                    DrillAssignment(
                        drill_id=drill.id,
                        ship_crew_assignment_id=assignment.id,
                        is_attended=False,
                        is_completed=False,
                    )
                )

    await session.commit()
