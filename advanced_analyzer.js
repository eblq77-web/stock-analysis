#!/usr/bin/env node

/**
 * ADVANCED ANALYZER - Using Mega Database (530+ stocks)
 * Integrated with Live API + Thinking Tank
 */

const fs = require('fs');
const { execSync } = require('child_process');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

// Load mega database
let megaDB = { stocks: [], exchanges: {}, counts: {} };
try {
  const data = fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8');
  megaDB = JSON.parse(data);
} catch (e) {
  console.log('⚠️ Using built-in data');
}

// Exchange definitions
const EXCHANGES = {
  SH: { name: '上海主板', traits: ['Large cap', 'State-owned', 'Stable'] },
  SZ: { name: '深圳主板', traits: ['Mid cap', 'Private', 'Growth'] },
  CN: { name: '创业板', traits: ['High growth', 'Tech', 'Innovation'] },
  BSE: { name: '北京交所', traits: ['New', 'Small cap', 'Hidden gems'] },
  HK: { name: '港股主板', traits: ['International', 'H-share', 'Dividend'] },
  HKG: { name: '港股创业板', traits: ['Small cap', 'Growth', 'Speculative'] }
};

// Live API fetcher
function fetchLive(code, ex) {
  try {
    let q = code;
    if (ex === 'SH') q = 'sh' + code;
    else if (ex === 'SZ' || ex === 'CN') q = 'sz' + code;
    else if (ex === 'BSE') q = 'bj' + code;
    else if (ex === 'HK' || ex === 'HKG') q = 'hk' + code;
    
    const r = execSync(`curl -s --max-time 3 "https://qt.gtimg.cn/q=${q}"`, { encoding: 'utf8' });
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
  return { price: 0, pct: 0, vol: 0, success: false };
}

// Advanced scoring
function analyzeStock(stock, liveData) {
  let score = 50;
  
  // Quality base
  score += (stock.quality - 50) * 0.3;
  
  // Growth
  score += Math.min(15, Math.max(-5, stock.revGrowth / 5));
  
  // ROE bonus
  score += Math.min(10, stock.roe / 4);
  
  // Live momentum
  if (liveData.success) {
    const { pct, vol } = liveData;
    score += pct > 3 ? 20 : pct > 1 ? 12 : pct > 0 ? 5 : -5;
    score += vol > 50 ? 15 : vol > 20 ? 10 : vol > 5 ? 5 : 0;
  }
  
  // Exchange bonus (BSE hidden gems get boost)
  if (stock.exchange === 'BSE') score += 5;
  if (stock.exchange === 'CN') score += 3;
  
  return {
    score: Math.round(score),
    signal: score >= 80 ? 'STRONG BUY' : score >= 65 ? 'BUY' : score >= 50 ? 'HOLD' : 'AVOID'
  };
}

// Main
function run() {
  console.log('🧠 ADVANCED ANALYZER - MEGA DATABASE');
  console.log('====================================\n');
  
  console.log(`📊 Database: ${megaDB.stocks.length} stocks | 6 Exchanges\n`);
  
  // Live data for key stocks
  const keyCodes = [
    { code: '300476', ex: 'CN' }, { code: '300750', ex: 'CN' },
    { code: '002594', ex: 'SZ' }, { code: '600519', ex: 'SH' },
    { code: '870299', ex: 'BSE' }, { code: '0700', ex: 'HK' }
  ];
  
  console.log('📡 Fetching LIVE data...\n');
  const liveData = {};
  keyCodes.forEach(k => {
    const d = fetchLive(k.code, k.ex);
    if (d.success) {
      liveData[k.code] = d;
      console.log(`✅ ${k.code}: ¥${d.price.toFixed(2)} ${d.pct >= 0 ? '+' : ''}${d.pct.toFixed(2)}%`);
    }
  });
  
  // Analyze all stocks
  console.log('\n🧠 Analyzing all ' + megaDB.stocks.length + ' stocks...\n');
  
  const results = megaDB.stocks.map(s => {
    const live = liveData[s.code] || { success: false };
    const analysis = analyzeStock(s, live);
    return { ...s, ...analysis, live };
  });
  
  results.sort((a, b) => b.score - a.score);
  
  // Top picks
  console.log('🎯 TOP 10 ANALYSIS:\n');
  results.slice(0, 10).forEach((s, i) => {
    console.log(`${i+1}. ${s.code} ${s.name} | ${s.exchange} | ${s.sector}`);
    console.log(`   Score: ${s.score} | Signal: ${s.signal}`);
    if (s.live.success) {
      console.log(`   Live: ¥${s.live.price.toFixed(2)} ${s.live.pct >= 0 ? '+' : ''}${s.live.pct.toFixed(2)}%`);
    }
    console.log('');
  });
  
  // By exchange
  console.log('📊 BY EXCHANGE:\n');
  ['BSE', 'CN', 'SH', 'SZ', 'HK', 'HKG'].forEach(ex => {
    const exStocks = results.filter(s => s.exchange === ex);
    const top = exStocks[0];
    if (top) {
      console.log(`   ${EXCHANGES[ex].name}: ${top.name} (${top.score})`);
    }
  });
  
  // Save report
  let report = `# 🧠 ADVANCED ANALYSIS - ${TODAY}\n`;
  report += `## Database: ${megaDB.stocks.length} stocks\n\n`;
  report += `## TOP 20\n`;
  results.slice(0, 20).forEach((s, i) => {
    report += `${i+1}. ${s.code} ${s.name} (${s.exchange}) - Score: ${s.score} - ${s.signal}\n`;
  });
  
  fs.writeFileSync(OUTPUT + '/ADVANCED_ANALYSIS_' + TODAY + '.txt', report);
  console.log('\n📁 Saved: ADVANCED_ANALYSIS_' + TODAY + '.txt');
}

run();
