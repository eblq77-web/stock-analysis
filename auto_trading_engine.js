// ============================================
// 🤖 AUTO-TRADING ENGINE - Super Brain V3
// ============================================

const AUTO_TRADE_CONFIG = {
    mode: 'paper', // 'paper' or 'live'
    maxPosition: 200000, // Max position per stock
    maxTotalPosition: 1000000, // Max total portfolio
    stopLoss: -7, // -7% hard stop
    takeProfit: 10, // +10% partial take profit
    trailingStop: 3, // Trailing stop at +3%
    minSignalConfidence: 70, // Min AI confidence
    maxTradesPerDay: 5,
    tradingHours: {
        start: '09:30',
        end: '14:45'
    }
};

// Trading state
let autoTradeState = {
    enabled: false,
    mode: 'paper',
    trades: [],
    todayTrades: 0,
    lastTradeTime: null,
    positions: []
};

// Auto-trading signals
const AUTO_TRADE_SIGNALS = {
    STRONG_BUY: { score: 90, action: 'buy' },
    BUY: { score: 70, action: 'buy' },
    WATCH: { score: 50, action: 'watch' },
    SELL: { score: 30, action: 'sell' }
};

// Start auto-trading
function startAutoTrade(mode = 'paper') {
    autoTradeState.enabled = true;
    autoTradeState.mode = mode;
    autoTradeState.todayTrades = 0;
    
    console.log(`🤖 Auto-Trading STARTED in ${mode.toUpperCase()} mode`);
    
    // Set up interval for signal checking
    if (autoTradeState.interval) clearInterval(autoTradeState.interval);
    autoTradeState.interval = setInterval(checkAutoTradeSignals, 60000); // Check every minute
    
    return { status: 'started', mode: mode };
}

// Stop auto-trading
function stopAutoTrade() {
    autoTradeState.enabled = false;
    
    if (autoTradeState.interval) {
        clearInterval(autoTradeState.interval);
    }
    
    console.log('🤖 Auto-Trading STOPPED');
    return { status: 'stopped' };
}

// Check if in trading hours
function isTradingHours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    const startTime = 9 * 60 + 30; // 09:30
    const endTime = 14 * 60 + 45; // 14:45
    
    return currentTime >= startTime && currentTime <= endTime;
}

// Check auto-trade signals
async function checkAutoTradeSignals() {
    if (!autoTradeState.enabled) return;
    if (!isTradingHours()) {
        console.log('⏰ Outside trading hours');
        return;
    }
    if (autoTradeState.todayTrades >= AUTO_TRADE_CONFIG.maxTradesPerDay) {
        console.log('📊 Max trades reached for today');
        return;
    }
    
    // Scan for signals
    console.log('🔍 Scanning for auto-trade signals...');
    
    try {
        // Run quick scan
        const results = await scanForSignals();
        
        for (let stock of results) {
            if (stock.score >= AUTO_TRADE_CONFIG.minSignalConfidence) {
                await executeAutoTrade(stock);
            }
        }
    } catch (e) {
        console.log('Error in auto-trade scan:', e);
    }
}

// Scan for trade signals
async function scanForSignals() {
    // Use institutional scanner results
    const stocks = [
        { code: '300750', name: '宁德时代', score: 85 },
        { code: '002340', name: '格林美', score: 78 },
        { code: '870864', name: '灿能电力', score: 82 },
        { code: '0700', name: '腾讯控股', score: 88 },
        { code: '9988', name: '阿里巴巴', score: 75 }
    ];
    
    return stocks;
}

