"""
ZK验证参会系统 (zk-Attend)
零知识门票验证 - 证明"我有票"而不透露身份
"""

import json
import hashlib
import base64
import secrets
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime, timedelta
import logging
from enum import Enum

from app.services.zkp_system import zkp_system, ZeroKnowledgeProofSystem

logger = logging.getLogger(__name__)


class TicketType(str, Enum):
    """门票类型"""
    FREE = "free"
    PAID = "paid"
    VIP = "vip"
    SPEAKER = "speaker"


class VerificationMode(str, Enum):
    """验证模式"""
    ANONYMOUS = "anonymous"  # 完全匿名：只证明有票
    PARTIAL = "partial"      # 部分披露：证明年龄/KYC等 + 有票
    FULL = "full"           # 完全验证：暴露身份


class TicketNFT:
    """
    门票NFT（灵魂绑定 - 不可转让）
    Sui Move风格的NFT表示
    """

    def __init__(
        self,
        ticket_id: str,
        event_id: str,
        owner_id: str,
        ticket_type: TicketType = TicketType.FREE,
        price: float = 0.0,
        minted_at: Optional[datetime] = None
    ):
        self.ticket_id = ticket_id
        self.event_id = event_id
        self.owner_id = owner_id
        self.ticket_type = ticket_type
        self.price = price
        self.minted_at = minted_at or datetime.utcnow()
        self.is_used = False
        self.used_at: Optional[datetime] = None
        self.metadata: Dict[str, Any] = {}

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "ticket_id": self.ticket_id,
            "event_id": self.event_id,
            "owner_id": self.owner_id,
            "ticket_type": self.ticket_type.value,
            "price": self.price,
            "minted_at": self.minted_at.isoformat(),
            "is_used": self.is_used,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "metadata": self.metadata,
            "soulbound": True,  # 不可转让
            "transferable": False
        }


class AttendanceProof:
    """参会证明（ZK证明结果）"""

    def __init__(
        self,
        proof_id: str,
        event_id: str,
        verification_mode: VerificationMode,
        verified_at: datetime,
        nullifier: str
    ):
        self.proof_id = proof_id
        self.event_id = event_id
        self.verification_mode = verification_mode
        self.verified_at = verified_at
        self.nullifier = nullifier  # 防止重复验证
        self.zk_proof: Optional[Dict[str, Any]] = None


