/**
 * Paper Trading Module - Virtual Trading Simulator v1.1
 * Applies Charles's trading rules to scan results
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/liu/Desktop/Stock_Analysis';

const CONFIG = {
    INITIAL_CAPITAL: 1000000,
    MAX_POSITION_PCT: 0.20,
    STOP_LOSS_PCT: -0.07,
    TAKE_PROFIT_PCT: 0.10,
    MATURITY_DATE: '2026-05-31',
    SCAN_DIR: path.join(BASE_DIR, 'daily_overview'),
    OUTPUT_DIR: path.join(BASE_DIR, 'paper_trading'),
    LOG_FILE: 'paper_trading_log.json',
    SIGNALS_FILE: 'trading_signals.json'
};

let state = {
    capital: CONFIG.INITIAL_CAPITAL,
    positions: [],
    closedTrades: [],
    dailyLog: [],
    lastRun: null
};

function loadState() {
    const logPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.LOG_FILE);
    if (fs.existsSync(logPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            state = { ...state, ...data };
            console.log(`📂 Loaded: ${state.positions.length} positions, ${state.closedTrades.length} closed`);
        } catch (e) {
            console.log('⚠️ Starting fresh');
        }
    }
}

function saveState() {
    const logPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.LOG_FILE);
    fs.writeFileSync(logPath, JSON.stringify(state, null, 2));
    console.log('💾 State saved');
}

function getLatestScanResults() {
    if (!fs.existsSync(CONFIG.SCAN_DIR)) return null;
    const files = fs.readdirSync(CONFIG.SCAN_DIR)
        .filter(f => f.startsWith('COMPREHENSIVE_SCAN') && f.endsWith('.txt'))
        .sort().reverse();
    if (files.length === 0) return null;
    
    const content = fs.readFileSync(path.join(CONFIG.SCAN_DIR, files[0]), 'utf8');
    console.log(`📊 Analyzing: ${files[0]}`);
    return parseScanContent(content);
}

function parseScanContent(content) {
    const stocks = [];
    const lines = content.split('\n');
    
    // Pattern: | 1 | 300122 | 智飞生物 | 医药 | 82 | **79.9** | 🟢 BUY |
    for (const line of lines) {
        // Skip header lines
        if (line.includes('---') || line.includes('Rank') || line.includes('| # |')) continue;
        
        // Match markdown table rows with stock data
        const match = line.match(/\|?\s*(\d+)\s*\|\s*(\d{6})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*\*\*?(\d+\.?\d*)\*\*?\s*\|\s*([^|]+?)\s*\|/);
        if (match) {
            stocks.push({
                rank: parseInt(match[1]),
                code: match[2],
                name: match[3].trim(),
                sector: match[4].trim(),
                quality: parseInt(match[5]),
                score: parseFloat(match[6]),
                signal: match[7].trim()
            });
        }
    }
    return stocks.slice(0, 30); // Top 30
}

function detectPatterns(stock) {
    const p = [];
    if (stock.score >= 75) p.push('HIGH_SCORE');
    if (stock.signal.includes('🟢') || stock.signal.includes('BUY')) p.push('BUY_SIGNAL');
    if (stock.code.startsWith('8') || stock.code.startsWith('4')) p.push('HIDDEN_GEM');
    return p;
}

function generateSignals(stocks) {
    const signals = { buy: [], sell: [], watch: [], timestamp: new Date().toISOString() };
    
    // Mock current prices (in real version, fetch live)
    const mockPrices = {};
    for (const s of stocks) {
        mockPrices[s.code] = s.quality * 10 + Math.random() * 50; // Mock price
    }
    
    for (const stock of stocks) {
        const pos = state.positions.find(p => p.code === stock.code);
        const currentPrice = mockPrices[stock.code] || stock.quality * 10;
        
        if (pos) {
            const pnl = (currentPrice - pos.entryPrice) / pos.entryPrice * 100;
            if (pnl <= CONFIG.STOP_LOSS_PCT * 100) {
                signals.sell.push({ ...stock, currentPrice, action: 'STOP_LOSS', pnl, reason: `Stop @ ${pnl.toFixed(2)}%` });
            } else if (pnl >= CONFIG.TAKE_PROFIT_PCT * 100) {
                signals.sell.push({ ...stock, currentPrice, action: 'TAKE_PROFIT', pnl, reason: `Profit @ ${pnl.toFixed(2)}%` });
            } else {
                signals.watch.push({ ...stock, currentPrice, pnl, status: 'HOLDING' });
            }
        } else {
            const patterns = detectPatterns(stock);
            if (stock.score >= 75 && patterns.includes('BUY_SIGNAL')) {
                signals.buy.push({ ...stock, currentPrice, patterns, reason: `Score ${stock.score} + BUY Signal` });
            } else if (stock.score >= 78) {
                signals.buy.push({ ...stock, currentPrice, patterns, reason: `Top Score ${stock.score}` });
            }
        }
    }
    return signals;
}

function executeTrades(signals) {
    for (const s of signals.sell) {
        const idx = state.positions.findIndex(p => p.code === s.code);
        if (idx === -1) continue;
        const p = state.positions[idx];
        const pnl = (s.currentPrice - p.entryPrice) * p.shares;
        const pnlPct = (s.currentPrice - p.entryPrice) / p.entryPrice * 100;
        
        state.closedTrades.push({
            code: p.code, name: p.name, entryPrice: p.entryPrice, exitPrice: s.currentPrice,
            shares: p.shares, entryDate: p.entryDate, exitDate: new Date().toISOString().split('T')[0],
            pnl, pnlPct, reason: s.action,
            holdingDays: Math.floor((new Date() - new Date(p.entryDate)) / (1000*60*60*24))
        });
        state.capital += s.currentPrice * p.shares;
        state.positions.splice(idx, 1);
        console.log(`🔴 SELL ${p.code} @ ${s.currentPrice.toFixed(2)} | ${pnlPct.toFixed(2)}% | ${s.action}`);
    }
    
    for (const s of signals.buy) {
        const maxPos = state.capital * CONFIG.MAX_POSITION_PCT;
        const shares = Math.floor(maxPos / s.currentPrice);
        if (shares < 100) { console.log(`⚠️ Skip ${s.code} - insufficient capital`); continue; }
        const cost = shares * s.currentPrice;
        state.positions.push({
            code: s.code, name: s.name, entryPrice: s.currentPrice, shares,
            entryDate: new Date().toISOString().split('T')[0], sector: s.sector, score: s.score
        });
        state.capital -= cost;
        console.log(`🟢 BUY ${s.code} @ ${s.currentPrice.toFixed(2)} | ${shares} shares | ¥${cost.toFixed(0)}`);
    }
}

function printSummary() {
    const openPnl = state.positions.reduce((sum, p) => sum + (p.shares * p.entryPrice * ((p.pnlPct || 0) / 100)), 0);
    const closedPnl = state.closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnl = openPnl + closedPnl;
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 PAPER TRADING SUMMARY');
    console.log('='.repeat(50));
    console.log(`💰 Capital: ¥${state.capital.toFixed(0)}`);
    console.log(`📊 Open: ${state.positions.length} | Closed: ${state.closedTrades.length}`);
    console.log(`📈 Open P&L: ¥${openPnl.toFixed(0)} | Closed P&L: ¥${closedPnl.toFixed(0)}`);
    console.log(`🎯 Total P&L: ¥${totalPnl.toFixed(0)} (${((totalPnl/CONFIG.INITIAL_CAPITAL)*100).toFixed(2)}%)`);
    console.log('='.repeat(50));
    
    if (state.positions.length > 0) {
        console.log('\n📋 OPEN POSITIONS:');
        for (const p of state.positions) {
            console.log(`  ${p.code} ${p.name} | Entry: ¥${p.entryPrice.toFixed(2)} | ${p.shares} shares`);
        }
    }
}

function run() {
    console.log('\n🎯 PAPER TRADING MODULE v1.1');
    console.log('==============================');
    loadState();
    
    const stocks = getLatestScanResults();
    if (!stocks || stocks.length === 0) { console.log('❌ No stocks found'); return; }
    console.log(`📊 Found ${stocks.length} stocks from scan`);
    
    const signals = generateSignals(stocks);
    console.log(`📈 Signals: ${signals.buy.length} buy, ${signals.sell.length} sell, ${signals.watch.length} hold`);
    
    executeTrades(signals);
    saveState();
    printSummary();
    
    fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, CONFIG.SIGNALS_FILE), JSON.stringify(signals, null, 2));
    console.log(`\n📄 Signals: ${path.join(CONFIG.OUTPUT_DIR, CONFIG.SIGNALS_FILE)}`);
}

run();
