#!/usr/bin/env python3
"""
主题颜色批量替换脚本：将暗色/青色主题转换为白金色主题
"""
import re
from pathlib import Path

# 要更新的文件列表
files_to_update = [
    "SovereigntyCenter.tsx",
    "PrivacyDiscovery.tsx",
    "EventForge.tsx",
    "ZKEntry.tsx",
    "ReputationSystem.tsx",
    "GovernanceHall.tsx"
]

components_dir = Path("src/components/walrus")

# 颜色替换规则 (旧颜色 -> 新颜色)
replacements = [
    # 基础文字颜色
    ("text-white\"", "text-gray-800\""),
    ("text-white'", "text-gray-800'"),
    ("text-white/70", "text-gray-700"),
    ("text-white/60", "text-gray-700"),
    ("text-white/50", "text-gray-600"),
    ("text-white/40", "text-gray-500"),
    ("text-white/30", "text-gray-400"),
    ("text-white/90", "text-gray-900"),
    
    # 青色到金色
    ("#00BFFF", "#F59E0B"),
    ("text-\\[#00BFFF\\]", "text-amber-600"),
    ("bg-\\[#00BFFF\\]", "bg-amber-500"),
    ("border-\\[#00BFFF\\]", "border-amber-400"),
    ("from-\\[#00BFFF\\]", "from-amber-500"),
    ("to-\\[#00BFFF\\]", "to-amber-500"),
    
    # 暗色背景到亮色背景
    ("bg-\\[#1E1E2F\\]/90", "bg-white/95"),
    ("bg-\\[#1E1E2F\\]/80", "bg-white/90"),
    ("bg-\\[#000\\]/90", "bg-white/95"),
    ("bg-\\[#000\\]/40", "bg-white/80"),
    ("bg-\\[#000\\]/30", "bg-white/70"),
    ("bg-\\[#151520\\]", "bg-white"),
    ("bg-black", "bg-white"),
    
    # 边框颜色
    ("border-white/10", "border-amber-200"),
    ("border-white/20", "border-amber-300"),
    ("border-white/5", "border-amber-100"),
    ("border-white/30", "border-amber-300"),
    
    # 背景颜色
    ("bg-white/5", "bg-amber-50"),
    ("bg-white/10", "bg-amber-100/50"),
    ("bg-white/20", "bg-amber-100"),
]

def update_file(filepath):
    """更新单个文件的主题颜色"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用所有替换规则
        for old, new in replacements:
            content = content.replace(old, new)
        
        # 只有在内容发生变化时才写入
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {filepath.name}")
            return True
        else:
            print(f"○ No changes: {filepath.name}")
            return False
            
    except Exception as e:
        print(f"✗ Error updating {filepath.name}: {e}")
        return False

def main():
    print("开始更新主题颜色为白金色...")
    print("=" * 50)
    
    updated_count = 0
    for filename in files_to_update:
        filepath = components_dir / filename
        if filepath.exists():
            if update_file(filepath):
                updated_count += 1
        else:
            print(f"✗ File not found: {filename}")
    
    print("=" * 50)
    print(f"完成! 更新了 {updated_count} 个文件")

if __name__ == "__main__":
    main()
