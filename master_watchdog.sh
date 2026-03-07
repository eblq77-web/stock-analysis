#!/bin/bash

# ===========================================
# CHARLES'S STOCK ANALYSIS - MASTER WATCHDOG
# Auto-run daily at market open
# ===========================================

LOGFILE="/tmp/charles_stock_analysis.log"
STOCK_DIR="$HOME/Desktop/Stock_Analysis"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

cd "$STOCK_DIR"

log "========================================"
log "🎯 Charles's Stock Analysis Starting"
log "========================================"

# Run all analysis modules
log "1/4 Running proprietary analyzer..."
node proprietary_analyzer.js >> "$LOGFILE" 2>&1

log "2/4 Running extended portfolio..."
node daily_analyzer_v3_extended.js >> "$LOGFILE" 2>&1

log "3/4 Running smart money tracking..."
node smart_money_v5.js >> "$LOGFILE" 2>&1

log "4/4 Running market intelligence..."
node market_intel_v3.js >> "$LOGFILE" 2>&1

log "========================================"
log "✅ Daily Analysis Complete!"
log "========================================"
log "Files generated:"
ls -la "$STOCK_DIR/daily_overview/"*.md | tail -5

log "Next run: Tomorrow 9:25 AM"
