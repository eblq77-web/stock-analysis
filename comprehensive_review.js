#!/usr/bin/env node

/**
 * COMPREHENSIVE REVIEW - All 530 Stocks Analysis
 * Institutional criteria, scoring, and prioritization
 */

const fs = require('fs');
const { execSync } = require('child_process');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

// Load database
let db = { stocks: [], exchanges: {}, counts: {} };
try {
  db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8'));
} catch {}

// Live fetcher
function fetchLive(code, ex) {
  try {
    let q = code;
    if (ex === 'SH') q = 'sh' + code;
    else if (ex === 'SZ' || ex === 'CN') q = 'sz' + code;
    else if (ex === 'BSE') q = 'bj' + code;
    else if (ex === 'HK' || ex === 'HKG') q = 'hk' + code;
    
    const r = execSync(`curl -s --max-time 2 "https://qt.gtimg.cn/q=${q}"`, { encoding: 'utf8' });
    const m = r.match(/="([^"]+)"/);
    if (m) {
      const f = m[1].split('~');
      if (f.length >= 35) {
        const price = parseFloat(f[3]);
        const open = parseFloat(f[33]) || price;
        return {
          price,
          pct: ((price - open) / open) * 100,
          vol: parseFloat(f[6]) / 10000,
          success: true
        };
      }
    }
  } catch {}
  return { success: false };
}

// INSTITUTIONAL SCORING SYSTEM
function institutionalScore(stock, live) {
  let score = 0;
  let factors = [];
  
  // 1. QUALITY (25%) - ROE, Profitability
  const qualityScore = stock.roe * 2 + stock.quality * 0.3;
  score += qualityScore * 0.25;
  factors.push(`Quality: ${Math.round(qualityScore)}`);
  
  // 2. GROWTH (20%) - Revenue growth
  const growthScore = Math.min(25, Math.max(0, stock.revGrowth + 10));
  score += growthScore * 0.20;
  factors.push(`Growth: ${Math.round(growthScore)}`);
  
  // 3. VALUATION (15%) - PE ratio
  const peScore = stock.pe < 10 ? 25 : stock.pe < 20 ? 20 : stock.pe < 30 ? 15 : 10;
  score += peScore * 0.15;
  factors.push(`PE: ${stock.pe} (${peScore})`);
  
  // 4. MARKET CAP (15%) - Larger = more institutional
  const capScore = stock.cap > 500 ? 25 : stock.cap > 100 ? 20 : stock.cap > 50 ? 15 : 10;
  score += capScore * 0.15;
  factors.push(`Cap: ${stock.cap}B`);
  
  // 5. LIVE MOMENTUM (15%) - Today's movement
  if (live.success) {
    const { pct, vol } = live;
    let mom = 0;
    if (pct > 3) mom = 25;
    else if (pct > 1) mom = 20;
    else if (pct > 0) mom = 15;
    else if (pct > -1) mom = 10;
    
    mom += vol > 30 ? 10 : vol > 10 ? 5 : 0;
    score += mom * 0.15;
    factors.push(`Momentum: ${pct.toFixed(1)}%`);
  }
  
  // 6. EXCHANGE PREMIUM (10%)
  let exPrem = 0;
  if (stock.exchange === 'BSE') exPrem = 25; // Hidden gems
  else if (stock.exchange === 'CN') exPrem = 20; // Growth
  else if (stock.exchange === 'HK') exPrem = 15; // International
  else if (stock.exchange === 'SH') exPrem = 12; // Blue chip
  else if (stock.exchange === 'SZ') exPrem = 10;
  else exPrem = 8;
  
  score += exPrem * 0.10;
  
  return {
    score: Math.round(score),
    factors,
    signal: score >= 80 ? 'PRIORITY 1' : score >= 65 ? 'PRIORITY 2' : score >= 50 ? 'WATCH' : 'AVOID'
  };
}

