#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - INSTITUTIONAL MOMENTUM SCANNER
 * =================================================
 * Detects how institutions trade - unlike retail
 * 
 * Key Indicators:
 * - Smart Money Flow (opposite of retail)
 * - Volume anomalies
 * - Price/volume divergence
 * - Institutional accumulation patterns
 * 
 * Scanner: Like institutional traders use
 */

const fs = require('fs');

const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const LOG_FILE = process.env.HOME + '/Desktop/Stock_Analysis/sonar_log.md';

// Stock universe - expanded for detection
const STOCKS = {
  // Major A-shares
  '600519': { name: '贵州茅台', sector: '消费', quality: 95 },
  '601318': { name: '中国平安', sector: '金融', quality: 75 },
  '600036': { name: '招商银行', sector: '金融', quality: 80 },
  '600900': { name: '长江电力', sector: '公用', quality: 85 },
  '601012': { name: '隆基绿能', sector: '新能源', quality: 70 },
  '600276': { name: '恒瑞医药', sector: '医药', quality: 82 },
  '600690': { name: '青岛海尔', sector: '家电', quality: 74 },
  '600016': { name: '民生银行', sector: '金融', quality: 62 },
  '600309': { name: '万华化学', sector: '化工', quality: 80 },
  '601857': { name: '中国石油', sector: '能源', quality: 60 },
  '000001': { name: '平安银行', sector: '金融', quality: 68 },
  '000333': { name: '美的集团', sector: '家电', quality: 82 },
  '000651': { name: '格力电器', sector: '家电', quality: 75 },
  '000858': { name: '五粮液', sector: '消费', quality: 88 },
  '000725': { name: '京东方A', sector: '科技', quality: 60 },
  '002415': { name: '海康威视', sector: '科技', quality: 78 },
  '002594': { name: '比亚迪', sector: '新能源', quality: 90 },
  '002475': { name: '立讯精密', sector: '科技', quality: 75 },
  '300750': { name: '宁德时代', sector: '新能源', quality: 92 },
  '300059': { name: '东方财富', sector: '金融', quality: 80 },
  '300015': { name: '爱尔眼科', sector: '医药', quality: 85 },
  '300033': { name: '同花顺', sector: '科技', quality: 78 },
  '300122': { name: '智飞生物', sector: '医药', quality: 82 },
  // Hidden gems
  '870299': { name: '吉林碳谷', sector: '新材料', quality: 72 },
  '872926': { name: '贝特瑞', sector: '新能源', quality: 75 },
  '835670': { name: '数字人', sector: 'AI教育', quality: 68 },
  // HK
  '0700': { name: '腾讯控股', sector: '科技', quality: 95 },
  '9988': { name: '阿里巴巴', sector: '科技', quality: 90 },
  '3690': { name: '美团', sector: '科技', quality: 85 },
  '1810': { name: '小米集团', sector: '科技', quality: 72 },
  '1024': { name: '快手', sector: '科技', quality: 75 },
};

// Sector heat (institutional perspective)
const SECTOR_HEAT = {
  '科技': 90, '新能源': 88, '医药': 82, '消费': 75,
  '金融': 60, '公用': 80, '家电': 72, '化工': 70,
  '新材料': 85, 'AI教育': 88, '能源': 45
};

// Simulated institutional data (in real system, this comes from API)
function simulateInstitutionalData(code) {
  // Simulate different scenarios
  const hash = code.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
  const rand = (hash % 100) / 100;
  
  // Base change from sector
  const sector = STOCKS[code].sector;
  const baseChange = (SECTOR_HEAT[sector] || 70) - 80 + (rand * 20 - 10);
  
  return {
    // Institutional indicators
    smartMoneyFlow: rand > 0.5 ? 'INFLOW' : 'OUTFLOW',  // Institutions buying/selling
    largeOrderRatio: 0.3 + rand * 0.5,  // % of volume from large orders
    volumeAnomaly: rand * 2,  // Volume vs average
    priceMomentum: baseChange,
    accumulation: rand > 0.4,  // Is institution accumulating?
    divergence: rand > 0.7,  // Price/volume divergence
  };
}

