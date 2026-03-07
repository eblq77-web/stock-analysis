/**
 * End-of-Day Trading System
 * Runs at market open (9:30) and close (15:00)
 * Auto-executes based on Super Brain signals
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/liu/Desktop/Stock_Analysis';
const TRADING_LOG = path.join(BASE_DIR, 'live_trading', 'trading_history.json');

// Trading configuration
const CONFIG = {
    MODE: 'PAPER', // PAPER or LIVE
    CAPITAL: 1000000,
    MAX_POSITION: 0.20,    // 20% max per stock
    STOP_LOSS: -0.07,       // -7%
    TAKE_PROFIT: 0.10,      // +10%
    MIN_SCORE: 75,          // Minimum score to buy
    MAX_POSITIONS: 8        // Max 8 positions
};

// Load trading history
function loadHistory() {
    if (fs.existsSync(TRADING_LOG)) {
        return JSON.parse(fs.readFileSync(TRADING_LOG, 'utf8'));
    }
    return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalPnl: 0,
        daily: [],
        lastUpdate: null
    };
}

function saveHistory(history) {
    history.lastUpdate = new Date().toISOString();
    fs.writeFileSync(TRADING_LOG, JSON.stringify(history, null, 2));
}

// Load current portfolio
async function loadPortfolio() {
    const res = await fetch('http://localhost:3899/api/data');
    return await res.json();
}

// EOD Trading Logic
async function runEODTrading(action) {
    console.log('\n' + '='.repeat(60));
    console.log(`🧠 EOD TRADING - ${action.toUpperCase()}`);
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    const history = loadHistory();
    const portfolio = await loadPortfolio();
    const log = portfolio.log;
    const signals = portfolio.signals;
    
    console.log(`\n💰 Capital: ¥${log.capital.toLocaleString()}`);
    console.log(`📊 Open Positions: ${log.positions.length}`);
    
    const trades = [];
    
    // === MARKET OPEN: Check for BUY opportunities ===
    if (action === 'OPEN') {
        console.log('\n🟢 CHECKING BUY SIGNALS...');
        
        // Get top buy signals
        const buyCandidates = signals.buy
            .filter(s => s.score >= CONFIG.MIN_SCORE)
            .slice(0, 5);
        
        for (const stock of buyCandidates) {
            // Check if already owned
            if (log.positions.find(p => p.code === stock.code)) continue;
            
            // Check position limit
            if (log.positions.length >= CONFIG.MAX_POSITIONS) {
                console.log(`⚠️ Max positions reached (${CONFIG.MAX_POSITIONS})`);
                break;
            }
            
            // Calculate position size
            const maxAmount = log.capital * CONFIG.MAX_POSITION;
            const shares = Math.floor(maxAmount / stock.currentPrice);
            
            if (shares < 100) {
                console.log(`⚠️ Insufficient capital for ${stock.code}`);
                continue;
            }
            
            // Execute buy (would need API call here)
            const trade = {
                action: 'BUY',
                code: stock.code,
                name: stock.name,
                price: stock.currentPrice,
                shares: shares,
                value: stock.currentPrice * shares,
                score: stock.score,
                timestamp: new Date().toISOString(),
                status: CONFIG.MODE === 'PAPER' ? 'PAPER' : 'PENDING'
            };
            
            trades.push(trade);
            console.log(`   🟢 BUY: ${stock.code} ${stock.name} @ ¥${stock.currentPrice.toFixed(2)} x ${shares} = ¥${(stock.currentPrice*shares).toLocaleString()}`);
        }
    }
    
    // === MARKET CLOSE: Check for SELL signals ===
    else if (action === 'CLOSE') {
        console.log('\n🔴 CHECKING SELL SIGNALS...');
        
        for (const pos of log.positions) {
            // In real version, fetch current price
            const currentPrice = pos.entryPrice * (1 + (Math.random() - 0.4) * 0.2); // Mock
            const pnlPct = (currentPrice - pos.entryPrice) / pos.entryPrice;
            
            let reason = 'HOLD';
            let shouldSell = false;
            
            // Stop loss
            if (pnlPct <= CONFIG.STOP_LOSS) {
                reason = 'STOP_LOSS';
                shouldSell = true;
            }
            // Take profit
            else if (pnlPct >= CONFIG.TAKE_PROFIT) {
                reason = 'TAKE_PROFIT';
                shouldSell = true;
            }
            
            if (shouldSell) {
                const trade = {
                    action: 'SELL',
                    code: pos.code,
                    name: pos.name,
                    entryPrice: pos.entryPrice,
                    exitPrice: currentPrice,
                    shares: pos.shares,
                    pnl: (currentPrice - pos.entryPrice) * pos.shares,
                    pnlPct: pnlPct * 100,
                    reason: reason,
                    timestamp: new Date().toISOString(),
                    status: CONFIG.MODE === 'PAPER' ? 'PAPER' : 'PENDING'
                };
                
                trades.push(trade);
                
                // Update history
                history.totalTrades++;
                if (trade.pnl > 0) {
                    history.wins++;
                } else {
                    history.losses++;
                }
                history.totalPnl += trade.pnl;
                
                console.log(`   🔴 SELL: ${pos.code} ${pos.name} @ ¥${currentPrice.toFixed(2)} | P&L: ¥${trade.pnl.toLocaleString()} (${trade.pnlPct.toFixed(2)}%) | ${reason}`);
            }
        }
    }
    
    // Save daily summary
    const dailySummary = {
        date: new Date().toISOString().split('T')[0],
        action: action,
        trades: trades,
        capital: log.capital,
        positions: log.positions.length
    };
    
    history.daily.push(dailySummary);
    
    // Keep only last 30 days
    if (history.daily.length > 30) {
        history.daily = history.daily.slice(-30);
    }
    
    saveHistory(history);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRADING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Trades: ${history.totalTrades}`);
    console.log(`Wins: ${history.wins} | Losses: ${history.losses}`);
    console.log(`Win Rate: ${history.totalTrades > 0 ? (history.wins/history.totalTrades*100).toFixed(1) : 0}%`);
    console.log(`Total P&L: ¥${history.totalPnl.toLocaleString()}`);
    console.log('='.repeat(60));
    
    return { history, trades };
}

// Print performance report
function printPerformance() {
    const history = loadHistory();
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 PERFORMANCE REPORT');
    console.log('='.repeat(60));
    console.log(`Total Trades: ${history.totalTrades}`);
    console.log(`Wins: ${history.wins} | Losses: ${history.losses}`);
    console.log(`Win Rate: ${history.totalTrades > 0 ? (history.wins/history.totalTrades*100).toFixed(1) : 0}%`);
    console.log(`Total P&L: ¥${history.totalPnl.toLocaleString()}`);
    console.log('='.repeat(60));
    
    // Recent trades
    console.log('\n📜 RECENT TRADES:');
    for (const day of history.daily.slice(-5).reverse()) {
        console.log(`\n${day.date} (${day.action}):`);
        for (const t of day.trades) {
            const pnl = t.action === 'SELL' ? ` | P&L: ¥${t.pnl?.toLocaleString() || 0}` : '';
            console.log(`   ${t.action} ${t.code} ${t.name}${pnl}`);
        }
    }
    
    return history;
}

// Export
module.exports = { runEODTrading, printPerformance, loadHistory, CONFIG };

// Run if executed
if (require.main === module) {
    const action = process.argv[2] || 'STATUS';
    
    if (action === 'OPEN') {
        runEODTrading('OPEN');
    } else if (action === 'CLOSE') {
        runEODTrading('CLOSE');
    } else {
        printPerformance();
    }
}
