#!/bin/bash

# Start local server if not running
if ! curl -s -o /dev/null http://localhost:8888/; then
    cd "/Users/liu/Desktop/Stock_Analysis"
    python3 -m http.server 8888 > /dev/null 2>&1 &
    sleep 2
fi

# Open the native app
open "/Users/liu/Desktop/NewStrategyApp/NewStrategy.app"
