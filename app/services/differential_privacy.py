"""
差分隐私保护模块
用于在统计数据中添加噪声以保护用户隐私
基于马尔可夫-差分隐私增强框架
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import hashlib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class LaplaceMechanism:
    """
    拉普拉斯机制 - 实现 ε-差分隐私
    适用于数值型查询，如计数、求和、平均值
    """

    def __init__(self, epsilon: float = 0.1):
        """
        初始化拉普拉斯机制

        Args:
            epsilon: 隐私预算参数 (ε>0)，值越小隐私性越强
        """
        if epsilon <= 0:
            raise ValueError("Epsilon must be positive")

        self.epsilon = epsilon
        logger.info(f"Laplace Mechanism initialized with ε={epsilon}")

    def add_noise(self, value: float, sensitivity: float) -> float:
        """
        向查询结果添加拉普拉斯噪声

        Args:
            value: 原始查询结果
            sensitivity: 查询的灵敏度 (最大变化量)

        Returns:
            添加噪声后的结果
        """
        # 计算尺度参数 b = sensitivity / epsilon
        scale = sensitivity / self.epsilon

        # 从拉普拉斯分布采样噪声
        noise = np.random.laplace(0, scale)

        noisy_value = value + noise

        logger.debug(f"Added Laplace noise: {noise:.4f} to value {value:.4f}")
        return noisy_value

    def add_noise_to_counts(self, counts: Dict[str, int], sensitivity: int = 1) -> Dict[str, float]:
        """
        向计数统计添加噪声，用于保护个体隐私

        Args:
            counts: 原始计数字典，例如 {'Web3': 100, 'DeFi': 50}
            sensitivity: 计数查询的灵敏度（通常默认为1）

        Returns:
            添加噪声后的计数字典
        """
        noisy_counts = {}

        for key, count in counts.items():
            noisy_counts[key] = self.add_noise(float(count), sensitivity)

        # 确保计数不为负
        noisy_counts = {k: max(0.0, v) for k, v in noisy_counts.items()}

        logger.info(f"Added differential privacy to counts for {len(counts)} categories")
        return noisy_counts

    def noisy_histogram(self, data: List[float], bins: int = 10) -> Tuple[List[float], List[float]]:
        """
        生成差分隐私直方图

        Args:
            data: 原始数据列表
            bins: 直方图分箱数量

        Returns:
            bins边界和噪声计数
        """
        # 计算直方图
        hist, bin_edges = np.histogram(data, bins=bins)

        # 为每个箱子添加噪声
        noisy_hist = [self.add_noise(float(count), sensitivity=1) for count in hist]

        # 确保非负
        noisy_hist = [max(0.0, count) for count in noisy_hist]

        return list(bin_edges), noisy_hist


class MarkovDifferentialPrivacy:
    """
    马尔可夫链差分隐私增强框架
    基于马尔可夫链的行为状态转移，对每个状态添加噪声
    """

    def __init__(self, epsilon: float = 0.1, states: List[str] = None):
        """
        初始化马尔可夫差分隐私框架

        Args:
            epsilon: 全局隐私预算
            states: 系统状态列表，如 ['新手', '偶尔参加', '活跃用户', '核心贡献者']
        """
        self.epsilon = epsilon
        self.states = states or ['新手', '偶尔参加', '活跃用户', '核心贡献者', '超级用户']

        # 为每个状态分配隐私预算（简单平均分配）
        self.state_epsilon = epsilon / len(self.states) if len(self.states) > 0 else epsilon

        self.laplace = LaplaceMechanism(self.state_epsilon)

    def privatize_state_counts(self, state_counts: Dict[str, int]) -> Dict[str, float]:
        """
        为马尔可夫链状态计数添加差分隐私噪声

        Args:
            state_counts: 每个状态的用户数量，例如
                         {'新手': 1000, '活跃用户': 500, '核心贡献者': 50}

        Returns:
            添加噪声后的状态计数
        """
        return self.laplace.add_noise_to_counts(state_counts, sensitivity=1)

    def privatize_transition_matrix(self, transition_matrix: Dict[str, List[float]]) -> Dict[str, List[float]]:
        """
        为转移概率矩阵添加噪声，保护状态转移模式的隐私

        Args:
            transition_matrix: 原始转移矩阵
                              {'新手': [0.7, 0.2, 0.08, 0.02, 0.0], ...}

        Returns:
            添加噪声后的转移矩阵
        """
        noisy_matrix = {}

        for state, probabilities in transition_matrix.items():
            # 为每个转移概率添加噪声
            noisy_probs = []

            for i, prob in enumerate(probabilities):
                # 转移概率的灵敏度较小
                noisy_prob = self.laplace.add_noise(prob, sensitivity=0.01)

                # 确保概率在[0,1]范围内
                noisy_prob = max(0.0, min(1.0, noisy_prob))
                noisy_probs.append(noisy_prob)

            # 重新归一化，确保概率和为1
            total = sum(noisy_probs)
            if total > 0:
                noisy_matrix[state] = [p / total for p in noisy_probs]
            else:
                # 如果全被噪声归零，使用均匀分布
                noisy_matrix[state] = [1.0 / len(probabilities)] * len(probabilities)

        logger.info(f"Privatized transition matrix for {len(transition_matrix)} states")
        return noisy_matrix

    def privatize_activity_score(self, user_history: List[str]) -> float:
        """
        为用户的活动参与度评分添加噪声

        根据规划文档中的描述计算：
        ```python
        # 在计算用户活跃度时添加拉普拉斯噪声
        def calculate_activity_score(private_history):
            true_score = len(private_history)  # 真实参加数量
            noise = laplace_noise(epsilon=0.1)  # 添加差分隐私噪声
            return true_score + noise  # 对外只暴露加噪后的分数
        ```

        Args:
            user_history: 用户的加密活动历史

        Returns:
            添加噪声后的活动分数
        """
        true_score = len(user_history)

        # 用户数量变化的灵敏度为1（一个人参加或不参加最多影响计数1）
        noisy_score = self.laplace.add_noise(float(true_score), sensitivity=1)

        # 确保分数非负
        return max(0.0, noisy_score)


class ContextualDifferentialPrivacy:
    """
    上下文感知的差分隐私
    根据数据敏感度和查询类型调整隐私预算
    """

    def __init__(self):
        self.laplace_mechanisms = {}

    def query_with_adaptive_privacy(self, data: Dict, query_type: str, sensitivity_level: str = "medium") -> Dict:
        """
        根据查询类型和数据敏感度自适应选择隐私参数

        Args:
            data: 查询数据
            query_type: 查询类型 (count, sum, mean, histogram)
            sensitivity_level: 敏感度级别 (low, medium, high)

        Returns:
            添加噪声后的查询结果
        """
        # 根据敏感度级别设置不同的隐私预算
        if sensitivity_level == "high":
            epsilon = 0.05  # 高敏感度，强隐私保护
        elif sensitivity_level == "low":
            epsilon = 0.5   # 低敏感度，弱隐私保护
        else:
            epsilon = 0.1   # 默认中等敏感度

        # 创建或使用现有的拉普拉斯机制
        if sensitivity_level not in self.laplace_mechanisms:
            self.laplace_mechanisms[sensitivity_level] = LaplaceMechanism(epsilon)

        laplace = self.laplace_mechanisms[sensitivity_level]

        # 根据查询类型应用差分隐私
        if query_type == "count":
            return {"noisy_count": laplace.add_noise(float(data["count"]), sensitivity=1)}
        elif query_type == "sum":
            return {"noisy_sum": laplace.add_noise(float(data["sum"]), sensitivity=data.get("max_value", 1))}
        elif query_type == "histogram":
            return laplace.add_noise_to_counts(data, sensitivity=1)
        else:
            return {"error": "Unsupported query type"}


class PrivacyDashboard:
    """
    隐私保护仪表板
    提供差分隐私保护的聚合统计和可视化数据
    """

    def __init__(self, epsilon: float = 0.05):
        """
        初始化隐私仪表板

        Args:
            epsilon: 隐私预算（为聚合统计设置较小的值）
        """
        self.laplace = LaplaceMechanism(epsilon)

    def get_privacy_stats(self, event_data: Dict) -> Dict:
        """
        获取差分隐私保护的活动统计信息

        Args:
            event_data: 活动数据
                       {
                           "web3_events": 150,
                           "defi_events": 80,
                           "privacy_events": 60,
                           "total_participants": 4500
                       }

        Returns:
            添加噪声后的统计信息
        """
        privacy_stats = {}

        # 为每类活动的参与者数量添加噪声
        if "participants" in event_data:
            noisy_participants = self.laplace.add_noise(
                float(event_data["participants"]), sensitivity=1
            )
            privacy_stats["noisy_participants"] = max(0.0, noisy_participants)

        # 为活动类别统计添加噪声
        if "event_types" in event_data:
            privacy_stats["event_type_counts"] = self.laplace.add_noise_to_counts(
                event_data["event_types"], sensitivity=1
            )

        # 添加噪声后的活跃度分数
        if "avg_engagement" in event_data:
            privacy_stats["noisy_engagement"] = self.laplace.add_noise(
                float(event_data["avg_engagement"]), sensitivity=0.1
            )

        logger.info("Generated privacy-preserving statistics for dashboard")
        return privacy_stats

    def generate_privacy_report(self, events_privatized: int, users_protected: int) -> Dict:
        """
        生成隐私保护报告

        Args:
            events_privatized: 受保护的活动数量
            users_protected: 受保护的用户数量

        Returns:
            隐私报告
        """
        report = {
            "timestamp": datetime.now(),
            "privacy_budget_used": self.laplace.epsilon,
            "events_privatized": events_privatized,
            "users_protected": users_protected,
            "privacy_framework": "Differentially Private Markov Events",
            "status": "active"
        }

        logger.info(f"Privacy report generated: {users_protected} users protected")
        return report


# 全局实例
laplace_mechanism = LaplaceMechanism(epsilon=0.1)
markov_dp = MarkovDifferentialPrivacy(epsilon=0.1)
contextual_dp = ContextualDifferentialPrivacy()
privacy_dashboard = PrivacyDashboard(epsilon=0.05)
