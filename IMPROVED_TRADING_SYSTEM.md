# IMPROVED TRADING SYSTEM v2.0

## Problem Diagnosis
1. Pick stocks based on price only
2. No real-time momentum check
3. No sector flow integration
4. Entry at market open (worst time)
5. No volume confirmation

---

## New System Phases

### PHASE 1: PRE-MARKET (9:00-9:25 AM)
1. Scan sector flows
2. Identify top 3 sectors
3. Get institutional picks
4. Create watchlist (20 stocks)

### PHASE 2: MARKET OPEN (9:30-9:45 AM)
1. DO NOT BUY ANYTHING
2. Watch price stabilization
3. Monitor volume patterns

### PHASE 3: ENTRY (9:45-10:00 AM)
1. Filter: Change > 0
2. Filter: Volume > 500K
3. Filter: Sector in top 3
4. Filter: Price in range
5. Execute max 3 stocks

### PHASE 4: MONITOR (10:00-14:30 PM)
1. Check every 30 min
2. Take profit at +5%
3. Stop loss at -3%

### PHASE 5: EXIT (14:30-15:00 PM)
1. Close all daily positions
2. Record results
3. Self-correct

---

## Picking Algorithm (5-Step Filter)

### STEP 1: SECTOR FILTER (30%)
- ✅ Positive flow: 科技, 新能源, 消费, 医药, AI
- ❌ Negative flow: 金融, 地产, 能源, 钢铁

### STEP 2: MOMENTUM FILTER (25%)
- ✅ Change > 0% (at entry time)
- ✅ RSI 40-70 (not overbought)
- ✅ Price above MA20

### STEP 3: VOLUME FILTER (20%)
- ✅ Volume > 500K
- ✅ Volume > 20-day average

### STEP 4: INSTITUTIONAL FILTER (15%)
- ✅ Institutional score > 90
- ✅ Smart money inflow

### STEP 5: PRICE FILTER (10%)
- ✅ ¥25-40 range

---

## Scoring System
Stock Score = (Sector x 30%) + (Momentum x 25%) + (Volume x 20%) + (Institution x 15%) + (Price x 10%)

**Must score > 80 to buy**

---

## Tomorrow's Execution Plan
1. 9:30 AM - Check sector flows
2. 9:45 AM - Apply all filters
3. 10:00 AM - Execute with 10% position
4. Monitor every 30 min
5. Exit by 3:00 PM

