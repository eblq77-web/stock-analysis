#!/usr/bin/env node

/**
 * COMPREHENSIVE REVIEW V2 - Adjusted Scoring
 */

const fs = require('fs');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

let db = { stocks: [] };
try { db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8')); } catch {}

// Better scoring
function scoreStock(s) {
  let sc = 50; // base
  
  // Quality (ROE) - higher is better
  sc += Math.min(20, s.roe);
  
  // Growth
  sc += Math.min(15, Math.max(-10, s.revGrowth));
  
  // Size premium (institutional likes liquid)
  sc += s.cap > 500 ? 15 : s.cap > 100 ? 10 : s.cap > 50 ? 5 : 0;
  
  // PE reasonable
  sc += s.pe < 20 ? 10 : s.pe < 30 ? 5 : 0;
  
  // Exchange premium
  const exPrem = { BSE: 15, CN: 12, HK: 10, SH: 8, SZ: 5, HKG: 3 };
  sc += exPrem[s.exchange] || 0;
  
  return {
    score: Math.round(sc),
    signal: sc >= 75 ? 'P1' : sc >= 60 ? 'P2' : sc >= 45 ? 'WATCH' : 'AVOID'
  };
}

console.log('🧠 COMPREHENSIVE REVIEW V2');
console.log('===========================\n');

const results = db.stocks.map(s => ({ ...s, ...scoreStock(s) }));
results.sort((a, b) => b.score - a.score);

const p1 = results.filter(r => r.signal === 'P1');
const p2 = results.filter(r => r.signal === 'P2');
const watch = results.filter(r => r.signal === 'WATCH');

console.log('📊 DISTRIBUTION:\n');
console.log(`   PRIORITY 1: ${p1.length} stocks`);
console.log(`   PRIORITY 2: ${p2.length} stocks`);
console.log(`   WATCH: ${watch.length} stocks`);
console.log(`   AVOID: ${results.filter(r => r.signal === 'AVOID').length} stocks\n`);

console.log('🎯 TOP 15 PRIORITY 1:\n');
p1.slice(0, 15).forEach((s, i) => {
  console.log(`${i+1}. ${s.code} ${s.name} | ${s.exchange} | ${s.sector}`);
  console.log(`   Score: ${s.score} | Cap: ${s.cap}B | PE: ${s.pe} | ROE: ${s.roe}% | Growth: ${s.revGrowth}%`);
  console.log('');
});

console.log('📊 BEST BY EXCHANGE:\n');
['BSE', 'CN', 'HK', 'SH', 'SZ', 'HKG'].forEach(ex => {
  const best = p1.find(r => r.exchange === ex) || p2.find(r => r.exchange === ex);
  if (best) console.log(`   ${ex}: ${best.code} ${best.name} (Score: ${best.score})`);
});

// Save
let report = `# 🧠 COMPREHENSIVE REVIEW\n## ${TODAY}\n\n`;
report += `## Summary\n- P1: ${p1.length} | P2: ${p2.length} | Watch: ${watch.length}\n\n`;
report += `## TOP 30\n| # | Code | Name | Ex | Sector | Score | Cap | PE | ROE | Growth |\n`;
report += `|---|------|------|-----|--------|-------|-----|----|-----|--------|\n`;
results.slice(0, 30).forEach((s, i) => {
  report += `| ${i+1} | ${s.code} | ${s.name} | ${s.exchange} | ${s.sector} | **${s.score}** | ${s.cap}B | ${s.pe} | ${s.roe}% | ${s.revGrowth}% |\n`;
});

fs.writeFileSync(OUTPUT + '/COMPREHENSIVE_REVIEW_' + TODAY + '.txt', report);
console.log('\n📁 Saved!');
