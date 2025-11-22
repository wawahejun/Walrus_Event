from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# 创建异步引擎
try:
    engine = create_async_engine(settings.POSTGRES_URL, echo=settings.DEBUG)
    engine_created = True
except Exception as e:
    logger.error(f"❌ 无法创建数据库引擎: {e}")
    logger.error(f"请确保 PostgreSQL 正在运行且配置正确")
    logger.error(f"POSTGRES_URL: {settings.POSTGRES_URL}")
    logger.error(f"如果尚未设置数据库，请运行: python setup_database.py")
    engine = None
    engine_created = False

# 创建会话工厂
if engine:
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
else:
    AsyncSessionLocal = None

# 声明基类
Base = declarative_base()

def check_db_connection():
    """检查数据库连接是否可用"""
    return engine is not None and engine_created

async def init_db():
    """
    初始化数据库（创建表）
    """
    if not check_db_connection():
        logger.error("数据库未正确初始化，跳过表创建")
        return

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ 数据库表创建成功")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        logger.error("数据库连接失败，请检查 POSTGRES_URL 配置是否正确")
        logger.error("如果你还没有创建用户和数据库，请运行: python setup_database.py")

async def get_db():
    """
    获取数据库会话
    """
    if not check_db_connection():
        raise RuntimeError("数据库未正确配置或无法连接，请检查配置并运行 python setup_database.py")

    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
