#!/usr/bin/env python3
"""
Walrus Events - 快速API测试脚本
一键测试所有核心API接口
"""

import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"
def test_endpoint(name, method, endpoint, data=None, params=None):
    """测试API端点"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, json=data, params=params)
        elif method == "DELETE":
            response = requests.delete(url, params=params)
        else:
            return False, "不支持的方法"

        if response.status_code in [200, 201]:
            print(f"✅ {name}: 成功")
            if response.text:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            return True, "成功"
        else:
            print(f"❌ {name}: 失败 (状态码 {response.status_code})")
            return False, response.text
    except Exception as e:
        print(f"❌ {name}: 错误 - {str(e)}")
        return False, str(e)

def main():
    """主测试流程"""
    print("="*70)
    print("Walrus Events - API快速测试")
    print("="*70)
    print()

    # 1. 健康检查
    print("1. 系统健康检查")
    print("-" * 70)
    success, result = test_endpoint("健康检查", "GET", "/health")
    if not success:
        print("\n⚠️  服务未启动，请先运行: uvicorn main:app --reload --port 8000")
        return
    print()

    # 2. 注册
    print("2. 注册组织者和参与者")
    print("-" * 70)
    test_endpoint("注册组织者", "POST", "/events/organizer/register",
                  params={"organizer_id": "alice"})
    test_endpoint("注册用户Bob", "POST", "/events/participant/register",
                  params={"user_id": "bob"})
    test_endpoint("注册用户Charlie", "POST", "/events/participant/register",
                  params={"user_id": "charlie"})
    print()

    # 3. 创建活动
    print("3. 创建加密活动")
    print("-" * 70)
    event_time = datetime.now() + timedelta(days=7)
    event_data = {
        "organizer_id": "alice",
        "title": "Web3 Privacy Meetup",
        "description": "探讨Web3时代的隐私保护技术",
        "event_type": "Web3",
        "start_time": event_time.isoformat(),
        "end_time": (event_time + timedelta(hours=3)).isoformat(),
        "location": "Decentraland",
        "max_participants": 50
    }
    success, event_result = test_endpoint("创建活动", "POST", "/events/create", data=event_data)
    event_id = event_result.get("event_id", "demo_event_123") if success else "demo_event_123"
    print(f"   活动ID: {event_id}")
    print()

    # 4. 添加参与者
    print("4. 添加参与者")
    print("-" * 70)
    test_endpoint("添加Bob到活动", "POST", f"/events/{event_id}/participants/add",
                  params={"event_id": event_id, "user_id": "bob"})
    test_endpoint("添加Charlie到活动", "POST", f"/events/{event_id}/participants/add",
                  params={"event_id": event_id, "user_id": "charlie"})
    print()

    # 5. 加密活动
    print("5. 端到端加密")
    print("-" * 70)
    test_endpoint("加密活动数据", "POST", f"/events/{event_id}/encrypt",
                  params={"event_id": event_id})
    print()

    # 6. 门票NFT
    print("6. 铸造门票NFT")
    print("-" * 70)
    test_endpoint("为Bob铸造门票", "POST", f"/events/{event_id}/tickets/mint",
                  params={"event_id": event_id, "user_id": "bob", "ticket_type": "paid", "price": 50.0})
    print()

    # 7. ZK证明
    print("7. 零知识证明演示")
    print("-" * 70)
    test_endpoint("生成匿名ZK证明", "POST", f"/events/{event_id}/tickets/verify-zk",
                  params={"event_id": event_id, "user_id": "bob", "verification_mode": "anonymous"})
    print()

    # 8. 信誉系统
    print("8. 信誉系统")
    print("-" * 70)
    # 记录参会历史
    for i in range(5):
        test_endpoint(f"记录Bob参会{i+1}", "POST", f"/events/{event_id}/reputation/record",
                      params={"user_id": "bob", "event_id": f"event_{i}", "event_type": "Web3"})

    test_endpoint("查询Bob信誉", "GET", f"/events/bob/reputation")
    print()

    # 9. 差分隐私统计
    print("9. 差分隐私聚合统计")
    print("-" * 70)
    test_endpoint("信誉统计(加噪)", "GET", "/events/reputation/stats")
    print()

    # 10. 被遗忘权
    print("10. GDPR被遗忘权演示")
    print("-" * 70)
    test_endpoint("删除活动", "DELETE", f"/events/{event_id}",
                  params={"event_id": event_id, "organizer_id": "alice"})
    print()

    print("="*70)
    print("✅ API快速测试完成！")
    print("="*70)
    print()
    print("📊 测试总结:")
    print("   • 事件管理：创建、加密、添加参与者")
    print("   • ZK门票：铸造、证明生成")
    print("   • 信誉系统：记录参会、状态查询")
    print("   • 隐私保护：差分隐私统计")
    print("   • 数据主权：GDPR删除演示")
    print()
    print("🚀 接下来可以运行完整Demo：")
    print("   python demo_walrus_events.py")
    print()

if __name__ == "__main__":
    main()
