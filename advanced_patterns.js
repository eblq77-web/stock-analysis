/**
 * 🧠 ADVANCED INSTITUTIONAL PATTERNS v2.0
 * Professional pattern analysis with:
 * - Historical cycle tracking
 * - Geopolitical factors
 * - Market regime detection
 * - Political events impact
 * 
 * Version 2.0 - Professional Grade
 */

const fs = require('fs');

// ============================================
// HISTORICAL EVENTS DATABASE
// ============================================

const HISTORICAL_EVENTS = {
  // Major market bottoms
  bottoms: [
    { date: '2008-10-28', event: '2008 Financial Crisis', index: '1664', recovery: '2009-08' },
    { date: '2013-06-25', event: '钱荒', index: '1849', recovery: '2014-12' },
    { date: '2016-01-27', event: '熔断机制', index: '2638', recovery: '2016-11' },
    { date: '2018-10-19', event: '贸易战', index: '2449', recovery: '2019-04' },
    { date: '2020-03-23', event: 'COVID-19', index: '2646', recovery: '2021-02' },
    { date: '2022-04-27', event: '上海疫情', index: '2863', recovery: '2022-07' }
  ],
  
  // Political events impact
  political: [
    { date: '2018-03', event: '中美贸易战开始', impact: 'negative', duration: '12 months' },
    { date: '2019-05', event: '华为禁令', impact: 'negative', duration: '6 months' },
    { date: '2020-01', event: 'COVID-19爆发', impact: 'negative', duration: '3 months' },
    { date: '2022-03', event: '上海封城', impact: 'negative', duration: '2 months' },
    { date: '2023-03', event: '机构改革', impact: 'positive', duration: '1 month' }
  ],
  
  // Sector cycles
  sector_cycles: [
    { sector: '科技', cycle: '4-5 years', bull: '24 months', bear: '12 months' },
    { sector: '医药', cycle: '3-4 years', bull: '18 months', bear: '8 months' },
    { sector: '新能源', cycle: '5-6 years', bull: '30 months', bear: '18 months' },
    { sector: '消费', cycle: '3 years', bull: '18 months', bear: '6 months' },
    { sector: '金融', cycle: '5-7 years', bull: '24 months', bear: '24 months' }
  ]
};

// ============================================
// GEOPOLITICAL FACTORS
// ============================================

const GEOPOLITICAL_FACTORS = {
  us_china: {
    name: 'US-China Relations',
    factors: [
      'Trade war tariffs',
      'Technology restrictions',
      'Taiwan tensions',
      'Military exercises',
      'Financial sanctions'
    ],
    impact_on: ['科技', '新能源', '半导体', '出口']
  },
  
  fed_policy: {
    name: 'Fed Policy',
    factors: [
      'Interest rate changes',
      'Quantitative tightening',
      'Dollar strength',
      'Bond yields'
    ],
    impact_on: ['金融', '消费', '科技']
  },
  
  domestic_policy: {
    name: 'China Domestic Policy',
    factors: [
      'Property stimulus',
      'Infrastructure spending',
      'Tech regulation',
      'Carbon neutrality',
      'Manufacturing 2025'
    ],
    impact_on: ['新能源', '科技', '地产', '制造业']
  },
  
  global_events: {
    name: 'Global Events',
    factors: [
      'Oil prices',
      'War in Ukraine',
      'European crisis',
      'Japan yen',
      'India growth'
    ],
    impact_on: ['能源', '军工', '黄金', '出口']
  }
};

// ============================================
// MARKET REGIME DETECTION
// ============================================

const REGIMES = {
  bull_strong: {
    name: 'Strong Bull',
    characteristics: ['V-shaped recovery', 'Volume expanding', 'All sectors up'],
    duration: '6-12 months',
    action: 'AGGRESSIVE'
  },
  
  bull_weak: {
    name: 'Weak Bull',
    characteristics: ['Slow climb', 'Sector rotation', 'Volume flat'],
    duration: '3-6 months',
    action: 'SELECTIVE'
  },
  
  bear_weak: {
    name: 'Weak Bear',
    characteristics: ['Small rebounds', 'Falling highs', 'Volume declining'],
    duration: '3-6 months',
    action: 'DEFENSIVE'
  },
  
  bear_strong: {
    name: 'Strong Bear',
    characteristics: ['Crash', 'High volatility', 'Panic selling'],
    duration: '1-3 months',
    action: 'ACCUMULATE'
  },
  
  sideways: {
    name: 'Sideways',
    characteristics: ['Range bound', 'Sector rotation', 'No trend'],
    duration: 'Variable',
    action: 'RANGE'
  }
};

// ============================================
// ADVANCED PATTERN DETECTION
// ============================================

function detectMarketRegime(data) {
  const indicators = {
    trend: data.indexChange > 0 ? 'up' : 'down',
    volatility: data.volatility > 20 ? 'high' : 'low',
    volume: data.volumeChange > 0 ? 'expanding' : 'contracting',
    breadth: data.advancing / (data.advancing + data.declining)
  };
  
  // Simple regime detection
  if (indicators.trend === 'up' && indicators.volatility === 'low') {
    return { regime: 'bull_weak', ...REGIMES.bull_weak };
  } else if (indicators.trend === 'down' && indicators.volatility === 'high') {
    return { regime: 'bear_strong', ...REGIMES.bear_strong };
  } else if (indicators.trend === 'down' && indicators.breadth < 0.3) {
    return { regime: 'bear_weak', ...REGIMES.bear_weak };
  }
  
  return { regime: 'sideways', ...REGIMES.sideways };
}

