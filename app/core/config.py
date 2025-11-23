from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Walrus 配置
    WALRUS_RPC_URL: str = os.getenv("WALRUS_RPC_URL", "")
    WALRUS_CONTRACT_ADDRESS: str = os.getenv("WALRUS_CONTRACT_ADDRESS", "")
    WALRUS_STORAGE_NODE: str = os.getenv("WALRUS_STORAGE_NODE", "")
    WALRUS_PUBLISHER_URL: str = os.getenv("WALRUS_PUBLISHER_URL", "https://publisher.walrus-testnet.walrus.space")
    WALRUS_AGGREGATOR_URL: str = os.getenv("WALRUS_AGGREGATOR_URL", "https://aggregator.walrus-testnet.walrus.space")
    WALRUS_API_TOKEN: Optional[str] = os.getenv("WALRUS_API_TOKEN")
    
    # Sui 网络配置
    SUI_RPC_URL: str = os.getenv("SUI_RPC_URL", "https://fullnode.testnet.sui.io:443")
    SUI_NETWORK: str = os.getenv("SUI_NETWORK", "testnet")
    SUI_PRIVATE_KEY: Optional[str] = os.getenv("SUI_PRIVATE_KEY")
    SUI_MNEMONIC: Optional[str] = os.getenv("SUI_MNEMONIC")
    
    # 应用配置
    APP_NAME: str = os.getenv("APP_NAME", "MarkovWalrusRecommender")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # 数据库配置
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql+asyncpg://wawahejun:password@localhost/markov_walrus")
    # MONGODB_URL removed
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # 安全配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "your-encryption-key")
    
    # API 配置
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "4"))
    
    class Config:
        env_file = ".env"

settings = Settings()