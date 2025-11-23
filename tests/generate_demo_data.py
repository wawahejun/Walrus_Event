"""
测试数据生成脚本
为演示添加示例活动数据
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime,timedelta
from app.services.event_manager import event_manager

def generate_demo_events():
    """生成演示用活动数据"""
    
    # 注册组织者
    organizers = [
        "0x1234...5678",
        "0xabcd...ef01",
        "0x9876...5432"
    ]
    
    for org in organizers:
        event_manager.register_organizer(org)
    
    # 创建示例活动
    demo_events = [
        {
            "organizer_id": organizers[0],
            "title": "Web3 Privacy Summit 2024",
            "description": "Explore cutting-edge privacy technologies in Web3. Join industry leaders discussing zero-knowledge proofs, decentralized identity,  and privacy-preserving computation.",
            "event_type": "Conference",
            "start_time": datetime.now() + timedelta(days=5),
            "end_time": datetime.now() + timedelta(days=5, hours=8),
            "location": "San Francisco, CA",
            "max_participants": 500
        },
        {
            "organizer_id": organizers[1],
            "title": "Sui Developer Workshop",
            "description": "Hands-on workshop for building dApps on Sui blockchain. Learn Move programming and build your first NFT project.",
            "event_type": "Workshop",
            "start_time": datetime.now() + timedelta(days=12),
            "end_time": datetime.now() + timedelta(days=12, hours=4),
            "location": "Virtual",
            "max_participants": 100
        },
        {
            "organizer_id": organizers[0],
            "title": "ZK-SNARK Fundamentals Seminar",
            "description": "Deep dive into zero-knowledge cryptography. Understanding circuit design, proof generation, and verification.",
            "event_type": "Seminar",
            "start_time": datetime.now() + timedelta(days=18),
            "end_time": datetime.now() + timedelta(days=18, hours=3),
            "location": "Stanford University",
            "max_participants": 80
        },
        {
            "organizer_id": organizers[2],
            "title": "Decentralized Storage Hackathon",
            "description": "Build the future of Web3 storage with Walrus! 48-hour hackathon with prizes totaling $50k.",
            "event_type": "Hackathon",
            "start_time": datetime.now() + timedelta(days=24),
            "end_time": datetime.now() + timedelta(days=26),
            "location": "Virtual",
            "max_participants": 200
        },
        {
            "organizer_id": organizers[1],
            "title": "DeFi Security Best Practices",
            "description": "Learn how to secure smart contracts and prevent common vulnerabilities in DeFi protocols.",
            "event_type": "Workshop",
            "start_time": datetime.now() + timedelta(days=7),
            "end_time": datetime.now() + timedelta(days=7, hours=6),
            "location": "New York, NY",
            "max_participants": 60
        },
        {
            "organizer_id": organizers[0],
            "title": "NFT Art Gallery Opening",
            "description": "Exclusive opening of the first privacy-preserving NFT art gallery. View and bid on rare digital art pieces.",
            "event_type": "Social",
            "start_time": datetime.now() + timedelta(days=15),
            "end_time": datetime.now() + timedelta(days=15, hours=5),
            "location": "Miami, FL",
            "max_participants": 150
        },
        {
            "organizer_id": organizers[2],
            "title": "DAO Governance Workshop",
            "description": "Learn how to participate in decentralized governance and make your voice heard in Web3 communities.",
            "event_type": "Workshop",
            "start_time": datetime.now() + timedelta(days=30),
            "end_time": datetime.now() + timedelta(days=30, hours=4),
            "location": "Virtual",
            "max_participants": 120
        }
    ]
    
    created_events = []
    for event_data in demo_events:
        event = event_manager.create_event(**event_data)
        created_events.append(event)
        print(f"✅ Created event: {event.title} ({event.event_id})")
    
    # 为一些活动添加参与者
    demo_participants = [
        f"user_{i}" for i in range(1, 21)
    ]
    
    for participant_id in demo_participants:
        event_manager.register_participant(participant_id)
    
    # 随机添加参与者到活动
    import random
    for event in created_events[:4]:  # 前4个活动
        num_participants = random.randint(10, 50)
        selected_participants = random.sample(demo_participants, num_participants)
        for participant_id in selected_participants:
            event_manager.add_participant(event.event_id, participant_id)
        print(f"   Added {num_participants} participants to {event.title}")
    
    print(f"\n🎉 Generated {len(created_events)} demo events")
    print(f"📊 Total events in system: {len(event_manager.events)}")
    return created_events

if __name__ == "__main__":
    generate_demo_events()