class ZKTicketSystem:
    """
    ZK门票系统
    支持三种验证模式：匿名、部分披露、完全验证
    """

    def __init__(self):
        self.tickets: Dict[str, TicketNFT] = {}  # ticket_id -> TicketNFT
        self.event_tickets: Dict[str, List[str]] = {}  # event_id -> list of ticket_ids
        self.user_tickets: Dict[str, List[str]] = {}  # user_id -> list of ticket_ids
        self.attendance_proofs: Dict[str, AttendanceProof] = {}  # proof_id -> AttendanceProof
        self.used_nullifiers: set = set()  # 防止双重验证
        logger.info("ZK Ticket System initialized")

    def mint_ticket(
        self,
        event_id: str,
        user_id: str,
        ticket_type: TicketType = TicketType.FREE,
        price: float = 0.0
    ) -> TicketNFT:
        """
        铸造门票NFT（灵魂绑定）

        Args:
            event_id: 活动ID
            user_id: 用户ID
            ticket_type: 门票类型
            price: 价格

        Returns:
            门票NFT
        """
        # 生成唯一门票ID
        ticket_id = f"ticket_{event_id}_{user_id}_{secrets.token_hex(8)}"

        # 创建门票NFT
        ticket = TicketNFT(
            ticket_id=ticket_id,
            event_id=event_id,
            owner_id=user_id,
            ticket_type=ticket_type,
            price=price
        )

        # 存储门票
        self.tickets[ticket_id] = ticket

        # 添加到活动索引
        if event_id not in self.event_tickets:
            self.event_tickets[event_id] = []
        self.event_tickets[event_id].append(ticket_id)

        # 添加到用户索引
        if user_id not in self.user_tickets:
            self.user_tickets[user_id] = []
        self.user_tickets[user_id].append(ticket_id)

        logger.info(f"Minted {ticket_type.value} ticket {ticket_id} for event {event_id}, user {user_id}")
        return ticket

    def has_ticket(self, event_id: str, user_id: str) -> bool:
        """
        检查用户是否拥有某活动的门票

        Args:
            event_id: 活动ID
            user_id: 用户ID

        Returns:
            是否拥有门票
        """
        if user_id not in self.user_tickets:
            return False

        user_ticket_list = self.user_tickets[user_id]

        for ticket_id in user_ticket_list:
            if ticket_id in self.tickets:
                ticket = self.tickets[ticket_id]
                if ticket.event_id == event_id and not ticket.is_used:
                    return True

        return False

    def generate_zk_ticket_proof(
        self,
        event_id: str,
        user_id: str,
        verification_mode: VerificationMode = VerificationMode.ANONYMOUS
    ) -> Dict[str, Any]:
        """
        生成ZK门票证明

        Args:
            event_id: 活动ID
            user_id: 用户ID（私有输入）
            verification_mode: 验证模式

        Returns:
            ZK证明
        """
        # 检查是否拥有门票
        if not self.has_ticket(event_id, user_id):
            raise ValueError(f"User {user_id} does not have ticket for event {event_id}")

        # 找到门票
        ticket_id = None
        for tid in self.user_tickets[user_id]:
            if self.tickets[tid].event_id == event_id:
                ticket_id = tid
                break

        if not ticket_id:
            raise ValueError("Ticket not found")

        # 根据验证模式生成不同类型的证明
        if verification_mode == VerificationMode.ANONYMOUS:
            # 模式1: 完全匿名 - 只证明"我有票"
            return self._generate_anonymous_proof(event_id, user_id, ticket_id)

        elif verification_mode == VerificationMode.PARTIAL:
            # 模式2: 部分披露 - 证明年龄/KYC + 有票
            return self._generate_partial_proof(event_id, user_id, ticket_id)

        elif verification_mode == VerificationMode.FULL:
            # 模式3: 完全验证 - 暴露身份
            return self._generate_full_proof(event_id, user_id, ticket_id)

        else:
            raise ValueError(f"Unknown verification mode: {verification_mode}")

    def _generate_anonymous_proof(self, event_id: str, user_id: str, ticket_id: str) -> Dict[str, Any]:
        """
        生成匿名证明（模式1）
        证明"我有这张活动的票"而不透露"我是谁"
        """
        # 创建门票哈希（私有）
        ticket_data = {
            "event_id": event_id,
            "ticket_id": ticket_id,
            "has_ticket": True
        }

        # 使用ZK系统生成证明
        proof = zkp_system.create_commitment(ticket_data, user_id)

        # 生成nullifier（防止同一门票重复使用）
        nullifier = hashlib.sha256(f"{ticket_id}_{event_id}_{user_id}".encode()).hexdigest()

        result = {
            "event_id": event_id,
            "proof_type": "anonymous_ticket",
            "statement": "I have a valid ticket for this event",
            "commitment": proof[0],
            "nullifier": nullifier,
            "verification_mode": VerificationMode.ANONYMOUS.value,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Generated anonymous ZK proof for event {event_id}")
        return result

    def _generate_partial_proof(self, event_id: str, user_id: str, ticket_id: str) -> Dict[str, Any]:
        """
        生成部分披露证明（模式2）
        示例：证明"我年龄>=18岁且持有门票"而不透露具体年龄或身份
        """
        # 模拟KYC数据（真实场景来自KYC提供商）
        user_kyc_data = {
            "user_id": user_id,
            "age": 25,  # 模拟年龄
            "kyc_verified": True,
            "country": "US"
        }

        # 生成年龄证明（不透露具体年龄）
        age_proof = zkp_system.prove_age(user_kyc_data["age"], 18, user_id)

        # 生成门票证明
        ticket_proof = self._generate_anonymous_proof(event_id, user_id, ticket_id)

        # 组合证明
        combined_proof = {
            "event_id": event_id,
            "proof_type": "partial_disclosure",
            "statement": "age >= 18 AND has_valid_ticket",
            "age_proof": age_proof,
            "ticket_proof": ticket_proof,
            "nullifier": ticket_proof["nullifier"],
            "verification_mode": VerificationMode.PARTIAL.value,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Generated partial disclosure ZK proof for event {event_id}")
        return combined_proof

    def _generate_full_proof(self, event_id: str, user_id: str, ticket_id: str) -> Dict[str, Any]:
        """
        生成完全验证证明（模式3）
        暴露身份，但使用ZK证明验证流程的一致性
        """
        ticket = self.tickets[ticket_id]

        # 所有权证明
        ownership_proof = zkp_system.prove_data_ownership({
            "ticket_id": ticket_id,
            "owner_id": user_id,
            "event_id": event_id
        }, user_id)

        # 生成nullifier
        nullifier = hashlib.sha256(f"{ticket_id}_{event_id}_{user_id}".encode()).hexdigest()

        result = {
            "event_id": event_id,
            "proof_type": "full_verification",
            "statement": f"User {user_id} owns ticket {ticket_id}",
            "owner_id": user_id,
            "ticket_id": ticket_id,
            "ticket_type": ticket.ticket_type.value,
            "ownership_proof": ownership_proof,
            "nullifier": nullifier,
            "verification_mode": VerificationMode.FULL.value,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Generated full verification proof for event {event_id}, user {user_id}")
        return result

    def verify_attendance(
        self,
        event_id: str,
        zk_proof: Dict[str, Any],
        required_mode: Optional[VerificationMode] = None
    ) -> Dict[str, Any]:
        """
        验证参会证明（门禁扫描）

        Args:
            event_id: 活动ID
            zk_proof: ZK证明
            required_mode: 要求的验证模式

        Returns:
            验证结果
        """
        # 检查nullifier（防止双重验证）
        nullifier = zk_proof.get("nullifier")
        if not nullifier:
            return {"verified": False, "reason": "Missing nullifier"}

        if nullifier in self.used_nullifiers:
            return {"verified": False, "reason": "Ticket already used", "double_spend_detected": True}

        # 验证证明类型
        proof_type = zk_proof.get("proof_type")
        verification_mode = VerificationMode(zk_proof.get("verification_mode", "anonymous"))

        if required_mode and verification_mode != required_mode:
            return {
                "verified": False,
                "reason": f"Verification mode mismatch. Required: {required_mode.value}"
            }

        # 根据证明类型验证
        if proof_type == "anonymous_ticket":
            # 验证匿名证明（只需检查承诺有效）
            verified = self._verify_anonymous_proof(zk_proof, event_id)

        elif proof_type == "partial_disclosure":
            # 验证部分披露证明
            verified = self._verify_partial_proof(zk_proof, event_id)

        elif proof_type == "full_verification":
            # 验证完全证明
            verified = self._verify_full_proof(zk_proof, event_id)

        else:
            return {"verified": False, "reason": f"Unknown proof type: {proof_type}"}

        if verified:
            # 添加到已使用集合
            self.used_nullifiers.add(nullifier)

            # 记录验证证明
            proof_id = f"proof_{secrets.token_hex(16)}"
            attendance_proof = AttendanceProof(
                proof_id=proof_id,
                event_id=event_id,
                verification_mode=verification_mode,
                verified_at=datetime.utcnow(),
                nullifier=nullifier
            )
            attendance_proof.zk_proof = zk_proof
            self.attendance_proofs[proof_id] = attendance_proof

            logger.info(f"Verified attendance for event {event_id}, mode: {verification_mode.value}")

            return {
                "verified": True,
                "proof_id": proof_id,
                "verification_mode": verification_mode.value,
                "admitted": True,
                "nullifier": nullifier,
                "verified_at": datetime.utcnow().isoformat()
            }
        else:
            return {"verified": False, "reason": "Proof verification failed"}

    def _verify_anonymous_proof(self, zk_proof: Dict[str, Any], event_id: str) -> bool:
        """验证匿名证明"""
        # 简化的验证逻辑（真实场景需要完整的zk-SNARK验证）
        commitment = zk_proof.get("commitment")
        return bool(commitment) and len(commitment) == 64

    def _verify_partial_proof(self, zk_proof: Dict[str, Any], event_id: str) -> bool:
        """验证部分披露证明"""
        # 验证年龄证明
        age_proof = zk_proof.get("age_proof")
        ticket_proof = zk_proof.get("ticket_proof")

        if not age_proof or not ticket_proof:
            return False

        # 简化的验证（真实场景需要验证zk-SNARK电路）
        return age_proof.get("proof_type") == "age_proof" and ticket_proof.get("proof_type") == "anonymous_ticket"

    def _verify_full_proof(self, zk_proof: Dict[str, Any], event_id: str) -> bool:
        """验证完全证明"""
        # 验证所有权证明
        ownership_proof = zk_proof.get("ownership_proof")

        if not ownership_proof:
            return False

        # 检查门票是否有效
        ticket_id = zk_proof.get("ticket_id")
        if ticket_id not in self.tickets:
            return False

        ticket = self.tickets[ticket_id]

        # 检查门票是否已使用
        if ticket.is_used:
            return False

        # 简化的验证
        return True

    def mark_ticket_used(self, ticket_id: str) -> bool:
        """
        标记门票已使用（入场后）

        Args:
            ticket_id: 门票ID

        Returns:
            是否成功
        """
        if ticket_id not in self.tickets:
            return False

        ticket = self.tickets[ticket_id]
        ticket.is_used = True
        ticket.used_at = datetime.utcnow()

        logger.info(f"Marked ticket {ticket_id} as used")
        return True

    def get_ticket_info(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """
        获取门票信息（隐私保护版本）

        Args:
            ticket_id: 门票ID

        Returns:
            门票信息
        """
        if ticket_id not in self.tickets:
            return None

        ticket = self.tickets[ticket_id]

        # 返回隐私保护的信息（不暴露完整数据）
        return {
            "ticket_id": ticket_id,
            "event_id": ticket.event_id,
            "ticket_type": ticket.ticket_type.value,
            "minted_at": ticket.minted_at.isoformat(),
            "is_used": ticket.is_used,
            "used_at": ticket.used_at.isoformat() if ticket.used_at else None,
            "soulbound": True
        }

    def get_event_attendance_stats(self, event_id: str) -> Dict[str, Any]:
        """
        获取活动参会统计（差分隐私保护）

        Args:
            event_id: 活动ID

        Returns:
            参会统计
        """
        event_tickets = self.event_tickets.get(event_id, [])

        total_tickets = len(event_tickets)
        used_tickets = sum(1 for tid in event_tickets if self.tickets[tid].is_used)

        # 添加差分隐私噪声（保护个体隐私）
        from app.services.differential_privacy import laplace_mechanism
        noisy_total = int(laplace_mechanism.add_noise(float(total_tickets), 1.0))
        noisy_used = int(laplace_mechanism.add_noise(float(used_tickets), 1.0))

        return {
            "event_id": event_id,
            "total_tickets_issued": max(0, noisy_total),
            "tickets_used": max(0, noisy_used),
            "attendance_rate": noisy_used / max(noisy_total, 1),
            "privacy_protected": True,
            "privacy_epsilon": laplace_mechanism.epsilon
        }


# 全局ZK门票系统实例
zk_ticket_system = ZKTicketSystem()
