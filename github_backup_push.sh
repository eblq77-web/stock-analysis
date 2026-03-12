#!/bin/bash
# ============================================
# 🚀 GitHub Auto-Backup & Push for Super Brain
# ============================================

cd ~/Desktop/Stock_Analysis

echo "🔄 Starting GitHub backup & push..."

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

# Create commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Super Brain Update - $TIMESTAMP"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main

echo "✅ GitHub backup & push complete!"