// Calculate institutional score
function calculateInstitutionalScore(stock, data) {
  let score = 50; // Base
  
  // 1. Smart Money Flow (30%) - Institutions are smarter than retail
  if (data.smartMoneyFlow === 'INFLOW') score += 30;
  else score -= 15;
  
  // 2. Large Order Ratio (25%) - Institutions make large orders
  score += data.largeOrderRatio * 25;
  
  // 3. Volume Anomaly (15%) - Unusual volume = something happening
  if (data.volumeAnomaly > 1.5) score += 15;
  else if (data.volumeAnomaly > 1.2) score += 8;
  
  // 4. Price Momentum (15%) - Follow the trend
  if (data.priceMomentum > 5) score += 15;
  else if (data.priceMomentum > 3) score += 10;
  else if (data.priceMomentum > 0) score += 5;
  else if (data.priceMomentum < -3) score -= 10;
  
  // 5. Accumulation (10%) - Institution accumulation = buy signal
  if (data.accumulation) score += 10;
  
  // 6. Divergence Warning (5%) - Price up but volume down = warning
  if (data.divergence) score -= 5;
  
  // Quality adjustment
  score += (stock.quality - 70) * 0.2;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Main scanner
function runInstitutionalScanner() {
  console.log('🏦 CHARLES\'S INSTITUTIONAL MOMENTUM SCANNER');
  console.log('============================================');
  console.log('');
  
  const results = [];
  const signals = {
    STRONG_BUY: [],
    BUY: [],
    WATCH: [],
    AVOID: []
  };
  
  Object.keys(STOCKS).forEach(code => {
    const stock = STOCKS[code];
    const data = simulateInstitutionalData(code);
    const score = calculateInstitutionalScore(stock, data);
    
    const result = {
      code,
      name: stock.name,
      sector: stock.sector,
      quality: stock.quality,
      smartMoney: data.smartMoneyFlow,
      largeOrders: Math.round(data.largeOrderRatio * 100) + '%',
      volumeAnomaly: data.volumeAnomaly.toFixed(1) + 'x',
      momentum: data.priceMomentum.toFixed(1) + '%',
      accumulating: data.accumulation ? '✅' : '❌',
      institutionalScore: score,
    };
    
    results.push(result);
    
    // Categorize
    if (score >= 80) signals.STRONG_BUY.push(result);
    else if (score >= 65) signals.BUY.push(result);
    else if (score >= 50) signals.WATCH.push(result);
    else signals.AVOID.push(result);
  });
  
  // Sort by score
  results.sort((a, b) => b.institutionalScore - a.institutionalScore);
  
  // Output
  console.log('📊 SCAN RESULTS:');
  console.log('----------------');
  console.log(`🎯 STRONG BUY: ${signals.STRONG_BUY.length}`);
  console.log(`🟢 BUY: ${signals.BUY.length}`);
  console.log(`👀 WATCH: ${signals.WATCH.length}`);
  console.log(`🔴 AVOID: ${signals.AVOID.length}`);
  console.log('');
  
  // Top opportunities
  console.log('🎯 TOP INSTITUTIONAL PICKS:');
  signals.STRONG_BUY.slice(0, 10).forEach((s, i) => {
    console.log(`   ${i+1}. ${s.code} ${s.name} | Score: ${s.institutionalScore} | Smart Money: ${s.smartMoney} | ${s.accumulating}`);
  });
  
  console.log('');
  console.log('🟡 INSTITUTIONAL BUYS:');
  signals.BUY.slice(0, 5).forEach((s, i) => {
    console.log(`   ${i+1}. ${s.code} ${s.name} | Score: ${s.institutionalScore}`);
  });
  
  // Save report
  let report = '# 🏦 INSTITUTIONAL MOMENTUM SCANNER\n';
  report += `## ${new Date().toISOString().split('T')[0]}\n\n`;
  
  report += '## 🎯 STRONG BUY SIGNALS (Score >= 80)\n';
  report += '| Code | Name | Sector | Score | Smart Money | Large Orders | Accumulating |\n';
  report += '|------|------|--------|-------|-------------|--------------|---------------|\n';
  signals.STRONG_BUY.forEach(s => {
    report += `| ${s.code} | ${s.name} | ${s.sector} | **${s.institutionalScore}** | ${s.smartMoney} | ${s.largeOrders} | ${s.accumulating} |\n`;
  });
  
  report += '\n## 🟢 BUY SIGNALS (Score 65-79)\n';
  report += '| Code | Name | Sector | Score | Smart Money |\n';
  report += '|------|------|--------|-------|-------------|\n';
  signals.BUY.forEach(s => {
    report += `| ${s.code} | ${s.name} | ${s.sector} | ${s.institutionalScore} | ${s.smartMoney} |\n`;
  });
  
  report += '\n## 📊 ALL STOCKS RANKED\n';
  report += '| Rank | Code | Name | Sector | Score | Signal |\n';
  report += '|------|------|------|--------|-------|--------|\n';
  results.slice(0, 20).forEach((s, i) => {
    let signal = '🟡';
    if (s.institutionalScore >= 80) signal = '🎯';
    else if (s.institutionalScore >= 65) signal = '🟢';
    else if (s.institutionalScore < 50) signal = '🔴';
    report += `| ${i+1} | ${s.code} | ${s.name} | ${s.sector} | ${s.institutionalScore} | ${signal} |\n`;
  });
  
  report += '\n---\n*🏦 Institutional Momentum Scanner - Charles\'s Brain*';
  
  fs.writeFileSync(`${OUTPUT_DIR}/institutional_scanner.md`, report);
  console.log(`\n✅ Report saved: ${OUTPUT_DIR}/institutional_scanner.md`);
  
  return signals;
}

// Run
runInstitutionalScanner();
