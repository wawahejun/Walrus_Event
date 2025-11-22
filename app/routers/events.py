"""
事件管理API路由
EventForge - ZK活动平台
"""

from fastapi import APIRouter, HTTPException, Query, Depends, File, UploadFile
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid
from pathlib import Path

from app.services.event_manager import event_manager
from app.services.ticket_system import zk_ticket_system, TicketType, VerificationMode
from app.services.reputation_system import reputation_system
from app.core.postgres import get_db

router = APIRouter(tags=["events"])

# 图片上传目录
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploaded_images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/demo/modules")
async def get_demo_modules():
    """
    获取所有可用的demo模块列表
    """
    modules = [
        {
            "id": "1",
            "title": "EventForge",
            "description": "端到端加密的用户主权活动平台",
            "subtitle": "EventForge - 端到端加密的用户主权活动平台",
            "category": "event",
            "color": "from-neon-blue to-neon-purple",
            "endpoint": "/api/v1/events/create",
            "methods": ["POST", "GET", "DELETE"],
            "features": ["端到端加密", "用户主权", "活动创建", "隐私保护"]
        },
        {
            "id": "2",
            "title": "zk-Attend",
            "description": "零知识证明的隐私保护参会系统",
            "subtitle": "zk-Attend - 零知识证明的隐私保护参会系统",
            "category": "attendance",
            "color": "from-neon-purple to-neon-pink",
            "endpoint": "/api/v1/events/{event_id}/tickets/verify-zk",
            "methods": ["POST"],
            "features": ["零知识证明", "匿名参会", "链上验证", "隐私保护"]
        },
        {
            "id": "3",
            "title": "V-Reputation",
            "description": "马尔可夫链 + 差分隐私的信誉系统",
            "subtitle": "马尔可夫链 + 差分隐私 + ZK证明 = 智能信誉评级",
            "category": "reputation",
            "color": "from-neon-green to-neon-blue",
            "endpoint": "/api/v1/events/{user_id}/reputation",
            "methods": ["GET", "POST"],
            "features": ["马尔可夫链", "差分隐私", "信誉系统", "可验证性"]
        },
        {
            "id": "4",
            "title": "Private Discovery",
            "description": "无数据收集的联邦学习推荐",
            "subtitle": "Private Discovery - 联邦学习 + 差分隐私 + ZK匹配",
            "category": "recommendation",
            "color": "from-neon-yellow to-neon-green",
            "endpoint": "/api/v1/recommendations",
            "methods": ["GET", "POST"],
            "features": ["联邦学习", "无数据收集", "智能推荐", "隐私保护"]
        },
        {
            "id": "5",
            "title": "Right to be Forgotten",
            "description": "GDPR合规的数据删除机制",
            "subtitle": "被遗忘权 - 可验证的数据删除机制",
            "category": "privacy",
            "color": "from-neon-pink to-neon-purple",
            "endpoint": "/api/v1/events/{event_id}",
            "methods": ["DELETE", "GET"],
            "features": ["GDPR合规", "数据删除", "隐私权利", "用户控制"]
        }
    ]

    return {
        "status": "success",
        "modules": modules
    }


