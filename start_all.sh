#!/bin/bash
# Start SuperBrain PRO with Live Price Server
echo "Starting Live Price Server..."
cd ~/Desktop/Stock_Analysis/server
node live_price_server.js &
sleep 2
echo "Starting SuperBrain PRO..."
open ~/Desktop/Stock_Analysis/SuperBrainPRO-darwin-arm64/SuperBrainPRO.app
echo "Done! Live prices will update in P&L section."
