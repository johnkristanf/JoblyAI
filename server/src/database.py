from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, declarative_base, sessionmaker
from src.config import settings

Base: DeclarativeBase = declarative_base()

class Database:
    engine = None
    async_session = None

    @classmethod
    def connect_async_session(cls):
        cls.engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before using
            future=True,
        )

        cls.async_session = sessionmaker(
            bind=cls.engine, class_=AsyncSession, expire_on_commit=False
        )

    @classmethod
    async def get_async_session(cls) -> AsyncGenerator[AsyncSession, None]:
        async with cls.async_session() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    @classmethod
    async def close(cls):
        if cls.engine is not None:
            await cls.engine.dispose()
            cls.engine = None
            cls.async_session = None
