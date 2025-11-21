#!/bin/bash
echo "=== 主题颜色检查报告 ==="
echo ""
echo "1. 检查剩余的暗色背景："
grep -rn "bg-\[#1E1E2F\]\|bg-\[#000\]\|bg-black[^-]" src/components/walrus/*.tsx | grep -v "text-black" || echo "✓ 没有发现暗色背景"
echo ""
echo "2. 检查青色 (#00BFFF) 残留："
grep -rn "#00BFFF" src/components/walrus/*.tsx || echo "✓ 没有发现青色残留"
echo ""
echo "3. 检查可能不协调的text-white（不在按钮/渐变上）："
grep -rn "text-white" src/components/walrus/*.tsx | grep -v "gradient" | grep -v "from-amber" | grep -v "bg-amber" | wc -l
echo "找到以上数量的text-white（需手动检查是否合理）"
echo ""
echo "4. 检查金色主题是否统一："
grep -rn "#F59E0B\|amber-" src/components/walrus/*.tsx | wc -l
echo "找到以上数量的金色元素"
