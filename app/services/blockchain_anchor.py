"""
区块链锚定服务
将活动数据哈希锚定到Sui区块链，提供数据完整性验证
"""

import hashlib
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.sui_client import anchor_to_sui, verify_sui_anchor, sui_client

logger = logging.getLogger(__name__)


class BlockchainAnchorService:
    """
    区块链锚定服务
    处理事件数据到Sui链的锚定和验证
    """
    
    def __init__(self):
        self.anchor_registry: Dict[str, Dict[str, Any]] = {}  # event_id -> anchor_info
    
    async def anchor_event(
        self,
        event_id: str,
        event_data: Dict[str, Any],
        blob_id: str
    ) -> Dict[str, Any]:
        """
        将事件锚定到Sui区块链
        
        Args:
            event_id: 事件ID
            event_data: 事件数据
            blob_id: Walrus存储的blob ID
            
        Returns:
            锚定结果包含transaction_id
        """
        try:
            # 生成数据哈希
            data_hash = self._generate_data_hash(event_data)
            
            # 提交到Sui链
            result = await anchor_to_sui(event_id, data_hash, blob_id)
            
            # 注册锚定信息
            self.anchor_registry[event_id] = {
                "transaction_id": result["transaction_id"],
                "data_hash": data_hash,
                "blob_id": blob_id,
                "anchored_at": datetime.utcnow().isoformat(),
                "network": result["network"]
            }
            
            logger.info(f"Event {event_id} anchored to Sui blockchain. TX: {result['transaction_id']}")
            
            return {
                "success": True,
                "event_id": event_id,
                "transaction_id": result["transaction_id"],
                "data_hash": data_hash,
                "blob_id": blob_id,
                "explorer_url": f"https://testnet.suivision.xyz/txblock/{result['transaction_id']}",
                "anchored_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to anchor event to blockchain: {e}")
            # 返回失败状态但不抛出异常，允许继续
            return {
                "success": False,
                "event_id": event_id,
                "error": str(e),
                "data_hash": self._generate_data_hash(event_data),
                "blob_id": blob_id
            }
    
    async def get_anchor_status(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        获取事件的锚定状态
        
        Args:
            event_id: 事件ID
            
        Returns:
            锚定状态信息
        """
        if event_id not in self.anchor_registry:
            return {
                "anchored": False,
                "message": "Event not anchored to blockchain"
            }
        
        anchor_info = self.anchor_registry[event_id]
        transaction_id = anchor_info["transaction_id"]
        
        # 验证交易状态
        verification = await verify_sui_anchor(transaction_id)
        
        return {
            "anchored": True,
            "event_id": event_id,
            "transaction_id": transaction_id,
            "data_hash": anchor_info["data_hash"],
            "blob_id": anchor_info["blob_id"],
            "anchored_at": anchor_info["anchored_at"],
            "network": anchor_info["network"],
            "verification": verification,
            "explorer_url": verification.get("explorer_url")
        }
    
    async def verify_data_integrity(
        self,
        event_id: str,
        current_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        验证数据完整性
        比较当前数据哈希与链上记录的哈希
        
        Args:
            event_id: 事件ID
            current_data: 当前事件数据
            
        Returns:
            验证结果
        """
        if event_id not in self.anchor_registry:
            return {
                "verified": False,
                "error": "Event not found in anchor registry"
            }
        
        anchor_info = self.anchor_registry[event_id]
        original_hash = anchor_info["data_hash"]
        current_hash = self._generate_data_hash(current_data)
        
        return {
            "verified": original_hash == current_hash,
            "event_id": event_id,
            "original_hash": original_hash,
            "current_hash": current_hash,
            "transaction_id": anchor_info["transaction_id"],
            "integrity_check": "passed" if original_hash == current_hash else "failed"
        }
    
    def _generate_data_hash(self, data: Dict[str, Any]) -> str:
        """
        生成数据SHA256哈希
        
        Args:
            data: 数据字典
            
        Returns:
            SHA256哈希值（十六进制）
        """
        normalized_data = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(normalized_data.encode()).hexdigest()
    
    def get_wallet_info(self) -> Dict[str, Any]:
        """
        获取Sui钱包信息
        
        Returns:
            钱包地址和余额
        """
        address = sui_client.get_address()
        balance = sui_client.get_balance()
        
        return {
            "address": address,
            "balance_mist": balance,
            "balance_sui": balance / 1_000_000_000 if balance else 0,
            "network": sui_client.network,
            "rpc_url": sui_client.rpc_url
        }


# 全局锚定服务实例
blockchain_anchor_service = BlockchainAnchorService()
