/**
 * Live Trading Module - Super Brain System
 * Supports: A-Share (SH/SZ), HK, US markets
 * Broker: Futu API (most popular for CN/HK)
 */

const fs = require('fs');
const path = require('path');

// ============= CONFIG =============
const CONFIG = {
    // Trading Mode
    MODE: 'PAPER', // Change to 'LIVE' when ready
    
    // Broker Configuration
    BROKER: 'FUTU', // Futu, Tiger, IB
    
    // Risk Controls (CRITICAL)
    MAX_POSITION_PCT: 0.20,      // Max 20% per stock
    MAX_LOSS_PCT: -0.07,         // -7% stop loss
    TAKE_PROFIT_PCT: 0.10,       // +10% take profit
    DAILY_LOSS_LIMIT: -50000,    // -50k daily limit
    MAX_TRADES_PER_DAY: 10,       // Max 10 trades/day
    
    // Markets
    MARKETS: {
        A: { prefix: '', name: 'A-Share' },
        HK: { prefix: 'hk', name: 'Hong Kong' },
        US: { prefix: 'us', name: 'US Stock' }
    },
    
    // File Paths
    DATA_DIR: path.join(__dirname, 'data'),
    ORDERS_FILE: 'orders.json',
    POSITIONS_FILE: 'positions.json',
    CONFIG_FILE: 'config.json',
    
    // API Endpoints (Futu example)
    FUTU_CONFIG: {
        host: '127.0.0.1',
        port: 11111,
        enable_encrypt: false
    }
};

// ============= STATE =============
let state = {
    mode: CONFIG.MODE,
    capital: 1000000,
    todayTrades: 0,
    todayPnl: 0,
    orders: [],
    positions: [],
    lastTradeDate: null
};

// ============= FILE OPERATIONS =============
function loadState() {
    const ordersPath = path.join(CONFIG.DATA_DIR, CONFIG.ORDERS_FILE);
    const posPath = path.join(CONFIG.DATA_DIR, CONFIG.POSITIONS_FILE);
    
    if (fs.existsSync(ordersPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
            state = { ...state, ...data };
            console.log('📂 Loaded trading state');
        } catch(e) {}
    }
}

function saveState() {
    const ordersPath = path.join(CONFIG.DATA_DIR, CONFIG.ORDERS_FILE);
    fs.writeFileSync(ordersPath, JSON.stringify(state, null, 2));
}

// ============= STOCK CODE PARSER =============
function parseStockCode(code) {
    // HK stocks: 0700 (Tencent), 9988 (Alibaba)
    // A stocks: 600000 (SH), 000001 (SZ), 300001 (ChiNext)
    // US stocks: AAPL, TSLA
    
    let market = 'A';
    let symbol = code;
    
    if (code.startsWith('hk') || code.startsWith('HK')) {
        market = 'HK';
        symbol = code.replace(/^(hk|HK)/, '');
    } else if (/^[A-Z]+$/i.test(code) && !/^\d+$/.test(code)) {
        market = 'US';
    } else if (code.startsWith('6')) {
        market = 'A-SH'; // Shanghai
    } else if (code.startsWith('0') || code.startsWith('3')) {
        market = 'A-SZ'; // Shenzhen
    } else if (code.startsWith('8') || code.startsWith('4')) {
        market = 'BSE'; // Beijing
    }
    
    return { market, symbol, fullCode: code };
}

// ============= PRICE FETCHER =============
async function fetchPrice(code) {
    const { market, symbol } = parseStockCode(code);
    
    try {
        if (market === 'HK') {
            // Fetch HK stock price
            const url = `https://qt.gtimg.cn/q=rt_hk${symbol}`;
            // Implementation for HK
        } else if (market === 'US') {
            // Fetch US stock price
        }
        
        // For now, return mock price for testing
        return { price: 0, change: 0, volume: 0 };
    } catch(e) {
        console.error('Price fetch error:', e);
        return null;
    }
}

// ============= ORDER EXECUTOR =============
async function executeOrder(order) {
    const { code, name, action, price, shares, type } = order;
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 ORDER EXECUTION`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Mode: ${CONFIG.MODE}`);
    console.log(`Action: ${action} ${code} ${name}`);
    console.log(`Price: ¥${price} × ${shares} shares`);
    console.log(`Total: ¥${(price * shares).toLocaleString()}`);
    console.log(`${'='.repeat(50)}`);
    
    if (CONFIG.MODE === 'PAPER') {
        // Paper trading execution
        return executePaperOrder(order);
    } else {
        // Live trading execution
        return executeLiveOrder(order);
    }
}

