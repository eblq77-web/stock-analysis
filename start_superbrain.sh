#!/bin/bash
# Super Brain V3 - One-Command Startup
# Usage: ./start_superbrain.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

API_PORT=3898
HTTP_PORT=8080

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}🧠 Super Brain V3 Startup${NC}"
echo "========================================"

# Kill any existing processes on these ports
echo -e "${YELLOW}→ Cleaning up existing processes...${NC}"
lsof -ti :$API_PORT | xargs kill -9 2>/dev/null || true
lsof -ti :$HTTP_PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Start Live API Server (port 3898)
echo -e "${YELLOW}→ Starting Live API Server (port $API_PORT)...${NC}"
cd "$SCRIPT_DIR/live_trading"
node live_api.js >> "$LOG_DIR/live_api_$(date +%Y%m%d).log" 2>&1 &
API_PID=$!
echo "  PID: $API_PID"

sleep 2

# Verify API server is up
if curl -s --max-time 5 http://localhost:$API_PORT/api/paper > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Live API Server running on port $API_PORT${NC}"
else
    echo -e "${RED}  ❌ Live API Server failed to start${NC}"
    echo -e "${RED}  Check: $LOG_DIR/live_api_$(date +%Y%m%d).log${NC}"
    exit 1
fi

# Start HTTP Server (port 8080) - using Node.js for reliability on macOS
echo -e "${YELLOW}→ Starting HTTP Server (port $HTTP_PORT)...${NC}"
cd "$SCRIPT_DIR"
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = $HTTP_PORT;
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

http.createServer((req, res) => {
  let filePath = path.join('$SCRIPT_DIR', req.url === '/' ? '/SUPER_BRAIN_APP_V3.html' : req.url);
  const ext = path.extname(filePath);
  const ct = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': ct});
    res.end(data);
  });
}).listen(PORT, () => console.log('HTTP Server OK on port ' + PORT));
" >> "$LOG_DIR/http_$(date +%Y%m%d).log" 2>&1 &
HTTP_PID=$!
echo "  PID: $HTTP_PID"

sleep 2

# Verify HTTP server is up
if curl -s --max-time 5 http://localhost:$HTTP_PORT/ > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ HTTP Server running on port $HTTP_PORT${NC}"
else
    echo -e "${RED}  ❌ HTTP Server failed to start${NC}"
    echo -e "${RED}  Check: $LOG_DIR/http_$(date +%Y%m%d).log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Super Brain V3 is ready!${NC}"
echo "========================================"
echo -e "  ${CYAN}🌐 Open:${NC} http://localhost:$HTTP_PORT/SUPER_BRAIN_APP_V3.html"
echo -e "  ${CYAN}📊 API:${NC}  http://localhost:$API_PORT/api/paper"
echo ""
echo -e "  📝 Logs: $LOG_DIR"
echo ""
echo -e "  To stop:   ./stop_superbrain.sh"
echo -e "  Or kill:   kill $API_PID $HTTP_PID"
echo ""

# Save PIDs
echo "$API_PID $HTTP_PID" > "$SCRIPT_DIR/.superbrain_pids"
