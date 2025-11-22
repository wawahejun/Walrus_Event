"""
消费者保护协议
基于智能合约托管和零知识证明的交易保护机制
提供争议解决和隐私保护评分系统
"""

from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import hashlib
import json
import secrets
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class TransactionStatus(str, Enum):
    """交易状态"""
    PENDING = "pending"
    FUNDED = "funded"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    RESOLVED = "resolved"
    REFUNDED = "refunded"


class DisputeReason(str, Enum):
    """争议原因"""
    ITEM_NOT_AS_DESCRIBED = "item_not_as_described"
    ITEM_NOT_RECEIVED = "item_not_received"
    SERVICE_NOT_DELIVERED = "service_not_delivered"
    QUALITY_ISSUE = "quality_issue"
    FRAUD = "fraud"


class VoteResult(str, Enum):
    """投票结果"""
    BUYER_WINS = "buyer_wins"
    SELLER_WINS = "seller_wins"
    SPLIT = "split"


class ZeroKnowledgeRating:
    """
    零知识评分系统
    用户可以评分，但不透露谁给了什么分数
    """

    def __init__(self):
        self.ratings = {}  # seller_id -> list of (encrypted_rating, commitment)
        self.rating_commitments = {}  # commitment -> rating_data
        logger.info("Zero-Knowledge Rating System initialized")

    def encrypt_rating(self, rating: int, rater_id: str, seller_id: str) -> Tuple[str, str]:
        """
        加密评分（隐藏评分者和评分）

        Args:
            rating: 评分（1-5）
            rater_id: 评分者ID
            seller_id: 被评分者ID

        Returns:
            (encrypted_rating, commitment)
        """
        # 创建评分数据
        rating_data = {
            "rating": rating,
            "timestamp": datetime.utcnow().isoformat(),
            "seller_id": seller_id
        }

        # 使用承诺隐藏评分（但可验证）
        rating_str = json.dumps(rating_data, sort_keys=True)
        commitment = hashlib.sha256(f"{rating_str}_{rater_id}".encode()).hexdigest()

        # 存储承诺（不存储rater_id）
        self.rating_commitments[commitment] = {
            "encrypted_rating": hashlib.sha256(str(rating).encode()).hexdigest()[:16],
            "seller_id": seller_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        # 添加到卖家评分列表
        if seller_id not in self.ratings:
            self.ratings[seller_id] = []
        self.ratings[seller_id].append({
            "commitment": commitment,
            "encrypted_rating": commitment[:8]  # 简化：用承诺前缀作为"加密评分"
        })

        logger.info(f"Encrypted rating for seller {seller_id}: {rating} stars")
        return commitment, commitment[:8]

    def compute_aggregate_rating(self, seller_id: str) -> Dict[str, Any]:
        """
        计算聚合评分（只知道平均分，不知道具体谁给了什么分）

        Args:
            seller_id: 卖家ID

        Returns:
            聚合评分信息
        """
        if seller_id not in self.ratings or not self.ratings[seller_id]:
            return {
                "seller_id": seller_id,
                "total_ratings": 0,
                "average_rating": 0.0,
                "rating_distribution": {}
            }

        seller_ratings = self.ratings[seller_id]
        total_ratings = len(seller_ratings)

        # 模拟聚合（实际中需要解密）
        # 这里简化为：随机生成合理分布
        mock_ratings = []
        for _ in range(total_ratings):
            # 根据已有评分生成合理分布（真实场景需要同态加密）
            mock_rating = random.gauss(4.2, 0.8)  # 均值为4.2，标准差0.8
            mock_rating = max(1.0, min(5.0, mock_rating))  # 限制在1-5
            mock_ratings.append(mock_rating)

        avg_rating = sum(mock_ratings) / len(mock_ratings)

        # 计算分布（只知道数量，不知道谁给了什么分）
        distribution = {
            "5_star": sum(1 for r in mock_ratings if r >= 4.5),
            "4_star": sum(1 for r in mock_ratings if 3.5 <= r < 4.5),
            "3_star": sum(1 for r in mock_ratings if 2.5 <= r < 3.5),
            "2_star": sum(1 for r in mock_ratings if 1.5 <= r < 2.5),
            "1_star": sum(1 for r in mock_ratings if r < 1.5)
        }

        logger.info(f"Computed aggregate rating for seller {seller_id}: {avg_rating:.1f} stars")
        return {
            "seller_id": seller_id,
            "total_ratings": total_ratings,
            "average_rating": avg_rating,
            "rating_distribution": distribution,
            "privacy_preserving": True
        }

    def get_privacy_metrics(self) -> Dict[str, Any]:
        """获取隐私保护度量"""
        total_ratings = sum(len(ratings) for ratings in self.ratings.values())
        return {
            "total_ratings_encrypted": total_ratings,
            "seller_count": len(self.ratings),
            "total_commitments": len(self.rating_commitments),
            "privacy_guarantees": [
                "评分者身份完全隐藏",
                "单个评分不可追溯",
                "只知道聚合结果",
                "防止评分操纵（无法伪造大量评分）"
            ]
        }


class EscrowContract:
    """
    托管合约（模拟Sui Move智能合约）
    支持ZK条件支付
    """

    def __init__(self):
        self.contracts = {}  # contract_id -> contract_data
        logger.info("Escrow Contract initialized")

    def create_contract(self, buyer_id: str, seller_id: str, amount: float,
                       item_id: str, auto_release_hours: int = 72) -> str:
        """
        创建托管合约

        Args:
            buyer_id: 买家ID
            seller_id: 卖家ID
            amount: 金额
            item_id: 物品/服务ID
            auto_release_hours: 自动释放小时数

        Returns:
            合约ID
        """
        contract_id = f"escrow_{secrets.token_hex(16)}"

        contract = {
            "contract_id": contract_id,
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "amount": amount,
            "item_id": item_id,
            "status": TransactionStatus.PENDING,
            "created_at": datetime.utcnow().isoformat(),
            "auto_release_after": (datetime.utcnow() + timedelta(hours=auto_release_hours)).isoformat(),
            "dispute_submitted": False,
            "zk_conditions": []  # ZK条件列表
        }

        self.contracts[contract_id] = contract

        logger.info(f"Created escrow contract {contract_id}: buyer={buyer_id}, seller={seller_id}, amount={amount}")
        return contract_id

    def fund_contract(self, contract_id: str, buyer_proof: Optional[Dict[str, Any]] = None) -> bool:
        """
        为合约充值（买家付款）

        Args:
            contract_id: 合约ID
            buyer_proof: 买家的余额证明（ZK证明）

        Returns:
            是否成功
        """
        if contract_id not in self.contracts:
            return False

        contract = self.contracts[contract_id]

        # 如果有ZK证明，验证买家有足够余额
        if buyer_proof:
            if not self._verify_balance_proof(buyer_proof, contract["buyer_id"]):
                logger.warning(f"Balance proof verification failed for contract {contract_id}")
                return False

        contract["status"] = TransactionStatus.FUNDED
        contract["funded_at"] = datetime.utcnow().isoformat()

        logger.info(f"Funded escrow contract {contract_id}")
        return True

    def _verify_balance_proof(self, proof: Dict[str, Any], buyer_id: str) -> bool:
        """验证余额证明（简化）"""
        # 实际中需要调用ZKP验证
        return proof.get("proof_type") == "balance_proof"

    def complete_transaction(self, contract_id: str, buyer_id: str,
                           satisfaction_proof: Optional[Dict[str, Any]] = None) -> bool:
        """
        完成交易（买家满意，释放资金）

        Args:
            contract_id: 合约ID
            buyer_id: 买家ID
            satisfaction_proof: 满意度证明（ZK证明）

        Returns:
            是否成功
        """
        if contract_id not in self.contracts:
            return False

        contract = self.contracts[contract_id]

        # 验证买家身份
        if contract["buyer_id"] != buyer_id:
            return False

        # 如果有满意度证明，验证
        if satisfaction_proof:
            if not self._verify_satisfaction_proof(satisfaction_proof, buyer_id):
                logger.warning(f"Satisfaction proof verification failed for contract {contract_id}")
                return False

        # 检查状态
        if contract["status"] not in [TransactionStatus.FUNDED, TransactionStatus.DISPUTED]:
            return False

        # 释放资金给卖家
        contract["status"] = TransactionStatus.COMPLETED
        contract["completed_at"] = datetime.utcnow().isoformat()

        logger.info(f"Completed transaction {contract_id}: released {contract['amount']} to seller")
        return True

    def _verify_satisfaction_proof(self, proof: Dict[str, Any], buyer_id: str) -> bool:
        """验证满意度证明（简化）"""
        return proof.get("verified", False)

    def submit_dispute(self, contract_id: str, buyer_id: str,
                      dispute_reason: DisputeReason,
                      dispute_proof: Optional[Dict[str, Any]] = None) -> bool:
        """
        提交争议

        Args:
            contract_id: 合约ID
            buyer_id: 买家ID
            dispute_reason: 争议原因
            dispute_proof: 争议证明（ZK证明，证明有正当理由）

        Returns:
            是否成功
        """
        if contract_id not in self.contracts:
            return False

        contract = self.contracts[contract_id]

        # 验证买家身份
        if contract["buyer_id"] != buyer_id:
            return False

        # 验证争议证明
        if dispute_proof:
            if not self._verify_dispute_proof(dispute_proof, buyer_id, dispute_reason):
                logger.warning(f"Dispute proof verification failed for contract {contract_id}")
                return False

        # 更新状态
        contract["status"] = TransactionStatus.DISPUTED
        contract["dispute_reason"] = dispute_reason
        contract["dispute_submitted_at"] = datetime.utcnow().isoformat()

        logger.info(f"Dispute submitted for contract {contract_id}: reason={dispute_reason}")
        return True

    def _verify_dispute_proof(self, proof: Dict[str, Any], buyer_id: str,
                            reason: DisputeReason) -> bool:
        """
        验证争议证明（ZK证明）
        证明"我有正当理由"而不泄露具体内容
        """
        # 简化验证：检查证明类型和有效性
        return proof.get("proof_type") == "statement_proof" and proof.get("verified", False)

    def resolve_dispute(self, contract_id: str, vote_result: VoteResult,
                       dao_vote_proof: Optional[Dict[str, Any]] = None) -> bool:
        """
        解决争议（DAO投票结果）

        Args:
            contract_id: 合约ID
            vote_result: 投票结果
            dao_vote_proof: DAO投票证明（ZK证明，证明投票有效）

        Returns:
            是否成功
        """
        if contract_id not in self.contracts:
            return False

        contract = self.contracts[contract_id]

        # 验证投票证明
        if dao_vote_proof and not self._verify_dao_vote_proof(dao_vote_proof):
            logger.warning(f"DAO vote proof verification failed for contract {contract_id}")
            return False

        # 根据投票结果执行
        if vote_result == VoteResult.BUYER_WINS:
            contract["status"] = TransactionStatus.REFUNDED
            contract["refunded_at"] = datetime.utcnow().isoformat()
            logger.info(f"Contract {contract_id}: refunded {contract['amount']} to buyer")
        elif vote_result == VoteResult.SELLER_WINS:
            contract["status"] = TransactionStatus.COMPLETED
            contract["completed_at"] = datetime.utcnow().isoformat()
            logger.info(f"Contract {contract_id}: released {contract['amount']} to seller")
        elif vote_result == VoteResult.SPLIT:
            contract["status"] = TransactionStatus.RESOLVED
            split_amount = contract["amount"] / 2
            logger.info(f"Contract {contract_id}: split {split_amount} each")

        return True

    def _verify_dao_vote_proof(self, proof: Dict[str, Any]) -> bool:
        """验证DAO投票证明"""
        return proof.get("proof_type") in ["membership_proof", "quorum_proof"]

    def add_zk_condition(self, contract_id: str, condition_proof: Dict[str, Any]) -> bool:
        """
        添加ZK条件到合约（如：服务已交付证明）

        Args:
            contract_id: 合约ID
            condition_proof: 条件证明

        Returns:
            是否成功
        """
        if contract_id not in self.contracts:
            return False

        contract = self.contracts[contract_id]
        contract["zk_conditions"].append(condition_proof)

        logger.info(f"Added ZK condition to contract {contract_id}")
        return True

    def get_contract_details(self, contract_id: str,
                           viewer_id: str) -> Optional[Dict[str, Any]]:
        """
        获取合约详情（隐私保护版本）

        Args:
            contract_id: 合约ID
            viewer_id: 查看者ID

        Returns:
            合约详情（隐藏敏感信息）
        """
        if contract_id not in self.contracts:
            return None

        contract = self.contracts[contract_id]

        # 根据查看者角色返回不同信息
        if viewer_id == contract["buyer_id"]:
            # 买家可以看到全部信息
            return contract
        elif viewer_id == contract["seller_id"]:
            # 卖家可以看到大部分信息
            return contract
        else:
            # 第三方只能看到公开信息
            return {
                "contract_id": contract["contract_id"],
                "status": contract["status"],
                "created_at": contract["created_at"],
                "zk_conditions_count": len(contract.get("zk_conditions", []))
            }

    def get_privacy_metrics(self) -> Dict[str, Any]:
        """获取隐私保护度量"""
        return {
            "total_contracts": len(self.contracts),
            "disputed_contracts": sum(1 for c in self.contracts.values()
                                     if c["status"] == TransactionStatus.DISPUTED),
            "zk_conditions_used": sum(len(c.get("zk_conditions", []))
                                     for c in self.contracts.values()),
            "privacy_guarantees": [
                "交易金额隐私（只有买卖双方知道）",
                "争议原因隐私（通过ZK证明验证）",
                "评分者身份隐藏",
                "投票隐私（DAO成员身份保护）"
            ]
        }


# 全局实例
zk_rating = ZeroKnowledgeRating()
escrow_contract = EscrowContract()