@router.get("/demo/modules/{module_id}")
async def get_demo_module(module_id: str):
    """
    获取特定demo模块的详细信息
    """
    modules = {
        "1": {
            "id": "1",
            "title": "EventForge",
            "description": "端到端加密的用户主权活动平台",
            "subtitle": "EventForge - 端到端加密的用户主权活动平台",
            "category": "event",
            "color": "from-neon-blue to-neon-purple",
            "endpoint": "/api/v1/events/create",
            "methods": ["POST", "GET", "DELETE"],
            "features": ["端到端加密", "用户主权", "活动创建", "隐私保护"],
            "demo_data": {
                "organizer_id": "demo_organizer_1",
                "title": "Web3 Privacy Summit 2024",
                "description": "探索Web3时代的隐私保护技术",
                "event_type": "conference",
                "max_participants": 500
            }
        },
        "2": {
            "id": "2",
            "title": "zk-Attend",
            "description": "零知识证明的隐私保护参会系统",
            "subtitle": "zk-Attend - 零知识证明的隐私保护参会系统",
            "category": "attendance",
            "color": "from-neon-purple to-neon-pink",
            "endpoint": "/api/v1/events/{event_id}/tickets/verify-zk",
            "methods": ["POST"],
            "features": ["零知识证明", "匿名参会", "链上验证", "隐私保护"],
            "demo_data": {
                "event_id": "event_123",
                "user_id": "user_456",
                "verification_mode": "anonymous"
            }
        },
        "3": {
            "id": "3",
            "title": "V-Reputation",
            "description": "马尔可夫链 + 差分隐私的信誉系统",
            "subtitle": "马尔可夫链 + 差分隐私 + ZK证明 = 智能信誉评级",
            "category": "reputation",
            "color": "from-neon-green to-neon-blue",
            "endpoint": "/api/v1/events/{user_id}/reputation",
            "methods": ["GET", "POST"],
            "features": ["马尔可夫链", "差分隐私", "信誉系统", "可验证性"],
            "demo_data": {
                "user_id": "demo_user",
                "event_id": "event_123",
                "event_type": "conference"
            }
        }
    }

    if module_id not in modules:
        raise HTTPException(status_code=404, detail="Demo module not found")

    return {
        "status": "success",
        "module": modules[module_id]
    }