function executePaperOrder(order) {
    const { code, action, price, shares } = order;
    
    if (action === 'BUY') {
        const cost = price * shares;
        if (cost > state.capital) {
            return { success: false, error: 'Insufficient capital' };
        }
        
        state.positions.push({
            code, 
            name: order.name,
            entryPrice: price,
            shares,
            entryDate: new Date().toISOString().split('T')[0],
            sector: order.sector || 'N/A',
            score: order.score || 75
        });
        state.capital -= cost;
        
    } else if (action === 'SELL') {
        const idx = state.positions.findIndex(p => p.code === code);
        if (idx === -1) {
            return { success: false, error: 'Position not found' };
        }
        
        const p = state.positions[idx];
        state.capital += price * p.shares;
        state.positions.splice(idx, 1);
        
        const pnl = (price - p.entryPrice) * p.shares;
        state.todayPnl += pnl;
    }
    
    state.orders.push({
        ...order,
        executeTime: new Date().toISOString(),
        status: 'FILLED',
        mode: 'PAPER'
    });
    
    state.todayTrades++;
    state.lastTradeDate = new Date().toISOString().split('T')[0];
    saveState();
    
    return { success: true };
}

async function executeLiveOrder(order) {
    // This would connect to broker API
    console.log('🔴 LIVE TRADING - Not yet configured');
    console.log('Broker:', CONFIG.BROKER);
    console.log('Order would be sent to broker API');
    
    // Placeholder for actual broker API call
    /*
    const futu = require('futu-api');
    const conn = new futu.OpenDConnection(CONFIG.FUTU_CONFIG);
    await conn.connect();
    
    const result = await conn.placeOrder({
        code: order.code,
        price: order.price,
        qty: order.shares,
        side: order.action === 'BUY' ? 'BUY' : 'SELL'
    });
    */
    
    return { success: false, error: 'Live trading not configured' };
}

// ============= SIGNAL CHECKER =============
async function checkSignals() {
    const signals = {
        buy: [],
        sell: [],
        watch: []
    };
    
    // Check each position for exit signals
    for (const pos of state.positions) {
        const price = await fetchPrice(pos.code);
        
        if (!price) continue;
        
        const pnlPct = (price.price - pos.entryPrice) / pos.entryPrice * 100;
        
        // Stop loss
        if (pnlPct <= CONFIG.MAX_LOSS_PCT * 100) {
            signals.sell.push({
                ...pos,
                currentPrice: price.price,
                pnl: pnlPct,
                reason: 'STOP_LOSS',
                action: 'SELL'
            });
        }
        // Take profit
        else if (pnlPct >= CONFIG.TAKE_PROFIT_PCT * 100) {
            signals.sell.push({
                ...pos,
                currentPrice: price.price,
                pnl: pnlPct,
                reason: 'TAKE_PROFIT',
                action: 'SELL'
            });
        }
        // Continue holding
        else {
            signals.watch.push({
                ...pos,
                currentPrice: price.price,
                pnl: pnlPct
            });
        }
    }
    
    return signals;
}

// ============= MAIN =============
async function run() {
    console.log('\n' + '='.repeat(50));
    console.log('🧠 SUPER BRAIN LIVE TRADING SYSTEM');
    console.log('='.repeat(50));
    console.log(`Mode: ${CONFIG.MODE}`);
    console.log(`Broker: ${CONFIG.BROKER}`);
    console.log(`Risk Control: -${Math.abs(CONFIG.MAX_LOSS_PCT*100)}% stop loss`);
    console.log('='.repeat(50));
    
    loadState();
    
    // Check for trading signals
    const signals = await checkSignals();
    
    console.log(`\n📊 Status: ${signals.watch.length} holding, ${signals.sell.length} sell signals`);
    
    if (signals.sell.length > 0) {
        console.log('\n🔴 SELL SIGNALS:');
        for (const s of signals.sell) {
            console.log(`  ${s.code} ${s.name} - ${s.reason} (${s.pnl.toFixed(2)}%)`);
            
            // Auto-execute in LIVE mode
            if (CONFIG.MODE === 'PAPER') {
                await executeOrder({
                    code: s.code,
                    name: s.name,
                    action: 'SELL',
                    price: s.currentPrice,
                    shares: s.shares
                });
            }
        }
    }
    
    saveState();
    return signals;
}

// Export for module use
module.exports = {
    CONFIG,
    run,
    executeOrder,
    parseStockCode,
    setMode: (mode) => { CONFIG.MODE = mode; },
    setBroker: (broker) => { CONFIG.BROKER = broker; }
};

// Run if executed directly
if (require.main === module) {
    run();
}
