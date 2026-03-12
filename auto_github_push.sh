#!/bin/bash
# ============================================
# 🚀 Auto-GitHub Push for Super Brain V3
# Automatically commits and pushes after updates
# ============================================

cd ~/Desktop/Stock_Analysis

# Check for changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No changes to push"
    exit 0
fi

# Add all changes
git add -A

# Create commit with description if provided, otherwise auto-generate
if [ -z "$1" ]; then
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
    git commit -m "Super Brain V3 Auto-Update - $TIMESTAMP"
else
    git commit -m "$1"
fi

# Push to GitHub
git push origin main

echo "✅ Auto-push complete!"