// Main
function run() {
  console.log('🧠 COMPREHENSIVE REVIEW - 530 STOCKS');
  console.log('=====================================\n');
  
  const liveData = {};
  
  // Fetch live for key stocks (don't overload API)
  console.log('📡 Fetching live data...\n');
  const sample = db.stocks.filter(s => s.cap > 50).slice(0, 30);
  sample.forEach(s => {
    const d = fetchLive(s.code, s.exchange);
    if (d.success) {
      liveData[s.code] = d;
    }
  });
  console.log(`✅ Live data: ${Object.keys(liveData).length} stocks\n`);
  
  // Analyze all
  console.log('🧠 Analyzing all ' + db.stocks.length + ' stocks...\n');
  
  const results = db.stocks.map(stock => {
    const live = liveData[stock.code] || { success: false };
    const analysis = institutionalScore(stock, live);
    return { ...stock, ...analysis, live };
  });
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  // Top Priority 1
  const p1 = results.filter(r => r.signal === 'PRIORITY 1');
  const p2 = results.filter(r => r.signal === 'PRIORITY 2');
  const watch = results.filter(r => r.signal === 'WATCH');
  
  console.log('📊 SCORING SUMMARY:\n');
  console.log(`   PRIORITY 1: ${p1.length} stocks`);
  console.log(`   PRIORITY 2: ${p2.length} stocks`);
  console.log(`   WATCH: ${watch.length} stocks`);
  console.log(`   AVOID: ${results.filter(r => r.signal === 'AVOID').length} stocks`);
  
  // Top 20
  console.log('\n🎯 TOP 20 PRIORITY STOCKS:\n');
  results.slice(0, 20).forEach((s, i) => {
    console.log(`${i+1}. ${s.code} ${s.name} | ${s.exchange} | ${s.sector}`);
    console.log(`   Score: ${s.score} | Signal: ${s.signal}`);
    console.log(`   Cap: ${s.cap}B | PE: ${s.pe} | ROE: ${s.roe}% | Growth: ${s.revGrowth}%`);
    if (s.live.success) {
      console.log(`   Live: ¥${s.live.price.toFixed(2)} ${s.live.pct >= 0 ? '+' : ''}${s.live.pct.toFixed(2)}%`);
    }
    console.log('');
  });
  
  // By Exchange
  console.log('\n📊 BEST BY EXCHANGE:\n');
  ['BSE', 'CN', 'HK', 'SH', 'SZ', 'HKG'].forEach(ex => {
    const best = results.find(r => r.exchange === ex && r.signal !== 'AVOID');
    if (best) {
      console.log(`   ${ex}: ${best.code} ${best.name} - Score ${best.score}`);
    }
  });
  
  // Generate comprehensive report
  let report = `# 🧠 COMPREHENSIVE STOCK REVIEW\n`;
  report += `## ${TODAY} | ${db.stocks.length} Stocks Analyzed\n\n`;
  
  report += `## SCORING SUMMARY\n`;
  report += `- PRIORITY 1: ${p1.length} stocks\n`;
  report += `- PRIORITY 2: ${p2.length} stocks\n`;
  report += `- WATCH: ${watch.length} stocks\n\n`;
  
  report += `## TOP 30 PRIORITY STOCKS\n`;
  report += `| # | Code | Name | Ex | Sector | Score | Cap | PE | ROE | Signal |\n`;
  report += `|---|------|------|-----|--------|-------|-----|----|----|--------|\n`;
  results.slice(0, 30).forEach((s, i) => {
    report += `| ${i+1} | ${s.code} | ${s.name} | ${s.exchange} | ${s.sector} | **${s.score}** | ${s.cap}B | ${s.pe} | ${s.roe}% | ${s.signal} |\n`;
  });
  
  report += `\n## BEST BY EXCHANGE\n`;
  ['BSE', 'CN', 'HK', 'SH', 'SZ', 'HKG'].forEach(ex => {
    const best = results.find(r => r.exchange === ex && r.signal !== 'AVOID');
    if (best) {
      report += `- ${ex}: ${best.code} ${best.name} - Score ${best.score}\n`;
    }
  });
  
  fs.writeFileSync(OUTPUT + '/COMPREHENSIVE_REVIEW_' + TODAY + '.txt', report);
  console.log('\n📁 Saved: COMPREHENSIVE_REVIEW_' + TODAY + '.txt');
}

run();
