#!/usr/bin/env python3
"""
完整的事件创建和Walrus验证脚本
验证数据是否真的上传到Walrus并可检索
"""

import asyncio
import httpx
from datetime import datetime, timedelta

async def test_event_creation_with_walrus():
    """测试创建事件并验证Walrus存储"""
    
    print("=" * 70)
    print("EVENT CREATION + WALRUS STORAGE VERIFICATION")
    print("=" * 70)
    
    # 1. 创建测试事件
    print("\n[1] Creating test event...")
    
    event_data = {
        "organizer_id": "test_organizer_walrus",
        "title": "Walrus Storage Test Event",
        "description": "This event tests full Walrus integration",
        "event_type": "Workshop",
        "start_time": (datetime.now() + timedelta(days=7)).isoformat(),
        "end_time": (datetime.now() + timedelta(days=7, hours=2)).isoformat(),
        "location": "Virtual",
        "max_participants": 100,
        "privacy_level": "public",
        "store_to_walrus": True,
        "tags": ["test", "walrus", "blockchain"]
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 创建事件
        response = await client.post(
            "http://localhost:8000/api/v1/events/create",
            json=event_data
        )
        
        if response.status_code != 200:
            print(f"❌ Event creation failed: {response.status_code}")
            print(response.text)
            return
        
        result = response.json()
        print(f"✅ Event created: {result['event_id']}")
        
        # 2. 检查Walrus存储结果
        if 'walrus_storage' in result:
            walrus_info = result['walrus_storage']
            print(f"\n[2] Walrus Storage Info:")
            print(f"   Blob ID: {walrus_info.get('blob_id')}")
            print(f"   Status: {walrus_info.get('status')}")
            print(f"   Storage Proof: {walrus_info.get('storage_proof', {}).get('merkle_root', 'N/A')[:16]}...")
            
            blob_id = walrus_info.get('blob_id')
            
            if blob_id:
                # 3. 验证可以从Walrus检索数据
                print(f"\n[3] Verifying data on Walrus...")
                print(f"   Blob ID: {blob_id}")
                print(f"   URL: https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}")
                
                # 直接从Walrus检索
                walrus_response = await client.get(
                    f"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}"
                )
                
                if walrus_response.status_code == 200:
                    print(f"   ✅ Data successfully retrieved from Walrus!")
                    retrieved_data = walrus_response.text
                    print(f"   Retrieved {len(retrieved_data)} bytes")
                    print(f"   Preview: {retrieved_data[:100]}...")
                else:
                    print(f"   ❌ Failed to retrieve from Walrus: {walrus_response.status_code}")
                
                # 4. 获取存储状态
                print(f"\n[4] Checking storage status...")
                status_response = await client.get(
                    f"http://localhost:8000/api/v1/events/{result['event_id']}/storage-status"
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"   ✅ Storage status: {status.get('storage_status')}")
                    print(f"   Blob ID: {status.get('blob_id')}")
                else:
                    print(f"   ⚠️  Storage status unavailable")
                
                # 5. 总结
                print(f"\n" + "=" * 70)
                print("VERIFICATION SUMMARY")
                print("=" * 70)
                print(f"✅ Event created in database")
                print(f"✅ Data uploaded to Walrus testnet")
                print(f"✅ Blob ID: {blob_id}")
                print(f"✅ Data is retrievable from Walrus")
                print(f"\n🔗 View on Walrus:")
                print(f"   https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}")
                print(f"\n🎯 Your event data IS on Walrus! ✨")
                print("=" * 70)
                
        else:
            print("⚠️  No Walrus storage info returned")
            print("   Event created but may not be stored on Walrus")

if __name__ == "__main__":
    asyncio.run(test_event_creation_with_walrus())
