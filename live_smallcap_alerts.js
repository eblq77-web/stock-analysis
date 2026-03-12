#!/usr/bin/env node
/**
 * 🎯 SMALL/MID CAP LIVE ALERT SYSTEM
 * Breakout + Breakdown + Premarket Signals
 */

const https = require('https');
const fs = require('fs');

// === SMALL/MID CAP WATCHLIST ===
const SMALL_CAP_WATCHLIST = {
  // Small caps (< ¥10)
  small: [
    'sz002004', 'sz002007', 'sz002008', 'sz300001', 'sz300003', 'sz300006', // 1-x
    'sz300007', 'sz300009', 'sz300010', 'sz300012', 'sz300013', // 3-x
    'bj835670', 'bj870299', 'bj870864', // BSE
  ],
  // Mid caps (¥10-30)
  mid: [
    'sz300014', 'sz300015', 'sz300017', 'sz300018', 'sz300019', // 10-20
    'sz002001', 'sz002006', 'sz002025', 'sz002028', 'sz002029', 'sz002030', // 10-20
    'sz300020', 'sz300021', 'sz300022', 'sz300023', 'sz300024', // 20-30
  ],
  // BSE caps
  bse: [
    'bj835670', 'bj870864', 'bj872926', 'bj870299', 'bj871047', 'bj871049',
    'bj871007', 'bj871031', 'bj871039', 'bj871042', 'bj871051', 'bj871059'
  ]
};

// Combine all
const ALL_WATCHLIST = [...SMALL_CAP_WATCHLIST.small, ...SMALL_CAP_WATCHLIST.mid, ...SMALL_CAP_WATCHLIST.bse];

// === STATE ===
let lastPrices = {};
let lastVolumes = {};
let alertHistory = [];
const ALERT_FILE = '/Users/liu/Desktop/Stock_Analysis/alerts/smallcap_alerts.log';

// Ensure alerts directory exists
if (!fs.existsSync('/Users/liu/Desktop/Stock_Analysis/alerts')) {
  fs.mkdirSync('/Users/liu/Desktop/Stock_Analysis/alerts');
}

