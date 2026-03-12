#!/bin/bash
# Auto-backup Super Brain V3 daily

BACKUP_DIR="/Users/liu/Desktop/Stock_Analysis/backups"
SOURCE_FILE="/Users/liu/Desktop/Stock_Analysis/SUPER_BRAIN_APP_V3.html"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)

# Create backup with timestamp
cp "$SOURCE_FILE" "$BACKUP_DIR/SUPER_BRAIN_V3_$TIMESTAMP.html"

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t SUPER_BRAIN_V3_*.html | tail -n +8 | xargs -r rm

echo "✅ Backup created: SUPER_BRAIN_V3_$TIMESTAMP.html"
