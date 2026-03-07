#!/bin/bash
# Automated Trading Bot - Charles's Super Brain
# Usage: ./auto_trade.sh [scan|buy|sell|status]

TRADING_DIR="$HOME/Desktop/Stock_Analysis/live_trading"
LOG_DIR="$HOME/Desktop/Stock_Analysis/logs"
ACTION=${1:-scan}

# Create log directory
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/trading_bot.log"
}

log "=== Starting Auto Trade: $ACTION ==="

case $ACTION in
    scan)
        log "Running market scanner..."
        cd "$HOME/Desktop/Stock_Analysis"
        node mega_scanner.js >> "$LOG_DIR/scanner.log" 2>&1
        log "Scanner complete"
        ;;
    buy)
        log "Executing BUY orders..."
        cd "$TRADING_DIR"
        node eod_trader.js OPEN >> "$LOG_DIR/trades.log" 2>&1
        log "Buy orders complete"
        ;;
    sell)
        log "Executing SELL orders..."
        cd "$TRADING_DIR"
        node eod_trader.js CLOSE >> "$LOG_DIR/trades.log" 2>&1
        log "Sell orders complete"
        ;;
    status)
        log "Checking portfolio status..."
        cd "$TRADING_DIR"
        node eod_trader.js STATUS
        ;;
    *)
        log "Unknown action: $ACTION"
        ;;
esac

log "=== Auto Trade Complete ==="