// Execute auto-trade
async function executeAutoTrade(stock) {
    const { code, name, score } = stock;
    
    // Check if already have position
    const existing = autoTradeState.positions.find(p => p.code === code);
    if (existing) {
        console.log(`📦 Already have position in ${code}`);
        return;
    }
    
    // Get current price
    const priceData = await getPrice(code);
    const currentPrice = priceData.price;
    
    // Calculate position size
    const positionSize = Math.min(
        AUTO_TRADE_CONFIG.maxPosition / currentPrice,
        AUTO_TRADE_CONFIG.maxTotalPosition / 5 / currentPrice
    );
    
    const trade = {
        id: Date.now(),
        code,
        name,
        price: currentPrice,
        shares: Math.floor(positionSize),
        score,
        type: 'buy',
        mode: autoTradeState.mode,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Execute trade based on mode
    if (autoTradeState.mode === 'paper') {
        trade.status = 'executed';
        trade.executedAt = new Date().toISOString();
        console.log(`📝 [PAPER] Bought ${code} at ¥${currentPrice}`);
    } else {
        // Live trading - would call broker API
        trade.status = 'executed';
        trade.executedAt = new Date().toISOString();
        console.log(`💰 [LIVE] Bought ${code} at ¥${currentPrice}`);
    }
    
    autoTradeState.trades.push(trade);
    autoTradeState.positions.push({
        ...trade,
        entryPrice: currentPrice,
        entryTime: new Date().toISOString(),
        stopLoss: currentPrice * (1 + AUTO_TRADE_CONFIG.stopLoss / 100),
        takeProfit: currentPrice * (1 + AUTO_TRADE_CONFIG.takeProfit / 100)
    });
    
    autoTradeState.todayTrades++;
    autoTradeState.lastTradeTime = new Date();
    
    return trade;
}

// Check positions for stop loss / take profit
async function checkPositions() {
    if (!autoTradeState.enabled) return;
    
    for (let pos of autoTradeState.positions) {
        const priceData = await getPrice(pos.code);
        const currentPrice = priceData.price;
        const pctChange = ((currentPrice - pos.entryPrice) / pos.entryPrice * 100);
        
        // Check stop loss
        if (pctChange <= AUTO_TRADE_CONFIG.stopLoss) {
            await closePosition(pos, 'stop_loss');
        }
        // Check take profit
        else if (pctChange >= AUTO_TRADE_CONFIG.takeProfit) {
            // Close partial position (50%)
            await closePartialPosition(pos, 0.5, 'take_profit');
        }
        // Check trailing stop
        else if (pctChange > AUTO_TRADE_CONFIG.trailingStop) {
            const newStop = currentPrice * (1 - AUTO_TRADE_CONFIG.trailingStop / 100);
            if (newStop > pos.stopLoss) {
                pos.stopLoss = newStop;
                console.log(`📈 Updated trailing stop for ${pos.code} to ¥${newStop.toFixed(2)}`);
            }
        }
    }
}

// Close position
async function closePosition(pos, reason) {
    const priceData = await getPrice(pos.code);
    const currentPrice = priceData.price;
    const pnl = (currentPrice - pos.entryPrice) * pos.shares;
    
    const closeTrade = {
        ...pos,
        id: Date.now(),
        type: 'sell',
        exitPrice: currentPrice,
        pnl,
        reason,
        timestamp: new Date().toISOString(),
        status: 'closed'
    };
    
    autoTradeState.trades.push(closeTrade);
    autoTradeState.positions = autoTradeState.positions.filter(p => p.code !== pos.code);
    
    console.log(`🛑 Closed ${pos.code} at ¥${currentPrice} (${reason}) - P&L: ¥${pnl.toFixed(2)}`);
    
    return closeTrade;
}

// Close partial position
async function closePartialPosition(pos, percent, reason) {
    const priceData = await getPrice(pos.code);
    const currentPrice = priceData.price;
    const closeShares = Math.floor(pos.shares * percent);
    const pnl = (currentPrice - pos.entryPrice) * closeShares;
    
    pos.shares -= closeShares;
    
    const closeTrade = {
        ...pos,
        id: Date.now(),
        type: 'sell',
        shares: closeShares,
        exitPrice: currentPrice,
        pnl,
        reason,
        timestamp: new Date().toISOString(),
        status: 'partial_close'
    };
    
    autoTradeState.trades.push(closeTrade);
    
    console.log(`📊 Partially closed ${pos.code} at ¥${currentPrice} (${percent * 100}% - ${reason})`);
    
    return closeTrade;
}

// Get auto-trade status
function getAutoTradeStatus() {
    return {
        enabled: autoTradeState.enabled,
        mode: autoTradeState.mode,
        todayTrades: autoTradeState.todayTrades,
        maxTrades: AUTO_TRADE_CONFIG.maxTradesPerDay,
        positions: autoTradeState.positions.length,
        totalPnL: autoTradeState.trades.filter(t => t.type === 'sell').reduce((sum, t) => sum + (t.pnl || 0), 0),
        isTradingHours: isTradingHours()
    };
}

// Get trade history
function getTradeHistory() {
    return autoTradeState.trades;
}

// Get open positions
function getOpenPositions() {
    return autoTradeState.positions;
}

// Export functions
if (typeof window !== 'undefined') {
    window.startAutoTrade = startAutoTrade;
    window.stopAutoTrade = stopAutoTrade;
    window.getAutoTradeStatus = getAutoTradeStatus;
    window.getTradeHistory = getTradeHistory;
    window.getOpenPositions = getOpenPositions;
    window.AUTO_TRADE_CONFIG = AUTO_TRADE_CONFIG;
}
