#!/bin/bash
# Daily Stock Analysis - Auto Run
# Runs every weekday at 9:00 AM

cd ~/Desktop/Stock_Analysis
node daily_analyzer_v3.js

echo "✅ Daily analysis complete at $(date)" >> ~/Desktop/Stock_Analysis/daily_run.log
