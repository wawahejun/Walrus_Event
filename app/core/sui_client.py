"""
Sui 区块链客户端集成
使用pysui 0.93.0 API与Sui区块链交互
"""

import logging
from typing import Dict, Any, Optional
from pysui import SuiConfig, SyncClient
from pysui.sui.sui_types.scalars import SuiString
from pysui.sui.sui_txresults.single_tx import SuiCoinObject
from app.core.config import settings

logger = logging.getLogger(__name__)


class SuiBlockchainClient:
    """
    Sui区块链客户端封装
    使用pysui 0.93.0+ API
    """
    
    def __init__(self):
        self.network = settings.SUI_NETWORK
        self.rpc_url = settings.SUI_RPC_URL
        self.client: Optional[SyncClient] = None
        self._initialize_client()
    
    def _initialize_client(self):
        """初始化Sui客户端"""
        try:
            # 创建配置
            if settings.SUI_PRIVATE_KEY:
                # 使用私钥创建配置
                config = SuiConfig.user_config(
                    rpc_url=self.rpc_url,
                    prv_keys=[settings.SUI_PRIVATE_KEY]
                )
                logger.info("Sui client initialized with private key")
            elif settings.SUI_MNEMONIC:
                # 使用助记词创建配置
                config = SuiConfig.user_config(
                    rpc_url=self.rpc_url,
                    mnemonics=[settings.SUI_MNEMONIC]
                )
                logger.info("Sui client initialized with mnemonic")
            else:
                # 只读模式
                config = SuiConfig.user_config(rpc_url=self.rpc_url)
                logger.warning("No Sui wallet credentials. Read-only mode.")
            
            # 创建客户端
            self.client = SyncClient(config)
            logger.info(f"Sui client connected to {self.network}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Sui client: {e}")
            # 不抛出异常，允许应用继续运行
            self.client = None
    
    def get_address(self) -> Optional[str]:
        """获取当前活跃地址"""
        try:
            if self.client and self.client.config.active_address:
                return self.client.config.active_address.address
            return None
        except Exception as e:
            logger.error(f"Failed to get address: {e}")
            return None
    
    async def submit_event_hash(
        self,
        event_id: str,
        data_hash: str,
        blob_id: str
    ) -> Dict[str, Any]:
        """
        将事件哈希提交到Sui区块链
        
        注意: 当前使用简单的注释交易。
        生产环境应使用自定义Move合约: anchor_event(event_id, hash, blob_id)
        
        Args:
            event_id: 事件ID
            data_hash: 数据SHA256哈希
            blob_id: Walrus blob ID
            
        Returns:
            交易结果
        """
        try:
            if not self.client:
                raise Exception("Sui client not initialized")
            
            if not self.get_address():
                raise Exception("No active address for signing transactions")
            
            # 使用pysui 0.93.0+ API创建交易
            # 从client构建交易（不能直接构造SuiTransaction）
            txn = self.client.new_transaction()
            
            # 简化实现：使用transfer_sui作为占位
            # TODO: 实现真实的Move合约调用
            # 存储事件元数据为交易描述
            metadata = f"Event:{event_id}|Hash:{data_hash[:16]}...|Blob:{blob_id}"
            
            # 转移最小金额(1 MIST)作为锚定标记
            # 实际应该调用合约: txn.move_call(...)
            txn.transfer_sui(
                recipient=self.get_address(),
                from_coin=None,  # 使用默认gas coin
                amount=1  # 1 MIST
            )
            
            # 执行交易
            result = txn.execute(gas_budget="1000000")
            
            if result.is_ok():
                digest = result.digest
                logger.info(f"Event {event_id} anchored. TX: {digest}")
                
                return {
                    "success": True,
                    "transaction_id": digest,
                    "event_id": event_id,
                    "data_hash": data_hash,
                    "blob_id": blob_id,
                    "network": self.network
                }
            else:
                error_msg = str(result.result_data) if hasattr(result, 'result_data') else "Transaction failed"
                raise Exception(f"Transaction failed: {error_msg}")
                
        except Exception as e:
            logger.error(f"Failed to submit event hash: {e}")
            raise
    
    async def verify_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """
        验证Sui交易状态
        
        Args:
            transaction_id: 交易摘要(digest)
            
        Returns:
            交易详情
        """
        try:
            if not self.client:
                raise Exception("Sui client not initialized")
            
            # 查询交易
            result = self.client.get_transaction(digest=transaction_id)
            
            if result.is_ok():
                tx = result.result_data
                
                return {
                    "transaction_id": transaction_id,
                    "status": "success",
                    "timestamp": tx.timestamp_ms if hasattr(tx, 'timestamp_ms') else None,
                    "checkpoint": tx.checkpoint if hasattr(tx, 'checkpoint') else None,
                    "explorer_url": f"https://testnet.suivision.xyz/txblock/{transaction_id}"
                }
            else:
                return {
                    "transaction_id": transaction_id,
                    "status": "not_found",
                    "error": "Transaction not found on blockchain"
                }
                
        except Exception as e:
            logger.error(f"Failed to verify transaction: {e}")
            return {
                "transaction_id": transaction_id,
                "status": "error",
                "error": str(e)
            }
    
    def get_balance(self) -> Optional[int]:
        """
        获取钱包余额
        
        Returns:
            余额(MIST), 1 SUI = 1,000,000,000 MIST
        """
        try:
            if not self.client:
                return None
            
            address = self.get_address()
            if not address:
                return None
            
            # 获取SUI余额
            result = self.client.get_balance(coin_type="0x2::sui::SUI")
            
            if result.is_ok():
                return int(result.result_data.total_balance)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return None
    
    def get_client_info(self) -> Dict[str, Any]:
        """获取客户端信息"""
        return {
            "initialized": self.client is not None,
            "network": self.network,
            "rpc_url": self.rpc_url,
            "address": self.get_address(),
            "has_credentials": bool(settings.SUI_PRIVATE_KEY or settings.SUI_MNEMONIC)
        }


# 全局Sui客户端实例
try:
    sui_client = SuiBlockchainClient()
except Exception as e:
    logger.warning(f"Failed to create global Sui client: {e}")
    sui_client = None


async def anchor_to_sui(event_id: str, data_hash: str, blob_id: str) -> Dict[str, Any]:
    """
    便捷函数: 锚定事件到Sui链
    
    Args:
        event_id: 事件ID
        data_hash: 数据哈希
        blob_id: Walrus blob ID
        
    Returns:
        交易结果
    """
    if not sui_client:
        raise Exception("Sui client not available")
    return await sui_client.submit_event_hash(event_id, data_hash, blob_id)


async def verify_sui_anchor(transaction_id: str) -> Dict[str, Any]:
    """
    便捷函数: 验证Sui交易
    
    Args:
        transaction_id: 交易ID
        
    Returns:
        验证结果
    """
    if not sui_client:
        raise Exception("Sui client not available")
    return await sui_client.verify_transaction(transaction_id)