function analyzeHistoricalPattern(stock) {
  const insights = [];
  const now = new Date();
  
  // Check if near historical bottom
  HISTORICAL_EVENTS.bottoms.forEach(bottom => {
    const bottomDate = new Date(bottom.date);
    const daysAgo = (now - bottomDate) / (1000 * 60 * 60 * 24);
    
    // Check if similar cycle timing (roughly 4 years)
    if (Math.abs(daysAgo % 1460) < 180) { // Within 6 months of cycle
      insights.push({
        type: 'historical',
        event: bottom.event,
        similarity: 'High - similar cycle timing',
        action: 'Watch for bottom formation'
      });
    }
  });
  
  // Check political events
  HISTORICAL_EVENTS.political.forEach(event => {
    insights.push({
      type: 'political',
      event: event.event,
      impact: event.impact,
      note: 'Historical pattern: ' + event.duration
    });
  });
  
  return insights;
}

function analyzeGeopoliticalImpact(stock) {
  const impacts = [];
  
  Object.keys(GEOPOLITICAL_FACTORS).forEach(key => {
    const factor = GEOPOLITICAL_FACTORS[key];
    if (factor.impact_on.includes(stock.sector)) {
      impacts.push({
        factor: factor.name,
        sector: stock.sector,
        relevance: 'HIGH',
        note: 'Sector affected by ' + factor.factors.slice(0,2).join(', ')
      });
    }
  });
  
  return impacts;
}

function analyzeSectorCycle(stock) {
  const cycle = HISTORICAL_EVENTS.sector_cycles.find(s => s.sector === stock.sector);
  if (!cycle) return null;
  
  return {
    sector: stock.sector,
    cycle_length: cycle.cycle,
    bull_duration: cycle.bull,
    bear_duration: cycle.bear,
    current_phase: 'analysis_needed'
  };
}

// ============================================
// COMPREHENSIVE ANALYSIS
// ============================================

function comprehensiveAnalysis(stock, marketData) {
  console.log('='.repeat(60));
  console.log('🧠 COMPREHENSIVE INSTITUTIONAL ANALYSIS');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('📊 Stock:', stock.code, stock.name);
  console.log('📅 Analysis Date:', new Date().toLocaleDateString());
  console.log('');
  
  // 1. Market Regime
  console.log('📈 1. MARKET REGIME DETECTION');
  const regime = detectMarketRegime(marketData);
  console.log('   Current Regime:', regime.name);
  console.log('   Action:', regime.action);
  console.log('   Duration:', regime.duration);
  console.log('');
  
  // 2. Historical Patterns
  console.log('📜 2. HISTORICAL PATTERNS');
  const history = analyzeHistoricalPattern(stock);
  history.forEach(h => {
    console.log('   •', h.event, '-', h.type, '-', h.action || h.impact);
  });
  console.log('');
  
  // 3. Geopolitical Impact
  console.log('🌍 3. GEOPOLITICAL FACTORS');
  const geoImpacts = analyzeGeopoliticalImpact(stock);
  geoImpacts.forEach(g => {
    console.log('   •', g.factor, '-', g.relevance);
    console.log('     ', g.note);
  });
  console.log('');
  
  // 4. Sector Cycle
  console.log('🔄 4. SECTOR CYCLE');
  const sectorCycle = analyzeSectorCycle(stock);
  if (sectorCycle) {
    console.log('   Sector:', sectorCycle.sector);
    console.log('   Cycle:', sectorCycle.cycle_length);
    console.log('   Bull/Bear:', sectorCycle.bull_duration, '/', sectorCycle.bear_duration);
  }
  console.log('');
  
  // 5. Institutional Patterns
  console.log('🏦 6. INSTITUTIONAL PATTERNS');
  const patterns = analyzePatterns(stock);
  Object.keys(patterns).forEach(p => {
    const score = patterns[p];
    const stars = '★'.repeat(Math.floor(score / 20));
    console.log('   ', p, ':', score + '%', stars);
  });
  console.log('');
  
  console.log('='.repeat(60));
}

function analyzePatterns(stock) {
  // Simplified pattern scoring
  const patterns = {
    accumulation: 0,
    bottom_fishing: 0,
    breakout: 0,
    contrarian: 0
  };
  
  if (stock.volume > stock.avgVolume * 2) patterns.accumulation += 25;
  if (stock.instScore > 70) patterns.accumulation += 25;
  if (stock.rsi < 30) patterns.bottom_fishing += 25;
  if (stock.price52wLow) patterns.bottom_fishing += 25;
  if (stock.volume > stock.avgVolume * 1.5) patterns.breakout += 25;
  if (stock.breakout) patterns.breakout += 25;
  if (stock.sentimentNegative) patterns.contrarian += 25;
  if (stock.insiderBuying) patterns.contrarian += 25;
  
  return patterns;
}

// ============================================
// DEMO
// ============================================

const demoStock = {
  code: '601012',
  name: '隆基绿能',
  sector: '新能源',
  volume: 1800000,
  avgVolume: 800000,
  instScore: 100,
  rsi: 28,
  price52wLow: true,
  breakout: false,
  sentimentNegative: true,
  insiderBuying: true
};

const demoMarket = {
  indexChange: -1.5,
  volatility: 18,
  volumeChange: -5,
  advancing: 800,
  declining: 2200
};

comprehensiveAnalysis(demoStock, demoMarket);

console.log('\n✅ Advanced Analysis Complete!');

module.exports = {
  HISTORICAL_EVENTS,
  GEOPOLITICAL_FACTORS,
  REGIMES,
  detectMarketRegime,
  analyzeHistoricalPattern,
  analyzeGeopoliticalImpact,
  analyzeSectorCycle
};
