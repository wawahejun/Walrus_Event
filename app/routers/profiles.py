"""
用户资料API路由
Profiles - 用户数据和统计
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.event_manager import event_manager
from app.services.reputation_system import reputation_system
from app.services.ticket_system import zk_ticket_system

router = APIRouter()


@router.get("/{wallet_address}/profile")
async def get_user_profile(wallet_address: str):
    """
    获取用户资料（基于钱包地址）
    
    Args:
        wallet_address: Sui钱包地址
    """
    try:
        # 获取用户信誉信息
        reputation_data = None
        if wallet_address in reputation_system.credentials:
            credential = reputation_system.credentials[wallet_address]
            reputation_data = {
                "reputation_state": credential.reputation_state,
                "attendance_count": credential.attendance_count,
                "reputation_score": credential.calculate_reputation_score(),
                "current_state_name": ["Newbie", "Active", "Core Contributor"][credential.reputation_state]
            }
        else:
            # 默认新用户
            reputation_data = {
                "reputation_state": 0,
                "attendance_count": 0,
                "reputation_score": 0,
                "current_state_name": "Newbie"
            }
        
        # 统计用户创建的活动
        created_events = [
            e for e in event_manager.events.values() 
            if e.organizer_id == wallet_address
        ]
        
        # 统计参加的活动
        joined_events = [
            e for e in event_manager.events.values()
            if wallet_address in e.participants
        ]
        
        return {
            "status": "success",
            "profile": {
                "wallet_address": wallet_address,
                "reputation": reputation_data,
                "events_created": len(created_events),
                "events_joined": len(joined_events),
                "total_events": len(created_events) + len(joined_events)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{wallet_address}/statistics")
async def get_user_statistics(wallet_address: str):
    """
    获取用户统计数据
    
    Args:
        wallet_address: Sui钱包地址
    """
    try:
        # 模拟统计数据（实际应该从链上或数据库获取）
        stats = {
            "storage_used_gb": 4.2,
            "storage_used_bytes": 4.2 * 1024 * 1024 * 1024,
            "zk_proofs_generated": 1024,
            "authenticated_apps": 12,
            "right_to_be_forgotten_active": True,
            "walrus_blobs": 127,
            "sui_transactions": 340
        }
        
        # 获取实际的活动参与数据
        joined_events = [
            e for e in event_manager.events.values()
            if wallet_address in e.participants
        ]
        stats["events_attended"] = len(joined_events)
        
        created_events = [
            e for e in event_manager.events.values()
            if e.organizer_id == wallet_address
        ]
        stats["events_organized"] = len(created_events)
        
        return {
            "status": "success",
            "statistics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{wallet_address}/events-calendar")
async def get_user_calendar(
    wallet_address: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12)
):
    """
    获取用户活动日历
    
    Args:
        wallet_address: Sui钱包地址
        year: 年份
        month: 月份
    """
    try:
        # 获取用户创建和参加的所有活动
        user_events = []
        
        for event in event_manager.events.values():
            is_organizer = event.organizer_id == wallet_address
            is_participant = wallet_address in event.participants
            
            if is_organizer or is_participant:
                event_date = event.start_time
                if event_date.year == year and event_date.month == month:
                    user_events.append({
                        "event_id": event.event_id,
                        "title": event.title,
                        "event_type": event.event_type,
                        "start_time": event.start_time.isoformat(),
                        "role": "organizer" if is_organizer else "participant",
                        "day": event_date.day
                    })
        
        # 按日期分组
        calendar_events = {}
        for event in user_events:
            day = event["day"]
            if day not in calendar_events:
                calendar_events[day] = []
            calendar_events[day].append(event)
        
        return {
            "status": "success",
            "year": year,
            "month": month,
            "days_with_events": list(calendar_events.keys()),
            "events_by_day": calendar_events,
            "total_events": len(user_events)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/tickets")
async def get_user_tickets(user_id: str):
    """
    获取用户的所有门票
    
    Args:
        user_id: 用户ID
    """
    try:
        # 获取用户的所有门票
        user_tickets = []
        
        for ticket_id, ticket in zk_ticket_system.tickets.items():
            if ticket.user_id == user_id:
                # 获取活动信息
                event = event_manager.events.get(ticket.event_id)
                
                ticket_data = ticket.to_dict()
                if event:
                    ticket_data["event_title"] = event.title
                    ticket_data["event_start_time"] = event.start_time.isoformat()
                    ticket_data["event_location"] = event.location
                
                user_tickets.append(ticket_data)
        
        return {
            "status": "success",
            "count": len(user_tickets),
            "tickets": user_tickets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
