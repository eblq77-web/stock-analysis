/**
 * 🧠 INSTITUTIONAL LEARNING SYSTEM
 * Self-learning from institutional buying patterns
 * Identifies accumulation/bottom patterns
 * 
 * Version 1.0 - Smart Learning
 */

const fs = require('fs');

// ============================================
// INSTITUTIONAL PATTERN KNOWLEDGE
// ============================================

const PATTERNS = {
  // Pattern 1: Smart Money Accumulation
  accumulation: {
    name: 'Smart Money Accumulation',
    indicators: [
      { name: 'Volume Spike', condition: 'volume > 2x avg' },
      { name: 'Price Action', condition: 'price in range, not breaking down' },
      { name: 'Institutional Score', condition: 'score > 70' },
      { name: 'Sector Flow', condition: 'sector inflow > outflow' },
      { name: 'No Distribution', condition: 'no large sell days' }
    ],
    success_rate: 0.75
  },
  
  // Pattern 2: Bottom Fishing
  bottom_fishing: {
    name: 'Bottom Fishing',
    indicators: [
      { name: 'RSI Oversold', condition: 'RSI < 30' },
      { name: 'Price Near Low', condition: 'price within 5% of 52w low' },
      { name: 'Increasing Volume', condition: 'volume increasing on up days' },
      { name: 'Bullish Candles', condition: 'hammer/engulfing candles' },
      { name: 'Institutional Buying', condition: 'smart money inflow' }
    ],
    success_rate: 0.70
  },
  
  // Pattern 3: Breakout
  breakout: {
    name: 'Breakout Momentum',
    indicators: [
      { name: 'Volume Surge', condition: 'volume > 1.5x avg' },
      { name: 'Price Break', condition: 'price breaks resistance' },
      { name: 'MA Alignment', condition: 'MA20 > MA50 > MA200' },
      { name: 'MACD Crossover', condition: 'MACD crosses above signal' },
      { name: 'High ADX', condition: 'ADX > 25' }
    ],
    success_rate: 0.65
  },
  
  // Pattern 4: Contrarian
  contrarian: {
    name: 'Contrarian Play',
    indicators: [
      { name: 'Negative Sentiment', condition: 'most investors bearish' },
      { name: 'Insider Buying', condition: 'insiders buying shares' },
      { name: 'Short Interest', condition: 'short interest declining' },
      { name: 'Forward PE', condition: 'PE < industry avg' },
      { name: 'Catalyst Coming', condition: 'event within 30 days' }
    ],
    success_rate: 0.60
  }
};

// ============================================
// LEARNING MEMORY
// ============================================

const MEMORY_FILE = './data/learning_memory.json';

