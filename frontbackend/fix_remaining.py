#!/usr/bin/env python3
"""
修复剩余的主题不一致问题
"""
import re
from pathlib import Path

files_to_fix = {
    "SovereigntyCenter.tsx": [
        ('text-3xl font-bold text-white tracking-tight', 'text-3xl font-bold text-gray-800 tracking-tight'),
    ],
    "ZKEntry.tsx": [
        ('text-xl font-bold text-white', 'text-xl font-bold text-gray-800'),
        ('text-sm font-bold text-white', 'text-sm font-bold text-gray-800'),
        ('bg-\\[#1E1E2F\\]', 'bg-white/95'),
        ('border-amber-300 text-white', 'border-amber-300 text-amber-700'),
    ],
    "GovernanceHall.tsx": [
        ('text-xl font-bold text-white mb-2', 'text-xl font-bold text-gray-800 mb-2'),
    ],
    "ReputationSystem.tsx": [
        ('text-sm font-bold text-white', 'text-sm font-bold text-gray-800'),
        ('bg-\\[#5865F2\\]', 'bg-purple-500'),
        ('bg-\\[#1DA1F2\\]', 'bg-blue-500'),
    ],
    "EventForge.tsx": [
        ('to-blue-600', 'to-yellow-600'),
    ],
}

components_dir = Path("src/components/walrus")

def fix_file(filename, replacements):
    filepath = components_dir / filename
    if not filepath.exists():
        print(f"✗ File not found: {filename}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in replacements:
        content = re.sub(old, new, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {filename}")
        return True
    else:
        print(f"○ No changes needed: {filename}")
        return False

print("修复剩余的主题不一致...")
print("=" * 50)

fixed_count = 0
for filename, replacements in files_to_fix.items():
    if fix_file(filename, replacements):
        fixed_count += 1

print("=" * 50)
print(f"完成! 修复了 {fixed_count} 个文件")
