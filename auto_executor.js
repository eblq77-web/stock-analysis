#!/usr/bin/env node
/**
 * SUPER BRAIN V3 - AUTO EXECUTOR
 * Monitors positions and auto-executes when targets/stops hit
 * Run: node auto_executor.js
 */

const https = require('https');
const fs = require('fs');

const TRADING_FILE = './live_trading/trading_history.json';
const LOG_FILE = './live_trading/auto_executor.log';

const positions = [
  // DAILY - Target +10%, Stop -5%
  { tf: 'DAILY', code: '601012', name: '隆基绿能', entry: 28.46, shares: 1755, target: 31.31, stop: 27.04 },
  { tf: 'DAILY', code: '835670', name: '数字人', entry: 29.14, shares: 1715, target: 32.05, stop: 27.68 },
  { tf: 'DAILY', code: '870299', name: '吉林碳谷', entry: 45.11, shares: 1108, target: 49.62, stop: 42.85 },
  // MID - Target +15%, Stop -10%
  { tf: 'MID', code: '300122', name: '智飞生物', entry: 38.50, shares: 1300, target: 44.28, stop: 34.65 },
  { tf: 'MID', code: '000333', name: '美的集团', entry: 62.50, shares: 800, target: 71.88, stop: 56.25 },
  // LONG - Target +30%, Stop -15%
  { tf: 'LONG', code: '872926', name: '贝特瑞', entry: 68.00, shares: 735, target: 88.40, stop: 57.80 }
];

function log(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, logMsg);
  console.log(logMsg);
}

function getPrice(code) {
  return new Promise((resolve) => {
    const url = 'https://qt.gtimg.cn/q=' + (code.startsWith('0') || code.startsWith('3') || code.startsWith('8') ? 'sz' : 'sh') + code;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/\"([^\"]+)\"/);
          if (match) {
            const parts = match[1].split('~');
            resolve({ code, price: parseFloat(parts[3]), change: parseFloat(parts[5]) });
          } else resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function checkPositions() {
  log('=== CHECKING POSITIONS ===');
  
  const codes = [...new Set(positions.map(p => p.code))];
  const prices = {};
  
  for (const code of codes) {
    const result = await getPrice(code);
    if (result) {
      prices[code] = result.price;
      log(`${code}: ¥${result.price}`);
    }
  }
  
  let totalPnl = 0;
  let actions = [];
  
  for (const pos of positions) {
    const current = prices[pos.code];
    if (!current) continue;
    
    const pnl = ((current - pos.entry) / pos.entry * 100);
    const pnlAmt = (current - pos.entry) * pos.shares;
    totalPnl += pnlAmt;
    
    let action = null;
    let reason = '';
    
    if (current >= pos.target) {
      action = 'SELL';
      reason = `TARGET HIT +${pnl.toFixed(2)}%`;
    } else if (current <= pos.stop) {
      action = 'SELL';
      reason = `STOP HIT ${pnl.toFixed(2)}%`;
    }
    
    if (action) {
      log(`🚨 ${action} ${pos.code} ${pos.name} @ ¥${current} - ${reason}`);
      actions.push({ pos, action, price: current, pnl: pnlAmt });
    }
  }
  
  log(`Total P&L: ¥${totalPnl.toLocaleString()}`);
  log('===========================');
  
  return { actions, totalPnl };
}

// Run check
checkPositions().then(result => {
  if (result.actions.length > 0) {
    log('🎯 ACTIONS TO EXECUTE:');
    result.actions.forEach(a => {
      log(`   ${a.action} ${a.pos.code} ${a.pos.name} @ ¥${a.price}`);
    });
  } else {
    log('⏳ No targets/stops hit - HOLD');
  }
}).catch(err => {
  log('Error: ' + err.message);
});