function loadMemory() {
  if (fs.existsSync(MEMORY_FILE)) {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  }
  return {
    patterns: {},
    trades: [],
    insights: [],
    success_rates: {}
  };
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// ============================================
// ANALYZE INSTITUTIONAL BEHAVIOR
// ============================================

function analyzeInstitutional(stock) {
  const results = {
    code: stock.code,
    patterns: {},
    confidence: 0,
    recommendation: 'NO BUY',
    insights: []
  };
  
  // Check Accumulation Pattern
  let accumulationScore = 0;
  if (stock.volume > stock.avgVolume * 2) { accumulationScore += 20; results.insights.push('📈 Volume spike detected'); }
  if (stock.instScore > 70) { accumulationScore += 20; results.insights.push('🏦 High institutional score'); }
  if (stock.sectorFlow > 0) { accumulationScore += 20; results.insights.push('💧 Sector inflow positive'); }
  if (!stock.distribution) { accumulationScore += 20; results.insights.push('✅ No distribution days'); }
  if (stock.priceChange > 0) { accumulationScore += 20; results.insights.push('🟢 Price rising'); }
  
  results.patterns.accumulation = accumulationScore;
  
  // Check Bottom Fishing Pattern
  let bottomScore = 0;
  if (stock.rsi < 30) { bottomScore += 20; results.insights.push('📉 RSI oversold'); }
  if (stock.price52wLow) { bottomScore += 20; results.insights.push('🎯 Near 52w low'); }
  if (stock.bullishCandles) { bottomScore += 20; results.insights.push('🕯️ Bullish candles'); }
  if (stock.instBuying) { bottomScore += 20; results.insights.push('🏦 Institutional buying'); }
  
  results.patterns.bottom_fishing = bottomScore;
  
  // Check Breakout Pattern
  let breakoutScore = 0;
  if (stock.volume > stock.avgVolume * 1.5) breakoutScore += 20;
  if (stock.breakout) breakoutScore += 20;
  if (stock.maAligned) breakoutScore += 20;
  if (stock.macdCrossover) breakoutScore += 20;
  if (stock.adx > 25) breakoutScore += 20;
  
  results.patterns.breakout = breakoutScore;
  
  // Check Contrarian Pattern
  let contrarianScore = 0;
  if (stock.sentimentNegative) contrarianScore += 20;
  if (stock.insiderBuying) contrarianScore += 20;
  if (stock.shortDeclining) contrarianScore += 20;
  if (stock.forwardPE) contrarianScore += 20;
  if (stock.catalyst30d) contrarianScore += 20;
  
  results.patterns.contrarian = contrarianScore;
  
  // Overall confidence
  const scores = [accumulationScore, bottomScore, breakoutScore, contrarianScore];
  results.confidence = Math.max(...scores);
  
  // Recommendation
  if (results.confidence >= 80) {
    results.recommendation = 'STRONG BUY';
  } else if (results.confidence >= 60) {
    results.recommendation = 'BUY';
  } else if (results.confidence >= 40) {
    results.recommendation = 'WATCH';
  } else {
    results.recommendation = 'NO BUY';
  }
  
  return results;
}

// ============================================
// LEARN FROM TRADES
// ============================================

function learnFromTrade(trade) {
  const memory = loadMemory();
  
  memory.trades.push({
    ...trade,
    timestamp: new Date().toISOString()
  });
  
  // Update success rates
  const pattern = trade.pattern;
  if (!memory.success_rates[pattern]) {
    memory.success_rates[pattern] = { wins: 0, total: 0 };
  }
  
  memory.success_rates[pattern].total++;
  if (trade.profit > 0) {
    memory.success_rates[pattern].wins++;
  }
  
  // Calculate new success rate
  const sr = memory.success_rates[pattern];
  sr.rate = Math.round((sr.wins / sr.total) * 100);
  
  // Add insight
  if (trade.profit > 0) {
    memory.insights.push({
      pattern,
      insight: `${pattern} worked for ${trade.code}`,
      profit: trade.profit,
      timestamp: new Date().toISOString()
    });
  }
  
  saveMemory(memory);
  return memory.success_rates;
}

// ============================================
// GET SMART INSIGHTS
// ============================================

function getSmartInsights() {
  const memory = loadMemory();
  const insights = [];
  
  Object.keys(memory.success_rates).forEach(pattern => {
    const sr = memory.success_rates[pattern];
    if (sr.rate > 60) {
      insights.push({
        pattern,
        success_rate: sr.rate,
        recommendation: 'FOLLOW THIS PATTERN'
      });
    }
  });
  
  return insights.sort((a, b) => b.success_rate - a.success_rate);
}

// ============================================
// MAIN
// ============================================

console.log('='.repeat(60));
console.log('🧠 INSTITUTIONAL LEARNING SYSTEM');
console.log('='.repeat(60));
console.log('');
console.log('📚 KNOWN PATTERNS:');
Object.keys(PATTERNS).forEach(p => {
  console.log(`  • ${PATTERNS[p].name} (${PATTERNS[p].indicators.length} indicators)`);
});
console.log('');

// Demo analysis
const demoStock = {
  code: '601012',
  name: '隆基绿能',
  volume: 1800000,
  avgVolume: 800000,
  instScore: 100,
  sectorFlow: 50000000,
  distribution: false,
  priceChange: 2.16,
  rsi: 28,
  price52wLow: true,
  bullishCandles: true,
  instBuying: true
};

const result = analyzeInstitutional(demoStock);

console.log('📊 ANALYSIS:');
console.log(`  Stock: ${result.code} ${demoStock.name}`);
console.log('');
console.log('  Pattern Scores:');
Object.keys(result.patterns).forEach(p => {
  const score = result.patterns[p];
  const stars = '★'.repeat(Math.floor(score / 20));
  console.log(`    ${p}: ${score}% ${stars}`);
});
console.log('');
console.log('  💡 Insights:');
result.insights.forEach(i => console.log(`    ${i}`));
console.log('');
console.log('  🎯 Recommendation:', result.recommendation);
console.log('  📈 Confidence:', result.confidence + '%');
console.log('');

// Get smart insights
const smartInsights = getSmartInsights();
if (smartInsights.length > 0) {
  console.log('  🧠 Learned Insights:');
  smartInsights.forEach(i => console.log(`    ${i.pattern}: ${i.success_rate}% - ${i.recommendation}`));
}

console.log('');
console.log('='.repeat(60));

module.exports = {
  PATTERNS,
  analyzeInstitutional,
  learnFromTrade,
  getSmartInsights
};
