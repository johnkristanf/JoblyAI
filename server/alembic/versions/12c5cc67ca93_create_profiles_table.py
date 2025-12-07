"""create_profiles_table

Revision ID: 12c5cc67ca93
Revises: 783cb5a310a9
Create Date: 2025-12-03 05:14:24.660410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '12c5cc67ca93'
down_revision: Union[str, Sequence[str], None] = '783cb5a310a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'profiles',
        sa.Column('user_id', UUID(as_uuid=True), primary_key=True, index=True, nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ondelete="CASCADE"),
    )
    
    # Optional: Enable RLS and create policies
    
    
    # Triggers: Create new profile record after user signup
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (user_id, full_name, avatar_url)
            VALUES (
                NEW.id,
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'avatar_url'
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
    """)
    
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users")
    op.execute("""
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users')
    op.execute('DROP FUNCTION IF EXISTS public.handle_new_user()')
    
    # Drop table (RLS policies automatically drop with table)
    op.drop_table('profiles')
