"""convert all ids and fks to UUID

Revision ID: fc993cae0b2f
Revises: ab1ca29c2fec
Create Date: 2026-05-10 10:52:08.807769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fc993cae0b2f'
down_revision: Union[str, Sequence[str], None] = 'ab1ca29c2fec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Convert string UUIDs to actual UUID type using USING clause
    op.alter_column('ships', 'id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='id::uuid')
    
    op.alter_column('ship_crew_assignments', 'id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='id::uuid')
    op.alter_column('ship_crew_assignments', 'ship_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='ship_id::uuid')
    op.alter_column('ship_crew_assignments', 'crew_member_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='crew_member_id::uuid')
    op.create_foreign_key('fk_ship_crew_assignments_ship_id', 'ship_crew_assignments', 'ships', ['ship_id'], ['id'])
    op.create_foreign_key('fk_ship_crew_assignments_crew_member_id', 'ship_crew_assignments', 'user', ['crew_member_id'], ['id'])
    
    op.alter_column('maintainance_tasks', 'id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='id::uuid')
    op.alter_column('maintainance_tasks', 'ship_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='ship_id::uuid')
    op.alter_column('maintainance_tasks', 'assigned_to_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=True,
               postgresql_using='assigned_to_id::uuid')
    op.create_foreign_key('fk_maintainance_tasks_ship_id', 'maintainance_tasks', 'ships', ['ship_id'], ['id'])
    op.create_foreign_key('fk_maintainance_tasks_assigned_to_id', 'maintainance_tasks', 'user', ['assigned_to_id'], ['id'])
    
    op.alter_column('drills', 'id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='id::uuid')
    op.alter_column('drills', 'ship_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='ship_id::uuid')
    op.alter_column('drills', 'created_by',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=True,
               postgresql_using='created_by::uuid')
    op.create_foreign_key('fk_drills_ship_id', 'drills', 'ships', ['ship_id'], ['id'])
    op.create_foreign_key('fk_drills_created_by', 'drills', 'user', ['created_by'], ['id'])
    
    op.alter_column('drill_assignments', 'id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='id::uuid')
    op.alter_column('drill_assignments', 'drill_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='drill_id::uuid')
    op.alter_column('drill_assignments', 'ship_crew_assignment_id',
               existing_type=sa.VARCHAR(),
               type_=sa.UUID(as_uuid=True),
               existing_nullable=False,
               postgresql_using='ship_crew_assignment_id::uuid')
    op.create_foreign_key('fk_drill_assignments_drill_id', 'drill_assignments', 'drills', ['drill_id'], ['id'])
    op.create_foreign_key('fk_drill_assignments_ship_crew_assignment_id', 'drill_assignments', 'ship_crew_assignments', ['ship_crew_assignment_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_drill_assignments_ship_crew_assignment_id', 'drill_assignments', type_='foreignkey')
    op.drop_constraint('fk_drill_assignments_drill_id', 'drill_assignments', type_='foreignkey')
    op.alter_column('drill_assignments', 'ship_crew_assignment_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='ship_crew_assignment_id::text')
    op.alter_column('drill_assignments', 'drill_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='drill_id::text')
    op.alter_column('drill_assignments', 'id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='id::text')
    
    op.drop_constraint('fk_drills_created_by', 'drills', type_='foreignkey')
    op.drop_constraint('fk_drills_ship_id', 'drills', type_='foreignkey')
    op.alter_column('drills', 'created_by',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=True,
               postgresql_using='created_by::text')
    op.alter_column('drills', 'ship_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='ship_id::text')
    op.alter_column('drills', 'id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='id::text')
    
    op.drop_constraint('fk_maintainance_tasks_assigned_to_id', 'maintainance_tasks', type_='foreignkey')
    op.drop_constraint('fk_maintainance_tasks_ship_id', 'maintainance_tasks', type_='foreignkey')
    op.alter_column('maintainance_tasks', 'assigned_to_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=True,
               postgresql_using='assigned_to_id::text')
    op.alter_column('maintainance_tasks', 'ship_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='ship_id::text')
    op.alter_column('maintainance_tasks', 'id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='id::text')
    
    op.drop_constraint('fk_ship_crew_assignments_crew_member_id', 'ship_crew_assignments', type_='foreignkey')
    op.drop_constraint('fk_ship_crew_assignments_ship_id', 'ship_crew_assignments', type_='foreignkey')
    op.alter_column('ship_crew_assignments', 'crew_member_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='crew_member_id::text')
    op.alter_column('ship_crew_assignments', 'ship_id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='ship_id::text')
    op.alter_column('ship_crew_assignments', 'id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='id::text')
    
    op.alter_column('ships', 'id',
               existing_type=sa.UUID(as_uuid=True),
               type_=sa.VARCHAR(),
               existing_nullable=False,
               postgresql_using='id::text')
