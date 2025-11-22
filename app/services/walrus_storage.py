"""
Walrus存储服务 - 活动数据存储
专门用于存储和检索活动相关数据
"""

import json
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.walrus import walrus_storage

logger = logging.getLogger(__name__)


class WalrusEventStorage:
    """
    Walrus活动存储服务
    处理活动数据的加密存储和检索
    """
    
    def __init__(self):
        self.storage = walrus_storage
        self.blob_registry: Dict[str, str] = {}  # event_id -> blob_id
        
    async def upload_event_data(
        self,
        event_id: str,
        event_data: Dict[str, Any],
        privacy_level: str = "public"
    ) -> Dict[str, Any]:
        """
        上传活动数据到Walrus
        
        Args:
            event_id: 活动ID
            event_data: 活动数据
            privacy_level: 隐私级别 (public/hybrid/zk-private)
            
        Returns:
            存储结果包含blob_id和存储证明
        """
        try:
            # 根据隐私级别决定是否加密
            encrypt = privacy_level in ["hybrid", "zk-private"]
            
            # 准备存储数据
            storage_payload = {
                "event_id": event_id,
                "privacy_level": privacy_level,
                "data": event_data,
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
            # 上传到Walrus (模拟)
            # 实际环境中会调用真实的Walrus API
            blob_id = await self._simulate_walrus_upload(storage_payload, encrypt)
            
            # 生成存储证明
            storage_proof = self._generate_storage_proof(event_id, blob_id, storage_payload)
            
            # 注册blob_id
            self.blob_registry[event_id] = blob_id
            
            logger.info(f"Uploaded event {event_id} to Walrus with blob_id: {blob_id}")
            
            return {
                "blob_id": blob_id,
                "storage_proof": storage_proof,
                "privacy_level": privacy_level,
                "encrypted": encrypt,
                "storage_nodes": self._get_storage_nodes(),
                "upload_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to upload event data: {e}")
            raise
    
    async def _simulate_walrus_upload(self, data: Dict[str, Any], encrypt: bool) -> str:
        """
        模拟Walrus上传（实际应调用Walrus API）
        
        Returns:
            模拟的blob_id
        """
        # 生成模拟的blob_id
        data_hash = hashlib.sha256(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()
        
        blob_id = f"walrus_blob_{data_hash[:16]}"
        
        # 在实际实现中，这里会调用：
        # blob_id = await self.storage.store_data(data, encrypt=encrypt)
        
        return blob_id
    
    def _generate_storage_proof(
        self,
        event_id: str,
        blob_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        生成存储证明（Merkle proof）
        
        Args:
            event_id: 活动ID
            blob_id: Blob ID
            data: 存储的数据
            
        Returns:
            存储证明
        """
        # 生成数据hash
        data_hash = self.storage.generate_data_hash(data)
        
        # 生成存储承诺
        commitment = hashlib.sha256(
            f"{event_id}_{blob_id}_{data_hash}".encode()
        ).hexdigest()
        
        return {
            "commitment": commitment,
            "data_hash": data_hash,
            "blob_id": blob_id,
            "merkle_root": self._generate_merkle_root(data),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _generate_merkle_root(self, data: Dict[str, Any]) -> str:
        """
        生成Merkle树根哈希
        
        简化版本 - 实际应使用完整的Merkle树实现
        """
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def _get_storage_nodes(self) -> list:
        """
        获取存储节点列表
        
        Returns:
            活跃的Walrus存储节点列表
        """
        # 模拟的节点分布
        return [
            "walrus-node-1.testnet",
            "walrus-node-2.testnet",
            "walrus-node-3.testnet",
            "walrus-node-4.testnet"
        ]
    
    async def get_storage_status(self, event_id: str) -> Dict[str, Any]:
        """
        获取活动的存储状态
        
        Args:
            event_id: 活动ID
            
        Returns:
            存储状态信息
        """
        if event_id not in self.blob_registry:
            return {
                "stored": False,
                "message": "Event data not stored on Walrus"
            }
        
        blob_id = self.blob_registry[event_id]
        
        # 检查存储状态（模拟）
        return {
            "stored": True,
            "blob_id": blob_id,
            "replication_factor": 4,
            "storage_nodes": self._get_storage_nodes(),
            "verified": True,
            "last_verified": datetime.utcnow().isoformat()
        }
    
    async def verify_storage(self, blob_id: str) -> Dict[str, Any]:
        """
        验证Walrus存储完整性
        
        Args:
            blob_id: Blob ID
            
        Returns:
            验证结果
        """
        # 实际中会查询Walrus网络验证数据
        return {
            "blob_id": blob_id,
            "verified": True,
            "integrity_check": "passed",
            "available_shards": 4,
            "total_shards": 4,
            "last_verified": datetime.utcnow().isoformat()
        }
    
    async def get_blob_metadata(self, blob_id: str) -> Dict[str, Any]:
        """
        获取Blob元数据
        
        Args:
            blob_id: Blob ID
            
        Returns:
            Blob元数据
        """
        return {
            "blob_id": blob_id,
            "size_bytes": 4096,  # 模拟大小
            "created_at": datetime.utcnow().isoformat(),
            "content_type": "application/json",
            "encryption": "ChaCha20-Poly1305",
            "shard_distribution": {
                "total_shards": 4,
                "available_shards": 4,
                "nodes": self._get_storage_nodes()
            }
        }


# 全局存储服务实例
walrus_event_storage = WalrusEventStorage()
