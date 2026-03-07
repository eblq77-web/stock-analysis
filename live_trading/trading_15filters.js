/**
 * 🧠 SUPER BRAIN - 15 FILTER TRADING SYSTEM
 * Main trading engine with 15 filters
 * 
 * Usage: node trading_15filters.js [SCAN|BUY|SELL|STATUS]
 */

const fs = require('fs');
const https = require('https');

// 15 FILTERS
const FILTERS = {
  existing: {
    sector: { good: ['科技', '医药', '新能源', '消费', '汽车', '军工'], bad: ['金融'] },
    volume: 500000,
    institutional: 60
  },
  advanced: {
    price_range: { min: 25, max: 40 },
    market_condition: -1,
    topSectors: ['科技', '医药', '新能源'],
    volume_multiplier: 2,
    rsi: { min: 30, max: 70 },
    gap_max: 3,
    news_max: 7,
    inst_score_min: 75
  }
};

// Evaluate single stock
function evaluate(stock) {
  const f = FILTERS;
  const a = FILTERS.advanced;
  const filters = {};
  
  filters[1] = f.existing.sector.good.includes(stock.sector) && !f.existing.sector.bad.includes(stock.sector);
  filters[2] = stock.change > 0;
  filters[3] = stock.volume > f.existing.volume;
  filters[4] = true; // timing
  filters[5] = (stock.instScore || 0) > f.existing.institutional;
  filters[6] = stock.price >= a.price_range.min && stock.price <= a.price_range.max;
  filters[7] = (stock.marketChange || 0) > a.market_condition;
  filters[8] = a.topSectors.includes(stock.sector);
  filters[9] = stock.volume > (stock.avgVolume || 0) * a.volume_multiplier;
  filters[10] = stock.price > (stock.ma20 || stock.price);
  filters[11] = (stock.rsi || 50) >= a.rsi.min && (stock.rsi || 50) <= a.rsi.max;
  filters[12] = (stock.macd || 0) > 0;
  filters[13] = Math.abs(stock.gap || 0) < a.gap_max;
  filters[14] = (stock.newsDays || 999) <= a.news_max;
  filters[15] = (stock.instScore || 0) >= a.inst_score_min;
  
  const passed = Object.values(filters).filter(Boolean).length;
  const score = Math.round((passed / 15) * 100);
  const decision = passed >= 10 ? 'STRONG BUY' : passed >= 7 ? 'BUY' : 'NO BUY';
  
  return { ...stock, filters, passed, score, decision };
}

// Fetch real prices
async function fetchPrices(codes) {
  return new Promise((resolve, reject) => {
    const url = 'https://qt.gtimg.cn/q=sh' + codes.join(',sh');
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Main scan
async function scan() {
  console.log('\n🧠 SCANNING WITH 15 FILTERS...\n');
  
  const watchlist = ['600089','600085','600066','600038','601012','000651','300476','300122','002594'];
  const data = await fetchPrices(watchlist);
  
  const results = watchlist.map(code => {
    const match = data.match(new RegExp('sh' + code + '="([^"]+)"'));
    if (!match) return null;
    
    const parts = match[1].split('~');
    const price = parseFloat(parts[4]) || 0;
    const prev = parseFloat(parts[5]) || price;
    const change = ((price - prev) / prev) * 100;
    const volume = parseInt(parts[7]) || 0;
    
    return evaluate({
      code, sector: '科技', price, change, volume, instScore: 70,
      marketChange: -1.5, avgVolume: volume, ma20: price, rsi: 50, macd: 1, gap: 0, newsDays: 3
    });
  }).filter(Boolean);
  
  results.sort((a, b) => b.score - a.score);
  
  console.log('='.repeat(70));
  console.log('CODE     PRICE     CHANGE%   PASSED   SCORE   DECISION');
  console.log('='.repeat(70));
  
  results.forEach(r => {
    const e = r.decision === 'STRONG BUY' ? '🟢' : r.decision === 'BUY' ? '🟡' : '🔴';
    console.log(r.code.padEnd(9) + '¥' + r.price.toFixed(2).padEnd(8) + 
      (r.change > 0 ? '+' : '') + r.change.toFixed(2).padEnd(8) +
      r.passed.toString().padEnd(8) + r.score.toString().padEnd(7) + e + ' ' + r.decision);
  });
  
  console.log('='.repeat(70));
  const buys = results.filter(r => r.decision.includes('BUY'));
  console.log(`\n📊 ${buys.length} stocks passed!`);
}

// CLI
const cmd = process.argv[2] || 'SCAN';
if (cmd === 'SCAN') scan();
