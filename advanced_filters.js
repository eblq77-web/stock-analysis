/**
 * 🧠 SUPER BRAIN ADVANCED FILTERS
 * Enhanced filtering system for better trading decisions
 */

const FILTERS = {
  // Existing 5 Filters
  existing: {
    sector: { name: 'Sector Filter', good: ['科技', '医药', '新能源', '消费', '汽车', '军工'], bad: ['金融'] },
    momentum: { name: 'Momentum Filter', rule: 'Change > 0' },
    volume: { name: 'Volume Filter', min: 500000 },
    timing: { name: 'Timing Filter', window: '9:45 - 10:30 AM' },
    institutional: { name: 'Institutional Filter', rule: 'Smart money inflow' }
  },
  // Advanced 10 Filters
  advanced: {
    price_range: { name: 'Price Range', min: 25, max: 40 },
    market_condition: { name: 'Market Condition', rule: 'Major indices > -1%' },
    sector_momentum: { name: 'Sector Momentum', rule: 'Sector in top 3' },
    volume_surge: { name: 'Volume Surge', rule: 'Volume > 2x average' },
    price_ma20: { name: 'Price MA20', rule: 'Price > MA20' },
    rsi: { name: 'RSI Filter', min: 30, max: 70 },
    macd: { name: 'MACD Filter', rule: 'MACD > Signal' },
    gap: { name: 'Gap Filter', rule: 'No large gap up' },
    news: { name: 'News Catalyst', rule: 'Positive news within 7 days' },
    inst_score: { name: 'Institutional Score', min: 75 }
  }
};

function analyzeStock(stock) {
  const results = { filters: {}, passed: 0, total: 15 };
  
  // Apply 15 filters (simplified)
  results.filters = {
    sector: true, momentum: stock.change > 0, volume: stock.volume > 500000,
    timing: true, institutional: stock.instScore > 60,
    price_range: stock.price >= 25 && stock.price <= 40,
    market_condition: stock.marketChange > -1,
    sector_momentum: true, volume_surge: stock.volume > stock.avgVolume * 2,
    price_ma20: stock.price > stock.ma20,
    rsi: stock.rsi >= 30 && stock.rsi <= 70,
    macd: stock.macd > stock.macdSignal,
    gap: stock.gap < 3, news: stock.newsDays <= 7,
    inst_score: stock.instScore >= 75
  };
  
  Object.values(results.filters).forEach(p => { if(p) results.passed++; });
  results.decision = results.passed >= 10 ? 'STRONG BUY' : results.passed >= 7 ? 'BUY' : 'NO BUY';
  return results;
}

module.exports = { FILTERS, analyzeStock };
