/**
 * 🧠 SUPER BRAIN ADVANCED TRADING SYSTEM
 * 15-Filter Decision Engine v2.0
 * 
 * Usage: node advanced_trader.js [SCAN|BUY|SELL|STATUS]
 */

const fs = require('fs');

// ============================================
// 15 FILTERS CONFIGURATION
// ============================================

const FILTERS = {
  // Existing 5 Filters
  existing: {
    sector: { name: 'Sector Filter', good: ['科技', '医药', '新能源', '消费', '汽车', '军工'], bad: ['金融'], enabled: true },
    momentum: { name: 'Momentum Filter', rule: 'Change > 0', enabled: true },
    volume: { name: 'Volume Filter', min: 500000, enabled: true },
    timing: { name: 'Timing Filter', window: '9:45-10:30', enabled: true },
    institutional: { name: 'Institutional Filter', minScore: 60, enabled: true }
  },
  // Advanced 10 Filters
  advanced: {
    price_range: { name: 'Price Range', min: 25, max: 40, enabled: true },
    market_condition: { name: 'Market Condition', maxNeg: -1, enabled: true },
    sector_momentum: { name: 'Sector Momentum', topSectors: ['科技', '医药', '新能源'], enabled: true },
    volume_surge: { name: 'Volume Surge', multiplier: 2, enabled: true },
    price_ma20: { name: 'Price MA20', enabled: true },
    rsi: { name: 'RSI Filter', min: 30, max: 70, enabled: true },
    macd: { name: 'MACD Filter', enabled: true },
    gap: { name: 'Gap Filter', maxGap: 3, enabled: true },
    news: { name: 'News Catalyst', maxDays: 7, enabled: true },
    inst_score: { name: 'Inst Score', min: 75, enabled: true }
  }
};

// ============================================
// DECISION ENGINE
// ============================================

function evaluateStock(stock) {
  const result = {
    code: stock.code,
    name: stock.name,
    sector: stock.sector,
    price: stock.price,
    change: stock.change || 0,
    volume: stock.volume || 0,
    filters: {},
    passed: 0,
    total: 15,
    score: 0,
    decision: 'NO BUY'
  };

  const e = FILTERS.existing;
  const a = FILTERS.advanced;

  // Filter 1: Sector
  result.filters[1] = e.sector.good.includes(stock.sector) && !e.sector.bad.includes(stock.sector);
  
  // Filter 2: Momentum
  result.filters[2] = stock.change > 0;
  
  // Filter 3: Volume
  result.filters[3] = stock.volume > e.volume.min;
  
  // Filter 4: Timing
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  result.filters[4] = minutes >= 585 && minutes <= 630; // 9:45 - 10:30
  
  // Filter 5: Institutional
  result.filters[5] = (stock.instScore || 0) > e.institutional.minScore;
  
  // Filter 6: Price Range
  result.filters[6] = stock.price >= a.price_range.min && stock.price <= a.price_range.max;
  
  // Filter 7: Market Condition
  result.filters[7] = (stock.marketChange || 0) > a.market_condition.maxNeg;
  
  // Filter 8: Sector Momentum
  result.filters[8] = a.sector_momentum.topSectors.includes(stock.sector);
  
  // Filter 9: Volume Surge
  result.filters[9] = stock.volume > (stock.avgVolume || 0) * a.volume_surge.multiplier;
  
  // Filter 10: Price MA20
  result.filters[10] = stock.price > (stock.ma20 || stock.price);
  
  // Filter 11: RSI
  result.filters[11] = (stock.rsi || 50) >= a.rsi.min && (stock.rsi || 50) <= a.rsi.max;
  
  // Filter 12: MACD
  result.filters[12] = (stock.macd || 0) > (stock.macdSignal || 0);
  
  // Filter 13: Gap
  result.filters[13] = Math.abs(stock.gap || 0) < a.gap.maxGap;
  
  // Filter 14: News Catalyst
  result.filters[14] = (stock.newsDays || 999) <= a.news.maxDays;
  
  // Filter 15: Institutional Score
  result.filters[15] = (stock.instScore || 0) >= a.inst_score.min;

  // Count passes
  result.passed = Object.values(result.filters).filter(f => f).length;
  result.score = Math.round((result.passed / result.total) * 100);

  // Decision
  if (result.passed >= 10) {
    result.decision = 'STRONG BUY';
  } else if (result.passed >= 7) {
    result.decision = 'BUY';
  } else {
    result.decision = 'NO BUY';
  }

  return result;
}

// ============================================
// SCAN STOCKS
// ============================================

function scanStocks(stocks) {
  console.log('\n🧠 SCANNING WITH 15 FILTERS...\n');
  
  const results = stocks.map(s => evaluateStock(s));
  results.sort((a, b) => b.score - a.score);
  
  console.log('='.repeat(70));
  console.log('CODE     NAME        SECTOR    PRICE    CHANGE%   PASSED   SCORE   DECISION');
  console.log('='.repeat(70));
  
  results.forEach(r => {
    const emoji = r.decision === 'STRONG BUY' ? '🟢' : r.decision === 'BUY' ? '🟡' : '🔴';
    console.log(
      r.code.padEnd(9) + 
      (r.name || '').padEnd(10).substring(0,10) + 
      (r.sector || '').padEnd(9).substring(0,9) +
      ('¥' + (r.price||0).toFixed(2)).padEnd(9) +
      (r.change > 0 ? '+' : '') + (r.change||0).toFixed(2).padEnd(8) +
      r.passed.toString().padEnd(8) +
      r.score.toString().padEnd(7) +
      emoji + ' ' + r.decision
    );
  });
  
  console.log('='.repeat(70));
  
  const strongBuys = results.filter(r => r.decision === 'STRONG BUY');
  const buys = results.filter(r => r.decision === 'BUY');
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   STRONG BUY: ${strongBuys.length}`);
  console.log(`   BUY: ${buys.length}`);
  console.log(`   NO BUY: ${results.length - strongBuys.length - buys.length}`);
  
  return results;
}

// ============================================
// DEMO DATA
// ============================================

const demoStocks = [
  { code: '600089', name: '特变电工', sector: '新能源', price: 29.68, change: 1.96, volume: 530000, instScore: 70 },
  { code: '600085', name: '同仁堂', sector: '医药', price: 30.38, change: 0.33, volume: 9000, instScore: 65 },
  { code: '600066', name: '宇通客车', sector: '汽车', price: 29.61, change: 0.17, volume: 7000, instScore: 60 },
  { code: '600038', name: '中直股份', sector: '军工', price: 37.07, change: 0.95, volume: 11000, instScore: 55 },
  { code: '601012', name: '隆基绿能', sector: '新能源', price: 17.99, change: 2.16, volume: 1800000, instScore: 100 },
  { code: '300476', name: '中际旭创', sector: '科技', price: 284.00, change: -2.0, volume: 1200000, instScore: 95 },
  { code: '000651', name: '格力电器', sector: '家电', price: 37.19, change: 0.5, volume: 800000, instScore: 80 }
];

// Run
console.log('🧠 SUPER BRAIN ADVANCED TRADER v2.0');
console.log('15-Filter Decision System');
console.log('='.repeat(70));

const results = scanStocks(demoStocks);

console.log('\n✅ System Ready!');
console.log('Run with: node advanced_trader.js');
