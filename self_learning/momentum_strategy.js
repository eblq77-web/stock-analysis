#!/usr/bin/env node
/**
 * 📈 MOMENTUM STRATEGY ENGINE
 * Early breakout detection and momentum trading signals
 * 
 * Strategy:
 * 1. Spot momentum early
 * 2. Ride the trend
 * 3. Exit before exhaustion
 */

const https = require('https');
const fs = require('fs');

const OUTPUT_FILE = '/Users/liu/Desktop/Stock_Analysis/daily_overview/momentum_strategy.md';

// === MOMENTUM WATCHLIST ===
const MOMENTUM_STOCKS = [
  // Hot momentum stocks
  'sz300001','sz300003','sz300006','sz300014','sz300015','sz300017',
  'sz300018','sz300019','sz300020','sz300021','sz300022','sz300023',
  'sz300024','sz300025','sz300026','sz300027','sz300028','sz300029',
  'sz300030','sz002004','sz002007','sz002025','sz002027','sz002028',
  'bj835670','bj870299','bj870864','bj872926','bj871047','bj871049'
];

// === FETCH DATA ===
function fetchQuotes(codes) {
  return new Promise((resolve) => {
    const url = `http://qt.gtimg.cn/q=${codes.join(',')}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.trim().split('\n');
        const results = lines.map(line => {
          const parts = line.split('~');
          if (!parts[1] || !parts[3]) return null;
          
          return {
            code: parts[0].replace('v=', ''),
            name: parts[1],
            price: parseFloat(parts[3]) || 0,
            change: parseFloat(parts[4]) || 0,
            volume: parseInt(parts[5]) || 0,
            amount: parseFloat(parts[6]) || 0,
            high: parseFloat(parts[33]) || 0,
            low: parseFloat(parts[34]) || 0,
            open: parseFloat(parts[35]) || 0,
            prevClose: parseFloat(parts[36]) || 0
          };
        }).filter(s => s && s.price > 0);
        resolve(results);
      });
    }).on('error', () => resolve([]));
  });
}

// === MOMENTUM SIGNALS ===
function calculateMomentum(stock) {
  const signals = {
    score: 0,
    signals: [],
    action: 'WAIT',
    entry: null,
    stop: null,
    target: null
  };
  
  const { price, change, volume, open, prevClose, high, low } = stock;
  
  // === MOMENTUM FACTORS ===
  
  // 1. Price Momentum (0-25)
  if (change > 15) { signals.score += 25; signals.signals.push('🔥 STRONG MOMENTUM'); }
  else if (change > 10) { signals.score += 20; signals.signals.push('🚀 BREAKOUT'); }
  else if (change > 5) { signals.score += 15; signals.signals.push('📈 UPTREND'); }
  else if (change > 3) { signals.score += 10; signals.signals.push('➡️ BUILDING'); }
  else if (change > 0) { signals.score += 5; signals.signals.push('👀 EARLY'); }
  
  // 2. Volume Confirmation (0-20)
  if (volume > 50000000) { signals.score += 20; signals.signals.push('📊 HIGH VOLUME'); }
  else if (volume > 20000000) { signals.score += 15; signals.signals.push('📊 GOOD VOLUME'); }
  else if (volume > 10000000) { signals.score += 10; }
  
  // 3. Gap Analysis (0-15)
  const gap = ((open - prevClose) / prevClose) * 100;
  if (gap > 5) { signals.score += 15; signals.signals.push('⬆️ GAP UP'); }
  else if (gap > 3) { signals.score += 10; }
  
  // 4. Range Position (0-10)
  const range = high - low;
  const position = range > 0 ? ((price - low) / range) * 100 : 50;
  if (position > 80) { signals.score += 10; signals.signals.push('🎯 NEAR HIGH'); }
  else if (position > 50) { signals.score += 5; }
  
  // 5. Small Cap Bonus (0-10)
  if (price < 10) { signals.score += 10; signals.signals.push('💎 SMALL CAP'); }
  else if (price < 30) { signals.score += 5; }
  
  // === ACTION DECISION ===
  if (signals.score >= 70) {
    signals.action = 'STRONG BUY';
    signals.entry = price;
    signals.stop = price * 0.93; // 7% stop
    signals.target = price * 1.15; // 15% target
  } else if (signals.score >= 50) {
    signals.action = 'BUY';
    signals.entry = price;
    signals.stop = price * 0.95; // 5% stop
    signals.target = price * 1.10; // 10% target
  } else if (signals.score >= 30) {
    signals.action = 'WATCH';
  } else {
    signals.action = 'WAIT';
  }
  
  return signals;
}

// === MAIN ===
async function momentumStrategy() {
  console.log('📈 MOMENTUM STRATEGY ENGINE');
  console.log('='.repeat(40));
  
  const stocks = await fetchQuotes(MOMENTUM_STOCKS);
  console.log(`📊 Analyzing ${stocks.length} momentum stocks...\n`);
  
  // Calculate momentum for each
  const analyzed = stocks.map(s => {
    const momentum = calculateMomentum(s);
    return { ...s, ...momentum };
  });
  
  // Sort by score
  const ranked = analyzed.sort((a, b) => b.score - a.score);
  
  // Output
  console.log('🎯 TOP MOMENTUM SIGNALS:');
  console.log('-'.repeat(50));
  
  ranked.slice(0, 15).forEach((s, i) => {
    const changeStr = s.change > 0 ? `+${s.change.toFixed(2)}%` : `${s.change.toFixed(2)}%`;
    const actionColor = s.action === 'STRONG BUY' ? '🟢' : s.action === 'BUY' ? '🟡' : s.action === 'WATCH' ? '👀' : '⚪';
    console.log(`${i+1}. ${actionColor} ${s.action} | ${s.code} ${s.name}: ¥${price} (${changeStr}) | Score: ${s.score}`);
    console.log(`   📊 ${s.signals.join(' | ')}`);
    if (s.action.includes('BUY')) {
      console.log(`   🎯 Entry: ¥${s.entry} | Stop: ¥${s.stop?.toFixed(2)} | Target: ¥${s.target?.toFixed(2)}`);
    }
  });
  
  // Summary
  const buySignals = ranked.filter(s => s.action.includes('BUY'));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   🟢 Strong Buy: ${ranked.filter(s => s.action === 'STRONG BUY').length}`);
  console.log(`   🟡 Buy: ${ranked.filter(s => s.action === 'BUY').length}`);
  console.log(`   👀 Watch: ${ranked.filter(s => s.action === 'WATCH').length}`);
  
  // Save report
  const report = `# 📈 MOMENTUM STRATEGY REPORT
Date: ${new Date().toLocaleString()}

## Summary
- Total stocks analyzed: ${stocks.length}
- Strong Buy signals: ${ranked.filter(s => s.action === 'STRONG BUY').length}
- Buy signals: ${ranked.filter(s => s.action === 'BUY').length}
- Watch: ${ranked.filter(s => s.action === 'WATCH').length}

## Signals

### 🟢 STRONG BUY (Score 70+)
${ranked.filter(s => s.action === 'STRONG BUY').map((s, i) => `${i+1}. **${s.code} ${s.name}**
   - Price: ¥${s.price} | Change: ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%
   - Entry: ¥${s.entry} | Stop: ¥${s.stop?.toFixed(2)} | Target: ¥${s.target?.toFixed(2)}
   - Signals: ${s.signals.join(', ')}
`).join('\n')}

### 🟡 BUY (Score 50-69)
${ranked.filter(s => s.action === 'BUY').slice(0, 10).map((s, i) => `${i+1}. ${s.code} ${s.name} - ¥${s.price} (${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%) | Score: ${s.score}`).join('\n')}

### 👀 WATCH (Score 30-49)
${ranked.filter(s => s.action === 'WATCH').slice(0, 10).map((s, i) => `${i+1}. ${s.code} ${s.name} - ¥${s.price} (${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%) | Score: ${s.score}`).join('\n')}

---
*Generated by Momentum Strategy Engine*
`;
  
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`\n📁 Report saved: ${OUTPUT_FILE}`);
  
  return ranked;
}

momentumStrategy().then(() => process.exit(0));
