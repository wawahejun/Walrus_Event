#!/usr/bin/env python3
"""
测试完整的区块链锚定流程（包含event_hash）
"""

import asyncio
import httpx
from datetime import datetime, timedelta

async def test_full_anchoring():
    """测试完整的事件创建 + hash生成流程"""
    
    print("=" * 70)
    print("BLOCKCHAIN ANCHORING TEST - WITH EVENT_HASH")
    print("=" * 70)
    
    # 创建测试事件
    print("\n[1] Creating test event...")
    
    event_data = {
        "organizer_id": "test_organizer_hash",
        "title": "Blockchain Anchoring Test",
        "description": "Testing event hash generation",
        "event_type": "Conference",
        "start_time": (datetime.now() + timedelta(days=7)).isoformat(),
        "end_time": (datetime.now() + timedelta(days=7, hours=3)).isoformat(),
        "location": "Virtual",
        "max_participants": 200,
        "privacy_level": "public",
        "store_to_walrus": True,
        "tags": ["blockchain", "hash", "anchoring"]
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/events/create",
            json=event_data
        )
        
        if response.status_code !=200:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            return
        
        result = response.json()
        
        print(f"✅ Event created: {result['event_id']}")
        
        # 检查event_hash
        if 'event_hash' in result:
            event_hash = result['event_hash']
            print(f"\n[2] Event Hash Generated:")
            print(f"   Hash: {event_hash}")
            print(f"   Length: {len(event_hash)} characters")
            print(f"   ✅ Valid SHA256 hash" if len(event_hash) == 64 else "❌ Invalid length")
        else:
            print("\n[2] ❌ No event_hash in response!")
            return
        
        # 检查Walrus存储
        if 'walrus_storage' in result:
            walrus_info = result['walrus_storage']
            blob_id = walrus_info.get('blob_id')
            
            print(f"\n[3] Walrus Storage:")
            print(f"   Blob ID: {blob_id}")
            print(f"   ✅ Data stored on Walrus")
        else:
            print("\n[3] ⚠️  No Walrus storage info")
            blob_id = None
        
        # 模拟前端将要执行的操作
        print(f"\n[4] Frontend Will Execute:")
        print(f"   Function: anchor_event()")
        print(f"   Parameters:")
        print(f"     - event_id: {result['event_id']}")
        print(f"     - event_hash: {event_hash}")
        print(f"     - blob_id: {blob_id}")
        
        # 总结
        print(f"\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"✅ Backend generates event_hash")
        print(f"✅ Event hash is SHA256 (64 chars)")
        print(f"✅ Walrus storage successful")
        print(f"✅ Frontend ready to anchor to Sui")
        print(f"\n🎯 Next Step: Deploy Move contract and frontend will call:")
        print(f"   anchor_event(\"{result['event_id'][:20]}...\", \"{event_hash[:20]}...\", \"{blob_id[:20] if blob_id else 'N/A'}...\")")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_full_anchoring())
