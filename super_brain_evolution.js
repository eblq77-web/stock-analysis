#!/usr/bin/env node

/**
 * SUPER BRAIN EVOLUTION V2
 * Advanced AI-powered analysis
 */

const fs = require('fs');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

console.log('🧠 SUPER BRAIN EVOLUTION V2');
console.log('===========================\n');

let db = { stocks: [] };
try { db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8')); } catch {}

// Pattern Recognition
function recognizePatterns(stocks) {
  const patterns = {
    'BREAKOUT': [],
    'ACCUMULATOR': [],
    'DISTRIBUTION': [],
    'CONSOLIDATION': [],
    'REVERSAL': []
  };
  
  stocks.forEach(s => {
    if (s.score >= 80 && s.revGrowth > 20) patterns['BREAKOUT'].push(s);
    else if (s.score >= 70 && s.roe > 25) patterns['ACCUMULATOR'].push(s);
    else if (s.score < 60 && s.pe < 10) patterns['DISTRIBUTION'].push(s);
    else if (s.score >= 65 && s.pe < 15) patterns['CONSOLIDATION'].push(s);
    else if (s.score >= 60 && s.revGrowth < 0) patterns['REVERSAL'].push(s);
  });
  
  return patterns;
}

// Sector Rotation
function sectorRotation() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour < 11) return { sector: '金融', bias: 'institutional' };
  if (hour >= 11 && hour < 13) return { sector: '新能源', bias: 'momentum' };
  if (hour >= 13 && hour < 15) return { sector: '消费', bias: 'defensive' };
  return { sector: 'AI', bias: 'momentum' };
}

// Risk Assessment
function riskAssessment(stock) {
  let risk = 0;
  const factors = [];
  if (stock.pe > 50) { risk += 30; factors.push('High PE'); }
  if (stock.pe < 0) { risk += 50; factors.push('Negative PE'); }
  if (stock.revGrowth < -10) { risk += 20; factors.push('Declining'); }
  if (stock.roe < 5) { risk += 20; factors.push('Low ROE'); }
  if (stock.cap < 10) { risk += 15; factors.push('Small Cap'); }
  return { risk, rating: risk < 20 ? 'LOW' : risk < 40 ? 'MEDIUM' : 'HIGH', factors };
}

// Optimal Entry
function optimalEntry(stock) {
  return {
    position: Math.min(20, stock.cap * 0.1).toFixed(1),
    target1: (stock.pe * 1.1).toFixed(1),
    target2: (stock.pe * 1.25).toFixed(1),
    stop: (stock.pe * 0.93).toFixed(1)
  };
}

// Sentiment
function sentimentAnalysis() {
  const h = new Date().getHours();
  if (h >= 9 && h < 11) return 'BULLISH';
  if (h >= 13 && h < 15) return 'NEUTRAL';
  return 'NEUTRAL';
}

// Score
function score(s) {
  let sc = 50 + s.roe * 0.6 + Math.min(15, s.revGrowth * 0.4);
  sc += { BSE: 15, CN: 12, HK: 10, SH: 8, SZ: 5, HKG: 3 }[s.exchange] || 0;
  return Math.round(sc);
}

const results = db.stocks.map(s => ({ ...s, score: score(s), risk: riskAssessment(s) }));
results.sort((a, b) => b.score - a.score);

console.log(`📊 Analyzed: ${results.length} stocks\n`);

const patterns = recognizePatterns(results);
console.log('🎨 PATTERNS:');
Object.entries(patterns).forEach(([p, a]) => console.log(`   ${p}: ${a.length}`));

const rotation = sectorRotation();
console.log(`\n🎯 SECTOR: ${rotation.sector} (${rotation.bias})`);

console.log(`\n💭 SENTIMENT: ${sentimentAnalysis()}\n`);

console.log('🚀 TOP 10:\n');
results.slice(0, 10).forEach((s, i) => {
  const e = optimalEntry(s);
  console.log(`${i+1}. ${s.code} ${s.name} [${s.exchange}]`);
  console.log(`   Score: ${s.score} | Risk: ${s.risk.rating} | Pos: ${e.position}% | Target: ${e.target1}x`);
});

let report = `# 🧠 SUPER BRAIN EVOLUTION V2\n## ${TODAY}\n\n`;
report += `## SECTOR: ${rotation.sector}\n## SENTIMENT: ${sentimentAnalysis()}\n\n`;
report += `## PATTERNS\n`;
Object.entries(patterns).forEach(([p, a]) => report += `- ${p}: ${a.length}\n`);
report += `\n## TOP 20\n| # | Code | Name | Ex | Score | Risk | Position% |\n`;
report += `|---|------|------|-----|-------|------|----------|\n`;
results.slice(0, 20).forEach((s, i) => {
  const e = optimalEntry(s);
  report += `| ${i+1} | ${s.code} | ${s.name} | ${s.exchange} | **${s.score}** | ${s.risk.rating} | ${e.position}% |\n`;
});

fs.writeFileSync(OUTPUT + '/SUPER_BRAIN_V2_' + TODAY + '.txt', report);
console.log('\n📁 Saved!');
