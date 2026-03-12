#!/usr/bin/env node
/**
 * 🎯 SMALL/MID CAP LIVE MONITOR
 * Breakout + Breakdown + Premarket Signals
 * Run: node live_smallcap_monitor.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

const ALERT_DIR = '/Users/liu/Desktop/Stock_Analysis/alerts';
if (!fs.existsSync(ALERT_DIR)) fs.mkdirSync(ALERT_DIR, { recursive: true });

const ALERT_FILE = `${ALERT_DIR}/smallcap_live_alerts.log`;
const PREV_FILE = `${ALERT_DIR}/smallcap_prev.json`;

// Watchlist - small & mid caps
const WATCHLIST = [
  // Small caps (< ¥10)
  'sz002004','sz002007','sz300001','sz300003','sz300006','sz300007','sz300009','sz300010','sz300012','sz300013',
  // Mid caps (¥10-30)
  'sz300014','sz300015','sz300017','sz300018','sz300019','sz002001','sz002006','sz002025','sz002028','sz002029','sz002030','sz300020','sz300021',
  // BSE
  'bj835670','bj870864','bj872926','bj870299','bj871047','bj871049','bj871007','bj871031','bj871039','bj871042','bj871051','bj871059'
];

const SMALL_CAPS = WATCHLIST.slice(0, 10);
const MID_CAPS = WATCHLIST.slice(10, 22);

function getType(code) {
  if (SMALL_CAPS.includes(code)) return '🟢 SMALL';
  if (MID_CAPS.includes(code)) return '🟡 MID';
  return '🔵 BSE';
}

function scan() {
  try {
    const output = execSync(`curl -s "http://qt.gtimg.cn/q=${WATCHLIST.join(',')}" | iconv -f GB18030 -t UTF-8`, { timeout: 15000 });
    const lines = output.toString().trim().split('\n');
    
    // Load previous data
    let prevData = {};
    try {
      prevData = JSON.parse(fs.readFileSync(PREV_FILE, 'utf-8'));
    } catch(e) {}
    
    const currentData = {};
    let alerts = [];
    const timestamp = new Date().toLocaleString();
    
    console.log(`\n🎯 SMALL/MID CAP SCAN - ${timestamp}`);
    console.log('='.repeat(50));
    
    lines.forEach(line => {
      const parts = line.split('~');
      if (!parts[1] || !parts[3]) return;
      
      const code = parts[0].replace('v=','');
      const name = parts[1];
      const price = parseFloat(parts[3]);
      const change = parseFloat(parts[4]);
      const volume = parseInt(parts[5]) || 0;
      
      if (price <= 0) return;
      
      currentData[code] = { price, change, volume, name };
      
      const type = getType(code);
      const prev = prevData[code];
      
      if (prev) {
        const volChange = prev.volume > 0 ? (volume / prev.volume - 1) * 100 : 0;
        
        // === BREAKOUT SIGNALS ===
        if (change > 5 && volChange > 30) {
          alerts.push({ sig: '🚀 BREAKOUT', level: 'HIGH', msg: `${type} ${name} +${change.toFixed(2)}% 📊Vol +${volChange.toFixed(0)}%` });
        } else if (change > 8) {
          alerts.push({ sig: '🔥 HOT', level: 'MEDIUM', msg: `${type} ${name} +${change.toFixed(2)}%` });
        } else if (change > 5) {
          alerts.push({ sig: '📈 SURGE', level: 'LOW', msg: `${type} ${name} +${change.toFixed(2)}%` });
        }
        
        // === BREAKDOWN SIGNALS ===
        if (change < -5) {
          alerts.push({ sig: '🔻 BREAKDOWN', level: 'HIGH', msg: `${type} ${name} ${change.toFixed(2)}%` });
        } else if (change < -3) {
          alerts.push({ sig: '📉 DROP', level: 'MEDIUM', msg: `${type} ${name} ${change.toFixed(2)}%` });
        }
      }
    });
    
    // Save current as previous
    fs.writeFileSync(PREV_FILE, JSON.stringify(currentData, null, 2));
    
    // Output alerts
    if (alerts.length === 0) {
      console.log('✅ No breakout/breakdown signals');
    } else {
      // Sort: HIGH first
      alerts.sort((a,b) => (b.level === 'HIGH' ? 1 : 0) - (a.level === 'HIGH' ? 1 : 0));
      alerts.forEach(a => console.log(`${a.sig} ${a.msg}`));
    }
    
    // Log to file
    const logLine = `[${timestamp}] ${alerts.map(a => a.sig + ': ' + a.msg).join(' | ')}`;
    fs.appendFileSync(ALERT_FILE, logLine + '\n');
    
    console.log('─'.repeat(50));
    console.log(`📊 Monitored: ${Object.keys(currentData).length} stocks | Alerts: ${alerts.length}`);
    
    return alerts;
    
  } catch(e) {
    console.error('❌ Scan error:', e.message);
    return [];
  }
}

// Run once
scan();
