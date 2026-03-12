/**
 * PRE-MARKET TAKEOFF SCREENING CRITERIA
 * ======================================
 * Charles's Super Brain - Small Cap Breakout System
 * 
 * CRITERIA:
 * 1. Price: ¥5-30 (small cap) - Smaller moves, bigger %
 * 2. Change: +3% to +15% - Not overheated, not dead
 * 3. Volume: > 100K (awakening) - Institutions loading
 * 4. Sector: Rotation aligned - Sector flow matters
 * 5. Pattern: Base forming - Technical confirmation
 * 
 * SCORING:
 * 80-100: BUY - Strong signal
 * 60-79: WATCH - Building base  
 * 40-59: WAIT - Need more data
 * <40: AVOID - Weak
 * 
 * Updated: 2026-03-10
 */

const SCREENING_CRITERIA = {
  // Price range for small cap
  price: {
    min: 5,
    max: 30,
    weight: 20
  },
  
  // Change percentage (not overheated)
  change: {
    min: 0,        // Positive momentum
    max: 15,       // Not overheated
    optimalMin: 3, // Sweet spot
    optimalMax: 10,
    weight: 25
  },
  
  // Volume awakening
  volume: {
    min: 100000,  // 10万 minimum
    optimal: 500000, // 50万 better
    weight: 25
  },
  
  // Sector rotation alignment
  sectors: {
    hot: ['电力', '新能源', '有色金属', '铜业'],
    warming: ['化工', '军工', '消费'],
    cold: ['地产', '金融']
  },
  
  // Pattern confirmation
  patterns: ['base_forming', 'accumulation', 'breakout', 'turning']
};

// SECTOR ROTATION TRACKER
const SECTOR_FLOW = {
  current: {
    '电力': { trend: 'heating', signal: 'EARLY' },
    '新能源': { trend: 'strong', signal: 'HOT' },
    '有色金属': { trend: 'strong', signal: 'HOT' },
    '科技': { trend: 'mixed', signal: 'WATCH' },
    '地产': { trend: 'weak', signal: 'AVOID' },
    '金融': { trend: 'weak', signal: 'AVOID' }
  },
  prediction: {
    'next_1_3_days': ['电力', '化工'],
    'next_1_week': ['军工', '消费']
  }
};

/**
 * Calculate takeoff score for a stock
 */
function calculateTakeoffScore(stock) {
  let score = 0;
  let reasons = [];
  
  // 1. Price Score
  if (stock.price >= SCREENING_CRITERIA.price.min && 
      stock.price <= SCREENING_CRITERIA.price.max) {
    score += SCREENING_CRITERIA.price.weight;
    reasons.push('✓ Small cap: ¥' + stock.price);
  }
  
  // 2. Change Score
  if (stock.change >= SCREENING_CRITERIA.change.min && 
      stock.change <= SCREENING_CRITERIA.change.max) {
    score += SCREENING_CRITERIA.change.weight;
    if (stock.change >= SCREENING_CRITERIA.change.optimalMin &&
        stock.change <= SCREENING_CRITERIA.change.optimalMax) {
      score += 10; // Bonus for sweet spot
      reasons.push('✓ Sweet spot: +' + stock.change + '%');
    } else {
      reasons.push('✓ Positive: +' + stock.change + '%');
    }
  }
  
  // 3. Volume Score
  if (stock.volume >= SCREENING_CRITERIA.volume.min) {
    score += 15;
    if (stock.volume >= SCREENING_CRITERIA.volume.optimal) {
      score += 10;
      reasons.push('✓ Volume awakening: ' + Math.round(stock.volume/10000) + '万');
    } else {
      reasons.push('✓ Volume present: ' + Math.round(stock.volume/10000) + '万');
    }
  }
  
  // 4. Sector Score
  const sectorStatus = SECTOR_FLOW.current[stock.sector];
  if (sectorStatus) {
    if (sectorStatus.signal === 'EARLY' || sectorStatus.signal === 'HOT') {
      score += 20;
      reasons.push('✓ Sector: ' + stock.sector + ' (' + sectorStatus.signal + ')');
    } else if (sectorStatus.signal === 'WATCH') {
      score += 10;
      reasons.push('✓ Sector: ' + stock.sector + ' (WATCH)');
    } else {
      reasons.push('✗ Sector: ' + stock.sector + ' (AVOID)');
    }
  }
  
  return { score, reasons };
}

/**
 * Get action recommendation
 */
function getRecommendation(score) {
  if (score >= 80) return { action: 'BUY', emoji: '🚀' };
  if (score >= 60) return { action: 'WATCH', emoji: '👀' };
  if (score >= 40) return { action: 'WAIT', emoji: '⏳' };
  return { action: 'AVOID', emoji: '❌' };
}

module.exports = {
  SCREENING_CRITERIA,
  SECTOR_FLOW,
  calculateTakeoffScore,
  getRecommendation
};
