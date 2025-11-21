#!/bin/bash

# Color scheme replacement script for white-gold platinum theme
# This script replaces dark/cyan theme colors with white/gold colors

COMPONENTS_DIR="/home/wawahejun/Markov/frontbackend/src/components/walrus"

# File list to update
FILES=(
  "SovereigntyCenter.tsx"
  "PrivacyDiscovery.tsx"
  "EventForge.tsx"
  "ZKEntry.tsx"
  "ReputationSystem.tsx"
  "GovernanceHall.tsx"
)

echo "Starting theme conversion to white-gold platinum..."

for file in "${FILES[@]}"; do
  filepath="$COMPONENTS_DIR/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."
    
    # Backup original
    cp "$filepath" "$filepath.bak"
    
    # Replace dark backgrounds with light backgrounds
    sed -i 's/text-white"/text-gray-800"/g' "$filepath"
    sed -i "s/text-white'/text-gray-800'/g" "$filepath"
    sed -i 's/text-white\\/50/text-gray-600/g' "$filepath"
    sed-i 's/text-white\\/60/text-gray-700/g' "$filepath"
    sed -i 's/text-white\\/70/text-gray-700/g' "$filepath"
    sed -i 's/text-white\\/40/text-gray-500/g' "$filepath"
    sed -i 's/text-white\\/30/text-gray-400/g' "$filepath"
    
    # Replace cyan colors with gold colors
    sed -i 's/#00BFFF/#F59E0B/g' "$filepath"
    sed -i 's/text-\\[#00BFFF\\]/text-amber-600/g' "$filepath"
    sed -i 's/bg-\\[#00BFFF\\]/bg-amber-500/g' "$filepath"
    sed -i 's/border-\\[#00BFFF\\]/border-amber-400/g' "$filepath"
    
    # Replace dark backgrounds
    sed -i 's/bg-\\[#1E1E2F\\]/bg-white\\/95/g' "$filepath"
    sed -i 's/bg-\\[#000\\]/bg-white/g' "$filepath"
    sed -i 's/bg-black/bg-white/g' "$filepath"
    
    # Replace white borders withgold borders
    sed -i 's/border-white\\/10/border-amber-200/g' "$filepath"
    sed -i 's/border-white\\/20/border-amber-300/g' "$filepath"
    sed -i 's/border-white\\/5/border-amber-100/g' "$filepath"
    
    # Replace white backgrounds with appropriate light backgrounds
    sed -i 's/bg-white\\/5/bg-amber-50/g' "$filepath"
    sed -i 's/bg-white\\/10/bg-amber-100\\/50/g' "$filepath"
    sed -i 's/bg-white\\/20/bg-amber-100/g' "$filepath"
    
    echo "✓ $file updated"
  else
    echo "✗ $file not found"
  fi
done

echo "Theme conversion complete!"
echo ""
echo "Backup files created with .bak extension"
echo "To restore originals: for f in $COMPONENTS_DIR/*.bak; do mv \"\$f\" \"\${f%.bak}\"; done"
