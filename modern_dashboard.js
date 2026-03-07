#!/usr/bin/env node

/**
 * MODERN DASHBOARD - Real-time Super Brain
 */

const fs = require('fs');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

let db = { stocks: [] };
try { db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8')); } catch {}

function score(s) {
  let sc = 50 + s.roe * 0.6 + Math.min(15, s.revGrowth * 0.4);
  sc += { BSE: 15, CN: 12, HK: 10, SH: 8, SZ: 5, HKG: 3 }[s.exchange] || 0;
  return Math.round(sc);
}

const results = db.stocks.map(s => ({ ...s, score: score(s) }));
results.sort((a, b) => b.score - a.score);

const exCounts = {};
results.forEach(r => exCounts[r.exchange] = (exCounts[r.exchange] || 0) + 1);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Super Brain Dashboard</title>
<meta http-equiv="refresh" content="60">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#000;color:#fff;min-height:100vh}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center;border-bottom:3px solid #00d4ff}
.header h1{font-size:36px;background:-webkit-linear-gradient(#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header p{color:#888;margin-top:5px}
.clock{font-size:14px;color:#00d4ff;margin-top:10px}
.stats{display:flex;justify-content:center;gap:15px;padding:20px;flex-wrap:wrap}
.stat{background:#111;border-radius:12px;padding:15px 25px;text-align:center;min-width:100px;border:1px solid #222}
.stat-num{font-size:28px;font-weight:bold;color:#00d4ff}
.stat-label{font-size:11px;color:#666;margin-top:5px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;padding:20px}
.card{background:#0a0a0a;border-radius:16px;padding:20px;border:1px solid #1a1a1a}
.card h2{font-size:16px;color:#00ff88;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #1a1a1a}
.stock{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #111}
.stock:last-child{border:none}
.stock-code{font-weight:bold;color:#fff}
.stock-name{color:#666;font-size:12px}
.stock-score{font-weight:bold;color:#00d4ff}
.ex{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:5px}
.SH{background:#ef4444}.SZ{background:#f59e0b}.CN{background:#8b5cf6}.BSE{background:#10b981}.HK{background:#3b82f6}.HKG{background:#06b6d4}
.bar{height:4px;background:#111;border-radius:2px;margin-top:5px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,#00d4ff,#00ff88);border-radius:2px;transition:width 0.5s}
.rank{color:#00d4ff;font-weight:bold;margin-right:10px}
.pulse{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
</style>
</head>
<body>
<div class="header">
<h1>🧠 SUPER BRAIN</h1>
<p>Charles's AI Trading System</p>
<p class="clock">${new Date().toLocaleString('zh-CN')}</p>
</div>
<div class="stats">
<div class="stat"><div class="stat-num">${results.length}</div><div class="stat-label">TOTAL STOCKS</div></div>
<div class="stat"><div class="stat-num">${results.filter(r=>r.score>=80).length}</div><div class="stat-label">BREAKOUT</div></div>
<div class="stat"><div class="stat-num">${results.filter(r=>r.score>=70&&r.score<80).length}</div><div class="stat-label">ACCUMULATOR</div></div>
<div class="stat"><div class="stat-num">6</div><div class="stat-label">EXCHANGES</div></div>
</div>
<div class="grid">
<div class="card">
<h2>🔥OUT</h2>
${results.slice(0,10).map((s,i)=>`<div class="stock"><div><span class=" TOP 10 BREAKrank">#${i+1}</span><span class="stock-code">${s.code}</span><span class="ex ${s.exchange}">${s.exchange}</span><div class="stock-name">${s.name}</div></div><div class="stock-score">${s.score}</div></div>`).join('')}
</div>
<div class="card">
<h2>📊 BY EXCHANGE</h2>
${Object.entries(exCounts).map(([ex,c])=>`<div class="stock"><span class="stock-code"><span class="ex ${ex}">${ex}</span></span><div class="bar" style="width:100%"><div class="bar-fill" style="width:${c/results.length*100}%"></div></div><span class="stock-score">${c}</span></div>`).join('')}
</div>
<div class="card">
<h2>🎯 SECTOR FOCUS</h2>
${['BSE','CN','HK','SH','SZ','HKG'].map(ex=>{const b=results.find(r=>r.exchange===ex);return b?`<div class="stock"><span class="stock-code">${ex}</span><span class="stock-name">${b.name}</span><span class="stock-score">${b.score}</span></div>`:''}).join('')}
</div>
</div>
<p style="text-align:center;color:#333;font-size:12px;padding:20px">Auto-refreshes every 60s | Super Brain V2</p>
</body>
</html>`;

fs.writeFileSync(OUTPUT + '/super_brain_dashboard.html', html);
console.log('✅ Modern dashboard saved!');