// === FETCH DATA ===
function fetchQuote(code) {
  return new Promise((resolve) => {
    https.get(`http://qt.gtimg.cn/q=${code}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parts = data.split('~');
          if (parts[1]) {
            resolve({
              code,
              name: parts[1],
              price: parseFloat(parts[3]) || 0,
              change: parseFloat(parts[4]) || 0,
              volume: parseInt(parts[5]) || 0,
              amount: parseFloat(parts[6]) || 0,
              high: parseFloat(parts[33]) || 0,
              low: parseFloat(parts[34]) || 0,
              open: parseFloat(parts[35]) || 0,
              prevClose: parseFloat(parts[36]) || 0
            });
          } else resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// === DETECT PATTERNS ===

function detectBreakout(stock, prev) {
  const signals = [];
  
  // 1. Price breakout: >5% up with volume surge
  if (stock.change > 5 && stock.volume > prev.volume * 1.5) {
    signals.push({ type: 'BREAKOUT', level: 'HIGH', msg: `🚀 BREAKOUT: ${stock.name} +${stock.change.toFixed(2)}% with volume surge` });
  }
  
  // 2. Premarket gap up
  if (stock.open > stock.prevClose * 1.03 && stock.change > 3) {
    signals.push({ type: 'GAP_UP', level: 'MEDIUM', msg: `⬆️ PREMARKET GAP: ${stock.name} opened above yesterday` });
  }
  
  // 3. Volume breakout
  if (stock.volume > prev.volume * 2) {
    signals.push({ type: 'VOLUME_SURGE', level: 'MEDIUM', msg: `📊 VOLUME SPIKE: ${stock.name} 2x average` });
  }
  
  return signals;
}

function detectBreakdown(stock, prev) {
  const signals = [];
  
  // 1. Price breakdown: >5% down
  if (stock.change < -5) {
    signals.push({ type: 'BREAKDOWN', level: 'HIGH', msg: `🔻 BREAKDOWN: ${stock.name} ${stock.change.toFixed(2)}%` });
  }
  
  // 2. Premarket gap down
  if (stock.open < stock.prevClose * 0.97 && stock.change < -3) {
    signals.push({ type: 'GAP_DOWN', level: 'MEDIUM', msg: `⬇️ PREMARKET DROP: ${stock.name} opened below yesterday` });
  }
  
  // 3. High volume decline
  if (stock.volume > prev.volume * 1.8 && stock.change < -3) {
    signals.push({ type: 'HIGH_VOL_DROP', level: 'MEDIUM', msg: `⚠️ SELLING PRESSURE: ${stock.name} high volume decline` });
  }
  
  return signals;
}

function detectPremarket(stock) {
  const signals = [];
  const hour = new Date().getHours();
  const isPremarket = hour >= 0 && hour < 9;
  
  if (isPremarket || hour < 9) {
    // Premarket momentum
    if (stock.change > 3) {
      signals.push({ type: 'PREMARKET_HOT', level: 'INFO', msg: `🌅 PREMARKET HEAT: ${stock.name} +${stock.change.toFixed(2)}%` });
    }
    if (stock.change < -3) {
      signals.push({ type: 'PREMARKET_COLD', level: 'INFO', msg: `🌙 PREMARKET COLD: ${stock.name} ${stock.change.toFixed(2)}%` });
    }
  }
  
  return signals;
}

// === MAIN SCAN ===
async function scan() {
  console.log(`\n🎯 SMALL/MID CAP ALERT SCAN - ${new Date().toLocaleString()}`);
  console.log('=' .repeat(50));
  
  const results = await Promise.all(ALL_WATCHLIST.map(fetchQuote));
  const stocks = results.filter(s => s !== null && s.price > 0);
  
  let alertCount = 0;
  
  stocks.forEach(stock => {
    const prev = lastPrices[stock.code];
    const prevVol = lastVolumes[stock.code];
    
    // Store current as previous for next run
    lastPrices[stock.code] = stock;
    lastVolumes[stock.code] = stock.volume;
    
    if (!prev) return; // First run, skip
    
    // Detect breakouts
    const breakoutSignals = detectBreakout(stock, prev);
    breakoutSignals.forEach(s => {
      console.log(`✅ ${s.msg}`);
      alertHistory.push({ ...s, time: new Date(), code: stock.code, price: stock.price });
      alertCount++;
    });
    
    // Detect breakdowns
    const breakdownSignals = detectBreakdown(stock, prev);
    breakdownSignals.forEach(s => {
      console.log(`🛑 ${s.msg}`);
      alertHistory.push({ ...s, time: new Date(), code: stock.code, price: stock.price });
      alertCount++;
    });
    
    // Premarket signals
    const pmSignals = detectPremarket(stock);
    pmSignals.forEach(s => {
      console.log(`🌅 ${s.msg}`);
      alertHistory.push({ ...s, time: new Date(), code: stock.code, price: stock.price });
      alertCount++;
    });
  });
  
  // Keep only last 100 alerts
  if (alertHistory.length > 100) {
    alertHistory = alertHistory.slice(-100);
  }
  
  // Save to file
  const logEntry = alertHistory.slice(-20).map(a => 
    `[${a.time.toISOString()}] ${a.type}: ${a.code} @ ¥${a.price} ${a.msg}`
  ).join('\n');
  fs.writeFileSync(ALERT_FILE, logEntry);
  
  console.log('─'.repeat(50));
  console.log(`📊 Scanned: ${stocks.length} stocks | Alerts: ${alertCount}`);
  console.log(`💾 Log saved: ${ALERT_FILE}`);
  
  return alertCount;
}

// === RUN ===
scan().then(count => {
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
