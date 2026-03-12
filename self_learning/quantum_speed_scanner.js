#!/usr/bin/env node
/**
 * ⚡ QUANTUM SPEED SCANNER
 * Ultra-fast momentum and breakout detection
 * Target: <100ms analysis time
 */

const https = require('https');
const fs = require('fs');

const OUTPUT_FILE = '/Users/liu/Desktop/Stock_Analysis/daily_overview/quantum_speed_scan.md';

// === QUANTUM STOCK POOL ===
const QUANTUM_STOCKS = {
  // Large caps
  large: [
    'sh600519','sh000333','sz002594','sh600276','sz300750','sh601012',
    'sh600036','sh601398','sh601288','sz000001','sh000300'
  ],
  // Mid caps
  mid: [
    'sz300001','sz300003','sz300006','sz300014','sz300015','sz300017',
    'sz300018','sz300019','sz300020','sz300021','sz300022','sz300023'
  ],
  // Small caps (hidden gems)
  small: [
    'sz002004','sz002007','sz002025','sz002027','sz002028','sz002029',
    'bj835670','bj870299','bj870864','bj872926'
  ],
  // BSE small caps
  bse: [
    'bj835670','bj870864','bj872926','bj870299','bj871047','bj871049',
    'bj871007','bj871031','bj871039','bj871042','bj871051','bj871059'
  ]
};

// === FAST DATA FETCH ===
function fetchAllQuotes(stocks) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = `http://qt.gtimg.cn/q=${stocks.join(',')}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const timeMs = Date.now() - startTime;
        const lines = data.trim().split('\n');
        
        const results = lines.map(line => {
          const parts = line.split('~');
          if (!parts[1] || !parts[3]) return null;
          
          const price = parseFloat(parts[3]) || 0;
          const change = parseFloat(parts[4]) || 0;
          const volume = parseInt(parts[5]) || 0;
          
          return {
            code: parts[0].replace('v=', ''),
            name: parts[1],
            price,
            change,
            volume,
            amount: parseFloat(parts[6]) || 0
          };
        }).filter(s => s && s.price > 0);
        
        resolve({ stocks: results, timeMs });
      });
    }).on('error', () => resolve({ stocks: [], timeMs: 9999 }));
  });
}

// === QUANTUM ANALYSIS ENGINE ===
function analyzeMomentum(stocks) {
  // Score each stock on multiple factors
  const scored = stocks.map(s => {
    let score = 0;
    let signals = [];
    
    // Momentum score (0-30)
    if (s.change > 10) { score += 30; signals.push('🔥 HOT'); }
    else if (s.change > 5) { score += 20; signals.push('🚀 SURGE'); }
    else if (s.change > 3) { score += 10; signals.push('📈 UP'); }
    else if (s.change < -3) { score -= 10; signals.push('📉 DOWN'); }
    
    // Volume score (0-20)
    if (s.volume > 10000000) { score += 20; signals.push('📊 HIGH VOL'); }
    else if (s.volume > 5000000) { score += 10; }
    
    // Price score (0-10) - prefer mid/small caps
    if (s.price < 30) { score += 10; signals.push('💎 SMALL CAP'); }
    else if (s.price < 100) { score += 5; }
    
    // Breakout score (0-20)
    if (s.change > 8 && s.volume > 5000000) {
      score += 20;
      signals.push('💥 BREAKOUT');
    }
    
    // Accumulation score (0-20)
    if (s.change > 0 && s.volume > 3000000) {
      score += 15;
      signals.push('🏦 ACCUMULATING');
    }
    
    return { ...s, score, signals };
  });
  
  return scored.sort((a, b) => b.score - a.score);
}

// === SECTOR ROTATION ===
function detectSectorRotation(stocks) {
  // Simplified sector mapping
  const sectors = {
    '科技': ['sh600519','sh000333'],
    '新能源': ['sz002594','sz300750','sh601012'],
    '医药': ['sz300015','sz300750'],
    '消费': ['sh600887','sh603288'],
    '金融': ['sh601398','sh601288']
  };
  
  let sectorScores = {};
  
  for (let [sector, codes] of Object.entries(sectors)) {
    const sectorStocks = stocks.filter(s => codes.includes(s.code));
    if (sectorStocks.length > 0) {
      const avgChange = sectorStocks.reduce((sum, s) => sum + s.change, 0) / sectorStocks.length;
      sectorScores[sector] = avgChange;
    }
  }
  
  return Object.entries(sectorScores)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, change], i) => ({ rank: i + 1, sector, change }));
}

// === MAIN ===
async function quantumScan() {
  const startTime = Date.now();
  
  console.log('⚡ QUANTUM SPEED SCANNER');
  console.log('='.repeat(40));
  
  // Fetch all data
  const allStocks = [...QUANTUM_STOCKS.large, ...QUANTUM_STOCKS.mid, ...QUANTUM_STOCKS.small, ...QUANTUM_STOCKS.bse];
  const { stocks, timeMs } = await fetchAllQuotes(allStocks);
  
  console.log(`📡 Fetched ${stocks.length} stocks in ${timeMs}ms`);
  
  // Analyze
  const analyzed = analyzeMomentum(stocks);
  const sectors = detectSectorRotation(stocks);
  
  const totalTime = Date.now() - startTime;
  
  // Results
  console.log('\n🏆 TOP 10 QUANTUM PICKS:');
  console.log('-'.repeat(40));
  
  analyzed.slice(0, 10).forEach((s, i) => {
    const changeStr = s.change > 0 ? `+${s.change.toFixed(2)}%` : `${s.change.toFixed(2)}%`;
    console.log(`${i+1}. ${s.code} ${s.name}: ¥${s.price} (${changeStr}) | Score: ${s.score} | ${s.signals.join(' ')}`);
  });
  
  console.log('\n🔥 SECTOR ROTATION:');
  console.log('-'.repeat(40));
  sectors.forEach(s => {
    const arrow = s.change > 0 ? '📈' : '📉';
    console.log(`${s.rank}. ${s.sector}: ${arrow} ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%`);
  });
  
  console.log(`\n✅ Total analysis time: ${totalTime}ms`);
  
  // Save report
  const report = `# ⚡ QUANTUM SPEED SCAN
Date: ${new Date().toLocaleString()}

## Performance
- Stocks analyzed: ${stocks.length}
- Fetch time: ${timeMs}ms
- Total time: ${totalTime}ms

## Top Quantum Picks
| Rank | Code | Name | Price | Change | Score | Signals |
|------|------|------|-------|--------|-------|---------|
${analyzed.slice(0, 10).map((s, i) => `| ${i+1} | ${s.code} | ${s.name} | ¥${s.price} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.score} | ${s.signals.join(', ')} |`).join('\n')}

## Sector Rotation
| Rank | Sector | Change |
|------|--------|--------|
${sectors.map(s => `| ${s.rank} | ${s.sector} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% |`).join('\n')}
`;
  
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`\n📁 Report saved: ${OUTPUT_FILE}`);
  
  return { stocks: analyzed, sectors, timeMs: totalTime };
}

quantumScan().then(() => process.exit(0));
