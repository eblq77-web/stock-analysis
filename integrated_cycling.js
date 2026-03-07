#!/usr/bin/env node

/**
 * INTEGRATED CYCLING SYSTEM
 * Optimized workflow for continuous analysis
 */

const fs = require('fs');
const { execSync } = require('child_process');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];
const TIME = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const HOUR = new Date().getHours();

console.log('🧠 INTEGRATED CYCLING SYSTEM');
console.log('============================');
console.log(`📅 ${TODAY} ${TIME}\n`);

// Load mega database
let db = { stocks: [] };
try { db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8')); } catch {}

// Market phases
const PHASES = {
  PRE_MARKET: { start: 0, end: 9, tasks: ['self_learning', 'next_day_surfer'] },
  OPEN: { start: 9, end: 11, tasks: ['scanner', 'institutional'] },
  MIDDAY: { start: 11, end: 13, tasks: ['dashboard', 'sonar'] },
  AFTERNOON: { start: 13, end: 15, tasks: ['scanner', 'mega_live'] },
  CLOSE: { start: 15, end: 16, tasks: ['comprehensive', 'super_brain'] },
  AFTER_HOURS: { start: 16, end: 24, tasks: ['review', 'memory'] }
};

// Determine current phase
let currentPhase = 'AFTER_HOURS';
for (const [name, phase] of Object.entries(PHASES)) {
  if (HOUR >= phase.start && HOUR < phase.end) {
    currentPhase = name;
    break;
  }
}

console.log(`📍 Current Phase: ${currentPhase} (${PHASES[currentPhase].tasks.join(', ')})\n`);

// Live data fetcher (sampled)
function fetchLiveData(codes) {
  const results = {};
  codes.slice(0, 10).forEach(code => {
    try {
      const r = execSync(`curl -s --max-time 2 "https://qt.gtimg.cn/q=${code}"`, { encoding: 'utf8' });
      const m = r.match(/="([^"]+)"/);
      if (m) {
        const f = m[1].split('~');
        results[code] = { price: parseFloat(f[3]), pct: parseFloat(f[3]) - parseFloat(f[33]), success: true };
      }
    } catch {}
  });
  return results;
}

// Quick scoring
function quickScore(s) {
  let sc = 50 + s.roe * 0.5 + Math.min(10, s.revGrowth * 0.3);
  sc += { BSE: 15, CN: 12, HK: 10, SH: 8, SZ: 5, HKG: 3 }[s.exchange] || 0;
  return Math.round(sc);
}

// Cycle analysis
function runCycle() {
  console.log('🔄 Running Integrated Cycle...\n');
  
  const results = db.stocks.map(s => ({ ...s, score: quickScore(s) }));
  results.sort((a, b) => b.score - a.score);
  
  // Top picks
  const top = results.slice(0, 20);
  
  console.log('🎯 TOP 20 STOCKS:\n');
  top.forEach((s, i) => {
    console.log(`${i+1}. ${s.code} ${s.name} | ${s.exchange} | ${s.sector} | Score: ${s.score}`);
  });
  
  // By exchange
  console.log('\n📊 BEST BY EXCHANGE:');
  ['BSE', 'CN', 'HK', 'SH', 'SZ', 'HKG'].forEach(ex => {
    const best = results.find(r => r.exchange === ex);
    if (best) console.log(`   ${ex}: ${best.code} ${best.name} (${best.score})`);
  });
  
  // Phase-specific insights
  console.log(`\n💡 ${currentPhase} INSIGHTS:`);
  if (currentPhase === 'PRE_MARKET') {
    console.log('   → Focus: Next day predictions, Self-learning');
  } else if (currentPhase === 'OPEN') {
    console.log('   → Focus: Institutional flow, Early momentum');
  } else if (currentPhase === 'MIDDAY') {
    console.log('   → Focus: Dashboard review, Hidden gems');
  } else if (currentPhase === 'AFTERNOON') {
    console.log('   → Focus: Late moves, Breakout candidates');
  } else if (currentPhase === 'CLOSE') {
    console.log('   → Focus: Comprehensive scan, Super brain');
  } else {
    console.log('   → Focus: Review, Memory backup');
  }
  
  // Save cycle report
  let report = `# 🔄 INTEGRATED CYCLE REPORT\n`;
  report += `## ${TODAY} ${TIME}\n`;
  report += `## Phase: ${currentPhase}\n\n`;
  report += `## TOP 30 STOCKS\n`;
  report += `| # | Code | Name | Ex | Sector | Score |\n`;
  report += `|---|------|------|-----|--------|-------|\n`;
  results.slice(0, 30).forEach((s, i) => {
    report += `| ${i+1} | ${s.code} | ${s.name} | ${s.exchange} | ${s.sector} | **${s.score}** |\n`;
  });
  
  fs.writeFileSync(OUTPUT + '/CYCLE_REPORT_' + TODAY + '.txt', report);
  console.log('\n📁 Saved: CYCLE_REPORT_' + TODAY + '.txt');
  
  return { phase: currentPhase, top, count: db.stocks.length };
}

runCycle();
