#!/bin/bash
# CHARLES'S BRAIN - Daily Automation Cron Script
# Runs at 8:30 AM before market opens

echo "🧠 CHARLES'S BRAIN - Daily Automation"
echo "======================================"
echo "Date: $(date)"

WORK_DIR="$HOME/Desktop/Stock_Analysis"
LOG_FILE="$WORK_DIR/auto_run.log"

# 1. Pre-market analysis
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running pre-market analysis..." >> $LOG_FILE
cd $WORK_DIR && node daily_analyzer_v3_extended.js >> $LOG_FILE 2>&1

# 2. Run proprietary scoring
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running proprietary scoring..." >> $LOG_FILE
cd $WORK_DIR && node proprietary_analyzer.js >> $LOG_FILE 2>&1

# 3. Export dashboard data
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Exporting dashboard data..." >> $LOG_FILE
cd $WORK_DIR && node create_dashboard_data.js >> $LOG_FILE 2>&1

# 4. Run sonar detection
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running sonar detection..." >> $LOG_FILE
cd $WORK_DIR && node sonar_detection.js >> $LOG_FILE 2>&1

echo "✅ Daily automation complete"
echo "=============================="

# Save to memory
echo "[$(date)] Daily analysis completed" >> $HOME/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