@router.get("")
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取活动列表（分页、过滤）
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        event_type: 活动类型过滤
        search: 搜索关键词
    """
    try:
        # Get all events from database
        all_events = await event_manager.list_events(db, limit=1000)
        
        # 过滤
        if event_type:
            all_events = [e for e in all_events if e.event_type == event_type]
        
        if search:
            search_lower = search.lower()
            all_events = [
                e for e in all_events 
                if search_lower in e.title.lower() or search_lower in e.description.lower()
            ]
        
        # 按创建时间排序（最新的在前）
        all_events.sort(key=lambda x: x.created_at, reverse=True)
        
        # 分页
        paginated_events = all_events[skip:skip + limit]
        
        # 构建响应
        events_data = []
        for event in paginated_events:
            events_data.append({
                "event_id": event.event_id,
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "location": event.location,
                "participants_count": 0,  # TODO: Implement participant tracking
                "max_participants": event.max_participants,
                "created_at": event.created_at.isoformat(),
                "cover_image": event.cover_image,
                "cover_image_path": event.cover_image_path,
                "tags": event.tags or []
            })
        
        return {
            "status": "success",
            "total": len(all_events),
            "skip": skip,
            "limit": limit,
            "events": events_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending")
async def get_trending_events(limit: int = Query(10, ge=1, le=50)):
    """
    获取热门活动（按参与者数量排序）
    
    Args:
        limit: 返回的最大记录数
    """
    try:
        all_events = list(event_manager.events.values())
        
        # 按参与者数量排序
        all_events.sort(key=lambda x: len(x.participants), reverse=True)
        
        trending_events = all_events[:limit]
        
        events_data = []
        for event in trending_events:
            events_data.append({
                "event_id": event.event_id,
                "title": event.title,
                "description": event.description[:200],  # 限制描述长度
                "event_type": event.event_type,
                "participants_count": len(event.participants),
                "max_participants": event.max_participants,
                "start_time": event.start_time.isoformat(),
                "trending_score": len(event.participants)  # 简单的热度分数
            })
        
        return {
            "status": "success",
            "count": len(events_data),
            "events": events_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/new")
async def get_new_events(limit: int = Query(10, ge=1, le=50)):
    """
    获取最新活动（按创建时间排序）
    
    Args:
        limit: 返回的最大记录数
    """
    try:
        all_events = list(event_manager.events.values())
        
        # 按创建时间排序
        all_events.sort(key=lambda x: x.created_at, reverse=True)
        
        new_events = all_events[:limit]
        
        events_data = []
        for event in new_events:
            events_data.append({
                "event_id": event.event_id,
                "title": event.title,
                "description": event.description[:200],
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "location": event.location,
                "created_at": event.created_at.isoformat(),
                "is_new": True
            })
        
        return {
            "status": "success",
            "count": len(events_data),
            "events": events_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_calendar_events(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12)
):
    """
    获取日历活动（按年月查询）
    
    Args:
        year: 年份
        month: 月份 (1-12)
    """
    try:
        all_events = list(event_manager.events.values())
        
        # 过滤指定月份的活动
        calendar_events = {}
        
        for event in all_events:
            event_date = event.start_time
            if event_date.year == year and event_date.month == month:
                day = event_date.day
                if day not in calendar_events:
                    calendar_events[day] = []
                
                calendar_events[day].append({
                    "event_id": event.event_id,
                    "title": event.title,
                    "event_type": event.event_type,
                    "start_time": event.start_time.isoformat()
                })
        
        return {
            "status": "success",
            "year": year,
            "month": month,
            "days_with_events": list(calendar_events.keys()),
            "events_by_day": calendar_events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}")
async def get_event_detail(event_id: str, db: AsyncSession = Depends(get_db)):
    """
    获取活动详情
    """
    try:
        event = await event_manager.get_event(db, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        return {
            "status": "success",
            "event": {
                "event_id": event.event_id,
                "organizer_id": event.organizer_id,
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "location": event.location,
                "max_participants": event.max_participants,
                "current_participants": 0, # TODO
                "is_encrypted": False,
                "storage_commitment": None,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat(),
                "cover_image": event.cover_image
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/organizer/register")
async def register_organizer(organizer_id: str):
    """
    注册活动组织者

    Args:
        organizer_id: 组织者ID
    """
    try:
        result = event_manager.register_organizer(organizer_id)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/participant/register")
async def register_participant(user_id: str):
    """
    注册参与者

    Args:
        user_id: 用户ID
    """
    try:
        result = event_manager.register_participant(user_id)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



from pydantic import BaseModel, Field

class CreateEventRequest(BaseModel):
    organizer_id: str
    title: str
    description: str
    event_type: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    max_participants: int = Field(default=100, ge=1, le=10000)
    privacy_level: str = Field(default="public", pattern="^(public|hybrid|zk-private)$")
    store_to_walrus: bool = True
    cover_image: Optional[str] = None
    cover_image_path: Optional[str] = None
    tags: Optional[List[str]] = None


class UpdateEventRequest(BaseModel):
    organizer_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    privacy_level: Optional[str] = None
    cover_image: Optional[str] = None
    cover_image_path: Optional[str] = None
    tags: Optional[List[str]] = None


@router.post("/create")
async def create_event(request: CreateEventRequest, db: AsyncSession = Depends(get_db)):
    """
    创建新活动（支持隐私级别和Walrus存储）

    Args:
        request: 活动创建请求
    """
    try:
        from app.services.walrus_storage import walrus_event_storage
        
        # 创建活动
        event = await event_manager.create_event(
            db=db,
            organizer_id=request.organizer_id,
            title=request.title,
            description=request.description,
            event_type=request.event_type,
            start_time=request.start_time,
            end_time=request.end_time,
            location=request.location,
            max_participants=request.max_participants,
            cover_image=request.cover_image,
            cover_image_path=request.cover_image_path,
            tags=request.tags,
        )
        
        response = {
            "status": "success",
            "event_id": event.event_id,
            "event": {
                "organizer_id": event.organizer_id,
                "title": event.title,
                "event_type": event.event_type,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "max_participants": event.max_participants,
                "privacy_level": request.privacy_level,
                "cover_image": event.cover_image,
                "cover_image_path": event.cover_image_path,
                "tags": event.tags or [],
            }
        }
        
        # 如果需要存储到Walrus
        if request.store_to_walrus:
            # 准备存储数据
            event_data = {
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "location": event.location,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat(),
                "cover_image": event.cover_image,
                "cover_image_path": event.cover_image_path,
                "tags": event.tags or [],
            }
            
            # 上传到Walrus
            storage_result = await walrus_event_storage.upload_event_data(
                event_id=event.event_id,
                event_data=event_data,
                privacy_level=request.privacy_level
            )
            
            response["walrus_storage"] = storage_result

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/{event_id}/storage-status")
async def get_event_storage_status(event_id: str):
    """
    获取活动的Walrus存储状态
    
    Args:
        event_id: 活动ID
    """
    try:
        from app.services.walrus_storage import walrus_event_storage
        
        status = await walrus_event_storage.get_storage_status(event_id)
        return {
            "status": "success",
            "event_id": event_id,
            **status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/storage/verify/{blob_id}")
async def verify_blob_storage(blob_id: str):
    """
    验证Walrus存储的完整性
    
    Args:
        blob_id: Blob ID
    """
    try:
        from app.services.walrus_storage import walrus_event_storage
        
        verification = await walrus_event_storage.verify_storage(blob_id)
        return {
            "status": "success",
            **verification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/storage/metadata/{blob_id}")
async def get_blob_metadata(blob_id: str):
    """
    获取Blob元数据
    
    Args:
        blob_id: Blob ID
    """
    try:
        from app.services.walrus_storage import walrus_event_storage
        
        metadata = await walrus_event_storage.get_blob_metadata(blob_id)
        return {
            "status": "success",
            **metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/encrypt")
async def encrypt_event(event_id: str):
    """
    加密活动数据（端到端加密）

    Args:
        event_id: 活动ID
    """
    try:
        result = event_manager.encrypt_event(event_id)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/{event_id}/participants/add")
async def add_participant(event_id: str, user_id: str):
    """
    添加参与者

    Args:
        event_id: 活动ID
        user_id: 用户ID
    """
    try:
        success = event_manager.add_participant(event_id, user_id)
        return {
            "status": "success",
            "event_id": event_id,
            "user_id": user_id,
            "added": success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/decrypt")
async def decrypt_event(event_id: str, user_id: str):
    """
    解密活动数据（授权用户）

    Args:
        event_id: 活动ID
        user_id: 用户ID
    """
    try:
        # 获取活动的存储数据（模拟）
        storage_data = {
            "event_id": event_id,
            "organizer_id": "demo_organizer",
            "encrypted_versions": {}
        }

        result = event_manager.decrypt_event(event_id, user_id, storage_data)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/summary")
async def get_event_summary(event_id: str):
    """
    获取活动摘要（公开信息）

    Args:
        event_id: 活动ID
    """
    try:
        result = event_manager.get_event_summary(event_id)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    request: UpdateEventRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    更新活动（支持部分更新）

    Args:
        event_id: 活动ID
        request: 更新请求
    """
    try:
        from app.services.walrus_storage import walrus_event_storage
        from app.models.events import Event

        # 获取现有活动
        existing_event = await event_manager.get_event(db, event_id)
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")

        # 更新字段
        update_data = request.dict(exclude_unset=True, exclude_none=True)

        # 转换为SQLAlchemy模型的update语句
        from sqlalchemy import update
        stmt = (
            update(Event)
            .where(Event.event_id == event_id)
            .values(**update_data)
            .returning(Event)
        )
        result = await db.execute(stmt)
        updated_event = result.scalar_one_or_none()

        if not updated_event:
            raise HTTPException(status_code=404, detail="Event not found")

        await db.commit()
        await db.refresh(updated_event)

        # 返回更新后的数据
        return {
            "status": "success",
            "event_id": event_id,
            "event": {
                "organizer_id": updated_event.organizer_id,
                "title": updated_event.title,
                "description": updated_event.description,
                "location": updated_event.location,
                "privacy_level": updated_event.privacy_level or "public",
                "cover_image": updated_event.cover_image,
                "cover_image_path": updated_event.cover_image_path,
                "tags": updated_event.tags or [],
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}")
async def delete_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """
    删除活动（被遗忘权）

    Args:
        event_id: 活动ID
    """
    try:
        # Get event first
        event = await event_manager.get_event(db, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Use the actual organizer_id from the event
        # TODO: In production, verify the user is authenticated and matches organizer_id
        result = await event_manager.delete_event(db, event_id, event.organizer_id)
        return {
            "status": "success",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/tickets/mint")
async def mint_ticket(
    event_id: str,
    user_id: str,
    ticket_type: TicketType = TicketType.FREE,
    price: float = 0.0
):
    """
    铸造门票NFT（灵魂绑定）

    Args:
        event_id: 活动ID
        user_id: 用户ID
        ticket_type: 门票类型
        price: 价格
    """
    try:
        ticket = zk_ticket_system.mint_ticket(event_id, user_id, ticket_type, price)
        return {
            "status": "success",
            "ticket": ticket.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/tickets/verify-zk")
async def verify_ticket_zk(
    event_id: str,
    user_id: str,
    verification_mode: VerificationMode = VerificationMode.ANONYMOUS
):
    """
    生成ZK门票证明

    Args:
        event_id: 活动ID
        user_id: 用户ID
        verification_mode: 验证模式
    """
    try:
        proof = zk_ticket_system.generate_zk_ticket_proof(event_id, user_id, verification_mode)
        return {
            "status": "success",
            "zk_proof": proof
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/attendance/verify")
async def verify_attendance(
    event_id: str,
    zk_proof: Dict[str, Any],
    required_mode: Optional[VerificationMode] = None
):
    """
    验证参会证明（门禁）

    Args:
        event_id: 活动ID
        zk_proof: ZK证明
        required_mode: 要求的验证模式
    """
    try:
        result = zk_ticket_system.verify_attendance(event_id, zk_proof, required_mode)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}/attendance/stats")
async def get_attendance_stats(event_id: str):
    """
    获取参会统计（差分隐私保护）

    Args:
        event_id: 活动ID
    """
    try:
        stats = zk_ticket_system.get_event_attendance_stats(event_id)
        return {
            "status": "success",
            **stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/reputation/record")
async def record_attendance_reputation(
    user_id: str,
    event_id: str,
    event_type: str
):
    """
    记录参会并更新信誉

    Args:
        user_id: 用户ID
        event_id: 活动ID
        event_type: 活动类型
    """
    try:
        result = reputation_system.record_attendance(user_id, event_id, event_type)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/reputation")
async def get_reputation(user_id: str):
    """
    获取用户信誉信息

    Args:
        user_id: 用户ID
    """
    try:
        if user_id not in reputation_system.credentials:
            raise HTTPException(status_code=404, detail="User not found")

        credential = reputation_system.credentials[user_id]
        return {
            "status": "success",
            "reputation": credential.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/reputation/proof")
async def generate_reputation_proof(
    user_id: str,
    statement: str = "reputation_state_valid"
):
    """
    生成ZK信誉证明

    Args:
        user_id: 用户ID
        statement: 要证明的陈述
    """
    try:
        proof = reputation_system.generate_reputation_proof(user_id, statement)
        return {
            "status": "success",
            "reputation_proof": proof
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reputation/verify-proof")
async def verify_reputation_proof(zk_proof: Dict[str, Any]):
    """
    验证信誉证明

    Args:
        zk_proof: ZK信誉证明
    """
    try:
        result = reputation_system.verify_reputation_proof(zk_proof)
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reputation/stats")
async def get_reputation_stats():
    """
    获取信誉统计（差分隐私保护）
    """
    try:
        stats = reputation_system.get_differentially_private_stats()
        return {
            "status": "success",
            **stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/reputation/predict")
async def predict_reputation_state(
    user_id: str,
    steps: int = Query(5, ge=1, le=10)
):
    """
    预测用户信誉状态转移路径

    Args:
        user_id: 用户ID
        steps: 预测步数
    """
    try:
        predictions = reputation_system.predict_next_state(user_id, steps)
        return {
            "status": "success",
            "user_id": user_id,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-image")
async def upload_event_image(file: UploadFile = File(...)):
    """
    上传活动图片到本地存储

    Args:
        file: 图片文件 (JPEG, PNG, GIF, max 5MB)

    Returns:
        image_url: 图片访问URL
        file_path: 本地文件路径
        original_name: 原始文件名
    """
    try:
        # 验证文件类型
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}")

        # 验证文件大小 (max 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")

        # 生成唯一文件名
        file_extension = os.path.splitext(file.filename)[1] or ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # 保存文件
        with open(file_path, "wb") as f:
            f.write(contents)

        # 生成访问URL
        image_url = f"http://localhost:8000/api/v1/events/uploaded-images/{unique_filename}"
        file_path_str = str(file_path)

        return {
            "status": "success",
            "image_url": image_url,
            "file_path": file_path_str,
            "original_name": file.filename,
            "file_size": len(contents),
            "content_type": file.content_type
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@router.get("/uploaded-images/{filename}")
async def get_uploaded_image(filename: str):
    """
    获取上传的图片文件

    Args:
        filename: 图片文件名

    Returns:
        图片文件
    """
    try:
        file_path = UPLOAD_DIR / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")

        # 返回文件
        from fastapi.responses import FileResponse
        return FileResponse(file_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
