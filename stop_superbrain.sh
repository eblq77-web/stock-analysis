#!/bin/bash
# Super Brain V3 - Stop Script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🛑 Stopping Super Brain V3..."

# Kill by PID file if exists
if [ -f "$SCRIPT_DIR/.superbrain_pids" ]; then
    read -r API_PID HTTP_PID < "$SCRIPT_DIR/.superbrain_pids"
    kill $API_PID $HTTP_PID 2>/dev/null || true
    rm -f "$SCRIPT_DIR/.superbrain_pids"
    echo "  ✅ Stopped (PID $API_PID, $HTTP_PID)"
fi

# Fallback: kill by port
lsof -ti :3898 | xargs kill -9 2>/dev/null && echo "  ✅ Port 3898 freed" || true
lsof -ti :8080 | xargs kill -9 2>/dev/null && echo "  ✅ Port 8080 freed" || true

echo "Done."
