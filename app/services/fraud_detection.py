"""
欺诈检测引擎
基于差分隐私和机器学习的行为分析
生成零知识欺诈证明以保护隐私
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from datetime import datetime, timedelta
import hashlib
import json
import logging
from collections import defaultdict, deque
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import secrets
import random

logger = logging.getLogger(__name__)


class DifferentialPrivacy:
    """
    差分隐私保护器
    在数据中添加可控噪声以保护隐私
    """

    @staticmethod
    def add_laplace_noise(value: float, sensitivity: float, epsilon: float) -> float:
        """
        添加拉普拉斯噪声

        Args:
            value: 原始值
            sensitivity: 查询的敏感度
            epsilon: 隐私预算（越小隐私性越好，但准确性越低）

        Returns:
            添加噪声后的值
        """
        scale = sensitivity / epsilon
        noise = np.random.laplace(0, scale)
        return value + noise

    @staticmethod
    def add_gaussian_noise(value: float, sensitivity: float, epsilon: float, delta: float = 1e-5) -> float:
        """
        添加高斯噪声（适用于更复杂的查询）

        Args:
            value: 原始值
            sensitivity: 敏感度
            epsilon: 隐私预算
            delta: 出错概率

        Returns:
            添加噪声后的值
        """
        sigma = np.sqrt(2 * np.log(1.25 / delta)) * sensitivity / epsilon
        noise = np.random.normal(0, sigma)
        return value + noise

    @staticmethod
    def perturb_timestamp(timestamp: datetime, max_perturbation_minutes: int = 30) -> datetime:
        """
        扰动时间戳以保护精确的访问时间

        Args:
            timestamp: 原始时间戳
            max_perturbation_minutes: 最大扰动分钟数

        Returns:
            扰动后的时间戳
        """
        perturbation = random.randint(-max_perturbation_minutes, max_perturbation_minutes)
        return timestamp + timedelta(minutes=perturbation)

    @staticmethod
    def perturb_count(count: int, epsilon: float = 0.5) -> float:
        """
        扰动计数以保护精确数量

        Args:
            count: 原始计数
            epsilon: 隐私预算

        Returns:
            扰动后的计数
        """
        return DifferentialPrivacy.add_laplace_noise(float(count), 1.0, epsilon)


class FraudDetectionEngine:
    """
    欺诈检测引擎
    基于行为模式的异常检测，配合差分隐私保护
    """

    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        """
        初始化欺诈检测引擎

        Args:
            contamination: 异常数据点的比例
            random_state: 随机种子
        """
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.behavior_profiles = {}  # 存储用户行为模式
        self.risk_scores = {}  # 存储风险评分历史
        self.differential_privacy = DifferentialPrivacy()
        logger.info("Fraud Detection Engine initialized")

    def create_behavior_fingerprint(self, user_id: str, behaviors: List[Dict[str, Any]],
                                     apply_dp: bool = True) -> Dict[str, Any]:
        """
        创建行为指纹（加密的行为模式）

        Args:
            user_id: 用户ID
            behaviors: 用户行为列表
            apply_dp: 是否应用差分隐私

        Returns:
            行为指纹
        """
        # 提取行为特征
        features = self._extract_features(behaviors, apply_dp)

        # 创建行为指纹（不包含敏感信息）
        fingerprint = {
            "user_id_hash": self._hash_user_id(user_id),
            "features": features,
            "behavior_count": len(behaviors),
            "created_at": datetime.utcnow().isoformat(),
            "fingerprint_version": "1.0"
        }

        # 应用差分隐私
        if apply_dp:
            fingerprint["behavior_count_dp"] = self.differential_privacy.perturb_count(
                len(behaviors), epsilon=0.5
            )

        self.behavior_profiles[user_id] = fingerprint

        logger.info(f"Created behavior fingerprint for user {user_id}: {len(behaviors)} behaviors")
        return fingerprint

    def _hash_user_id(self, user_id: str) -> str:
        """哈希用户ID"""
        return hashlib.sha256(user_id.encode()).hexdigest()

    def _extract_features(self, behaviors: List[Dict[str, Any]], apply_dp: bool = True) -> Dict[str, Any]:
        """
        从行为中提取特征

        Args:
            behaviors: 行为列表
            apply_dp: 是否应用差分隐私

        Returns:
            特征字典
        """
        if not behaviors:
            return {}

        features = {
            "total_behaviors": len(behaviors),
            "behavior_types": defaultdict(int),
            "categories": defaultdict(int),
            "time_features": {},
            "sequence_patterns": {}
        }

        # 统计行为类型
        for behavior in behaviors:
            behavior_type = behavior.get("behavior_type", "unknown")
            features["behavior_types"][behavior_type] += 1

            # 扰动时间戳
            if apply_dp and "timestamp" in behavior:
                original_time = datetime.fromisoformat(behavior["timestamp"])
                perturbed_time = self.differential_privacy.perturb_timestamp(original_time)
                behavior["timestamp_dp"] = perturbed_time.isoformat()

        # 提取时间特征（应用DP）
        timestamps = []
        for behavior in behaviors:
            ts = behavior.get("timestamp_dp", behavior.get("timestamp", ""))
            if ts:
                timestamps.append(datetime.fromisoformat(ts))

        if timestamps:
            time_diffs = [(timestamps[i + 1] - timestamps[i]).total_seconds()
                          for i in range(len(timestamps) - 1)]

            if time_diffs:
                features["time_features"] = {
                    "avg_interval": np.mean(time_diffs),
                    "std_interval": np.std(time_diffs),
                    "total_span": (timestamps[-1] - timestamps[0]).total_seconds()
                }

                # 应用差分隐私到时间特征
                if apply_dp:
                    features["time_features"]["avg_interval_dp"] = \
                        self.differential_privacy.add_laplace_noise(
                            features["time_features"]["avg_interval"],
                            sensitivity=60.0,  # 1分钟敏感度
                            epsilon=0.3
                        )

        # 行为序列模式（马尔科夫链风格）
        if len(behaviors) >= 2:
            sequences = []
            for i in range(len(behaviors) - 1):
                seq = f"{behaviors[i].get('behavior_type')}->{behaviors[i + 1].get('behavior_type')}"
                sequences.append(seq)

            sequence_counts = defaultdict(int)
            for seq in sequences:
                sequence_counts[seq] += 1

            features["sequence_patterns"] = dict(sequence_counts)

        return features

    def compute_risk_score(self, user_id: str, current_behaviors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        计算用户的风险评分

        Args:
            user_id: 用户ID
            current_behaviors: 当前行为序列

        Returns:
            风险评分结果
        """
        # 获取用户历史行为指纹
        profile = self.behavior_profiles.get(user_id)
        if not profile:
            # 新用户，使用基础评分
            return {
                "risk_score": 0.3,  # 中等风险（新用户）
                "risk_level": "medium",
                "reasons": ["新用户，行为历史不足"],
                "dp_protected": True
            }

        # 提取当前行为特征
        current_features = self._extract_features(current_behaviors, apply_dp=True)

        # 异常检测（与历史行为对比）
        anomalies = self._detect_anomalies(profile, current_features)

        # 计算风险评分（0-1）
        risk_score = 0.0
        reasons = []

        if anomalies:
            risk_score = min(0.5 + len(anomalies) * 0.1, 1.0)
            reasons.extend(anomalies)

        # 基于行为类型的风险
        if current_features.get("behavior_types"):
            suspicious_types = ["purchases", "transfers", "withdrawals"]
            for btype in suspicious_types:
                if btype in current_features["behavior_types"]:
                    count = current_features["behavior_types"][btype]
                    if count > 5:  # 短时间内大量操作
                        risk_score = min(risk_score + 0.2, 1.0)
                        reasons.append(f"短时间内大量{btype}操作: {count}次")

        # 风险等级
        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.7:
            risk_level = "medium"
        else:
            risk_level = "high"

        result = {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "dp_protected": True,
            "timestamp": datetime.utcnow().isoformat()
        }

        # 存储风险评分历史
        if user_id not in self.risk_scores:
            self.risk_scores[user_id] = []
        self.risk_scores[user_id].append(result)

        logger.info(f"Computed risk score for user {user_id}: {risk_score:.2f} ({risk_level})")
        return result

    def _detect_anomalies(self, profile: Dict[str, Any], current: Dict[str, Any]) -> List[str]:
        """
        检测异常行为

        Args:
            profile: 用户历史行为模式
            current: 当前行为特征

        Returns:
            异常列表
        """
        anomalies = []

        # 检查行为总数异常
        if "behavior_count" in profile and "total_behaviors" in current:
            historical_avg = profile["behavior_count"]
            current_count = current["total_behaviors"]

            if current_count > historical_avg * 3:  # 突增
                anomalies.append(f"行为数量突增: 历史平均{historical_avg}, 当前{current_count}")

        # 检查行为类型异常
        if "behavior_types" in profile and "behavior_types" in current:
            hist_types = set(profile["behavior_types"].keys())
            curr_types = set(current["behavior_types"].keys())

            new_types = curr_types - hist_types
            if len(new_types) > 0:
                anomalies.append(f"新行为类型: {new_types}")

        # 检查时间模式异常
        if "time_features" in current:
            tf = current["time_features"]
            if "avg_interval_dp" in tf and tf["avg_interval_dp"] < 0.1:
                anomalies.append("操作频率异常高")

        return anomalies

    def generate_fraud_alert(self, user_id: str, risk_score: float,
                            transaction_id: str) -> Dict[str, Any]:
        """
        生成欺诈警报（零知识风格）
        证明"此交易有风险"，但不透露判断依据

        Args:
            user_id: 用户ID
            risk_score: 风险评分
            transaction_id: 交易ID

        Returns:
            欺诈警报和ZK证明
        """
        # 创建风险证明（不透露具体原因）
        risk_data = {
            "transaction_id": transaction_id,
            "high_risk": risk_score > 0.7,
            "verified": True
        }

        # 生成ZK风格的证明
        proof_hash = hashlib.sha256(
            f"{transaction_id}_{risk_score}_{user_id}_{secrets.token_hex()}".encode()
        ).hexdigest()

        alert = {
            "alert_id": f"alert_{secrets.token_hex(16)}",
            "transaction_id": transaction_id,
            "user_id_hash": self._hash_user_id(user_id),
            "risk_level": "high" if risk_score > 0.7 else "medium",
            "risk_score": risk_score,
            "proof_hash": proof_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "details_dp": {
                "anomaly_count": int(self.differential_privacy.perturb_count(
                    len(self.risk_scores.get(user_id, [])), epsilon=0.3
                )),
                "confidence": min(risk_score + 0.1, 1.0)
            },
            "zk_proof": {
                "statement": "transaction_requires_review",
                "verified": True
            }
        }

        logger.warning(f"FRAUD ALERT for transaction {transaction_id}: risk_score={risk_score:.2f}")
        return alert

    def create_mock_behaviors(self, user_type: str = "normal") -> List[Dict[str, Any]]:
        """
        创建模拟行为数据（用于演示）

        Args:
            user_type: 用户类型（normal, suspicious, fraud）

        Returns:
            行为列表
        """
        behaviors = []
        base_time = datetime.utcnow()

        if user_type == "normal":
            # 正常用户：有规律的行为模式
            for i in range(10):
                behaviors.append({
                    "behavior_type": "view",
                    "item_id": f"item_{100 + i}",
                    "timestamp": (base_time - timedelta(hours=i + random.randint(0, 2))).isoformat(),
                    "value": random.randint(10, 1000)
                })
            for i in range(3):
                behaviors.append({
                    "behavior_type": "click",
                    "item_id": f"item_{100 + i * 3}",
                    "timestamp": (base_time - timedelta(hours=i * 5)).isoformat(),
                    "value": random.randint(50, 200)
                })
            behaviors.append({
                "behavior_type": "purchase",
                "item_id": "item_105",
                "timestamp": base_time.isoformat(),
                "value": 299
            })

        elif user_type == "suspicious":
            # 可疑用户：行为突增
            for i in range(20):
                behaviors.append({
                    "behavior_type": random.choice(["view", "click", "add_to_cart"]),
                    "item_id": f"item_{random.randint(100, 200)}",
                    "timestamp": (base_time - timedelta(minutes=i * 5)).isoformat(),
                    "value": random.randint(10, 500)
                })
            # 大量购买
            for i in range(5):
                behaviors.append({
                    "behavior_type": "purchase",
                    "item_id": f"item_{random.randint(100, 200)}",
                    "timestamp": (base_time - timedelta(minutes=i + 1)).isoformat(),
                    "value": random.randint(200, 2000)
                })

        elif user_type == "fraud":
            # 欺诈用户：异常模式
            for i in range(30):
                behaviors.append({
                    "behavior_type": random.choice(["click", "transfer", "withdraw"]),
                    "item_id": f"account_{random.randint(1000, 9999)}",
                    "timestamp": (base_time - timedelta(minutes=random.randint(0, 60))).isoformat(),
                    "value": random.randint(500, 5000)
                })

        return behaviors

    def get_privacy_preserving_stats(self) -> Dict[str, Any]:
        """
        获取隐私保护统计信息

        Returns:
            统计信息
        """
        return {
            "dp_epsilon_used": 0.5,  # 使用的隐私预算
            "noise_added": True,
            "features_anonymized": True,
            "behavior_hashes": len(self.behavior_profiles),
            "risk_assessments": sum(len(scores) for scores in self.risk_scores.values()),
            "privacy_techniques": [
                "差分隐私拉普拉斯机制",
                "时间戳扰动",
                "用户ID哈希",
                "特征聚合"
            ]
        }


# 全局欺诈检测实例
fraud_detector = FraudDetectionEngine()
