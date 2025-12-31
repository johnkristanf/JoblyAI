import redis

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, declarative_base, sessionmaker
from src.config.runtime import params
# from src.config import settings

Base: DeclarativeBase = declarative_base()


class Database:
    engine = None
    async_session = None
    redis_client = None

    @classmethod
    def connect_async_session(cls):
        cls.engine = create_async_engine(
            params["DATABASE_URL"],
            echo=False,
            pool_size=10,
            pool_pre_ping=True,
            pool_recycle=3600,  # Recycle connections after 1 hour
            pool_timeout=30,  # Timeout after 30 seconds waiting for connection
            future=True,
            connect_args={
                "ssl": "require",
                "statement_cache_size": 0,
            },
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

    @classmethod
    def connect_redis(cls):
        cls.redis_client = redis.Redis.from_url(
            params["REDIS_URL"], decode_responses=True, socket_timeout=5
        )

    @classmethod
    def get_redis_client(cls):
        if not hasattr(cls, "redis_client") or cls.redis_client is None:
            cls.connect_redis()
        return cls.redis_client
