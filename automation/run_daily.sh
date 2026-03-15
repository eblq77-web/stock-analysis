#!/bin/bash
# Daily Automation Runner
# Runs at 9:00 AM daily to generate reports

cd ~/Desktop/Stock_Analysis

# Generate daily report
node automation/daily_automation.js daily

# Get current date for log
DATE=$(date +%Y-%m-%d_%H%M%S)

# Log output
echo "[$DATE] Daily automation completed" >> automation/automation.log

echo "✅ Daily automation complete!"
