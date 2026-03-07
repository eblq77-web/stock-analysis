# Market Trading Schedule

## China A-Share Markets
| Time | Action | Description |
|------|--------|-------------|
| 09:00-09:30 | Pre-Open | Scanner runs, prepare signals |
| 09:30 | Market Open | Execute BUY orders |
| 11:30-13:00 | Lunch Break | Monitor positions |
| 15:00 | Market Close | Execute SELL orders (EOD) |

## Trading Days
- Monday to Friday (excluding holidays)

## Auto-Run Commands
```bash
# Market Open (9:30)
node live_trading/eod_trader.js OPEN

# Market Close (15:00)  
node live_trading/eod_trader.js CLOSE

# Check Performance
node live_trading/eod_trader.js STATUS
```

## Super Brain Rules
- Score ≥ 75 = BUY
- Stop Loss: -7%
- Take Profit: +10%
- Max 8 positions
- Max 20% per position
