"""create resume table

Revision ID: 86de274686d5
Revises: 2980442c511c
Create Date: 2025-12-22 04:48:35.626875

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '86de274686d5'
down_revision: Union[str, Sequence[str], None] = '2980442c511c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'resumes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('object_key', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column(
            'user_id',
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auth.users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
            unique=True,
        ),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('resumes')
