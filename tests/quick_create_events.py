"""
快速创建演示数据的脚本
"""
import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def create_demo_events():
    """创建演示活动"""
    
    events = [
        {
            "organizer_id": "0x1234567890abcdef",
            "title": "Web3 Privacy Summit 2024",
            "description": "Explore cutting-edge privacy technologies in Web3",
            "event_type": "Conference",
            "start_time": (datetime.now() + timedelta(days=5)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=5, hours=8)).isoformat(),
            "location": "San Francisco, CA",
            "max_participants": 500,
            "privacy_level": "public",
            "store_to_walrus": True
        },
        {
            "organizer_id": "0xfedcba0987654321",
            "title": "Sui Developer Workshop",
            "description": "Hands-on workshop for building dApps on Sui",
            "event_type": "Workshop",
            "start_time": (datetime.now() + timedelta(days=12)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=12, hours=4)).isoformat(),
            "location": "Virtual",
            "max_participants": 100,
            "privacy_level": "hybrid",
            "store_to_walrus": True
        },
        {
            "organizer_id": "0xabcdef1234567890",
            "title": "ZK-SNARK Fundamentals",
            "description": "Deep dive into zero-knowledge cryptography",
            "event_type": "Seminar",
            "start_time": (datetime.now() + timedelta(days=18)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=18, hours=3)).isoformat(),
            "location": "Stanford University",
            "max_participants": 80,
            "privacy_level": "zk-private",
            "store_to_walrus": True
        }
    ]
    
    print("Creating demo events...")
    for event_data in events:
        try:
            response = requests.post(f"{BASE_URL}/events/create", json=event_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Created: {event_data['title']}")
                print(f"   Event ID: {result['event_id']}")
                if 'walrus_storage' in result:
                    print(f"   Blob ID: {result['walrus_storage']['blob_id']}")
            else:
                print(f"❌ Failed: {event_data['title']} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating {event_data['title']}: {e}")
    
    print("\n Testing API endpoints...")
    
    # Test list events
    response = requests.get(f"{BASE_URL}/events?limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET /events - Found {data['total']} events")
    
    # Test trending
    response = requests.get(f"{BASE_URL}/events/trending")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET /events/trending - {data['count']} events")
    
    # Test calendar
    now = datetime.now()
    response = requests.get(f"{BASE_URL}/events/calendar?year={now.year}&month={now.month}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET /events/calendar - {len(data.get('days_with_events', []))} days with events")

if __name__ == "__main__":
    create_demo_events()
