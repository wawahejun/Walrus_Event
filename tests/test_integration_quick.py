#!/usr/bin/env python3
"""
简单测试脚本 - 验证Walrus和Sui集成
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, '/home/wawahejun/Walrus_Event')

from app.core.walrus import walrus_storage
from app.services.blockchain_anchor import blockchain_anchor_service


async def test_basic_integration():
    """测试基本集成功能"""
    
    print("=" * 60)
    print("Walrus & Sui Integration Test")
    print("=" * 60)
    
    # 1. 测试Sui钱包信息
    print("\n1. Testing Sui Wallet Info...")
    try:
        wallet_info = blockchain_anchor_service.get_wallet_info()
        print(f"   ✓ Wallet Address: {wallet_info.get('address', 'Not configured')}")
        print(f"   ✓ Network: {wallet_info['network']}")
        print(f"   ✓ Balance: {wallet_info.get('balance_sui', 0)} SUI")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 2. 测试数据哈希生成
    print("\n2. Testing Data Hash Generation...")
    try:
        test_data = {"title": "Test Event", "description": "测试"}
        data_hash = blockchain_anchor_service._generate_data_hash(test_data)
        print(f"   ✓ Generated Hash: {data_hash[:32]}...")
        print(f"   ✓ Hash Length: {len(data_hash)} (SHA256)")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 3. 测试Walrus存储配置
    print("\n3. Testing Walrus Storage Config...")
    try:
        print(f"   ✓ Publisher URL: {walrus_storage.publisher_url}")
        print(f"   ✓ Aggregator URL: {walrus_storage.aggregator_url}")
        print(f"   ✓ API Token: {'Configured' if walrus_storage.api_token else 'Not set'}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 4. 测试Walrus存储（需要网络连接）
    print("\n4. Testing Walrus Storage (requires network)...")
    try:
        test_upload_data = {
            "event_id": "test_001",
            "title": "Integration Test Event",
            "timestamp": "2025-11-23T14:00:00Z"
        }
        
        print("   Attempting to upload to Walrus...")
        blob_id = await walrus_storage.store_data(test_upload_data, encrypt=False)
        print(f"   ✓ Upload successful! Blob ID: {blob_id}")
        
        # 尝试检索
        print("   Attempting to retrieve from Walrus...")
        retrieved_data = await walrus_storage.retrieve_data(blob_id, decrypt=False)
        print(f"   ✓ Retrieval successful!")
        print(f"   ✓ Data matches: {retrieved_data == test_upload_data}")
        
    except Exception as e:
        print(f"   ✗ Error (expected if no network/credentials): {e}")
    
    print("\n" + "=" * 60)
    print("Integration Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_basic_integration())
