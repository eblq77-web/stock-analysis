#!/usr/bin/env node

/**
 * FULL STOCK PORTFOLIO - 530+ Stocks with Exchange Filtering
 */

const fs = require('fs');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

let db = { stocks: [] };
try { db = JSON.parse(fs.readFileSync(OUTPUT + '/mega_plus.json', 'utf8')); } catch {}

// Scoring
function score(s) {
  let sc = 50 + Math.min(20, s.roe) + Math.min(15, Math.max(-10, s.revGrowth));
  sc += s.cap > 500 ? 15 : s.cap > 100 ? 10 : 5;
  sc += s.pe < 20 ? 10 : s.pe < 30 ? 5 : 0;
  const exPrem = { BSE: 15, CN: 12, HK: 10, SH: 8, SZ: 5, HKG: 3 };
  sc += exPrem[s.exchange] || 0;
  return sc;
}

const results = db.stocks.map(s => ({ ...s, score: score(s) }));
results.sort((a, b) => b.score - a.score);

// Exchange names
const EX = {
  SH: '上海主板',
  SZ: '深圳主板', 
  CN: '创业板',
  BSE: '北京交所',
  HK: '港股主板',
  HKG: '港股创业板'
};

// Generate HTML
let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Stock Portfolio - ${TODAY}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0f;color:#fff;padding:20px}
h1{text-align:center;font-size:28px;margin-bottom:5px}
.sub{text-align:center;color:#666;margin-bottom:20px}
.stats{display:flex;justify-content:center;gap:15px;margin-bottom:25px;flex-wrap:wrap}
.stat{background:#151520;padding:15px 20px;border-radius:10px;text-align:center;cursor:pointer;transition:0.2s;border:2px solid transparent}
.stat:hover{transform:translateY(-2px)}
.stat.active{border-color:#00d4ff;background:#1a1a30}
.stat-num{font-size:22px;font-weight:bold;color:#00d4ff}
.stat-label{font-size:11px;color:#888}
.search{width:100%;max-width:400px;padding:12px 20px;background:#151520;border:none;border-radius:8px;color:#fff;font-size:14px;margin:0 auto 20px;display:block}
table{width:100%;border-collapse:collapse;background:#12121a;border-radius:12px;overflow:hidden}
th{background:#1a1a28;padding:12px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase}
td{padding:10px 8px;border-bottom:1px solid #1a1a28;font-size:13px}
tr:hover{background:#1a1a28}
.ex{padding:3px 8px;border-radius:6px;font-size:11px;cursor:pointer;transition:0.2s}
.ex:hover{transform:scale(1.1)}
.SH{background:#ef4444;color:#fff}.SZ{background:#f59e0b;color:#000}.CN{background:#8b5cf6;color:#fff}.BSE{background:#10b981;color:#fff}.HK{background:#3b82f6;color:#fff}.HKG{background:#06b6d4;color:#000}
.score{font-weight:bold;color:#00d4ff}
.p1{color:#00ff88}.p2{color:#f59e0b}.p3{color:#666}
.priority{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:bold}
.p1{background:#00ff88;color:#000}.p2{background:#f59e0b;color:#000}.p3{background:#333;color:#888}
.paginate{text-align:center;margin-top:20px}
.page{display:inline-block;padding:8px 14px;background:#1a1a28;border-radius:6px;margin:0 3px;cursor:pointer}
.page.active{background:#00d4ff;color:#000}
.info{text-align:center;color:#666;font-size:12px;margin-top:10px}
.current-filter{text-align:center;margin-bottom:15px}
.current-filter span{background:#00d4ff;color:#000;padding:5px 15px;border-radius:20px;font-size:12px}
</style>
</head>
<body>
<h1>🧠 Stock Portfolio</h1>
<p class="sub">${TODAY} | ${results.length} Stocks | 6 Exchanges</p>

<div class="stats">
<div class="stat active" data-ex="all" onclick="setEx('all')">
<div class="stat-num">${results.length}</div><div class="stat-label">All Stocks</div>
</div>
<div class="stat" data-ex="BSE" onclick="setEx('BSE')">
<div class="stat-num">${results.filter(r=>r.exchange==='BSE').length}</div><div class="stat-label">北京交所</div>
</div>
<div class="stat" data-ex="CN" onclick="setEx('CN')">
<div class="stat-num">${results.filter(r=>r.exchange==='CN').length}</div><div class="stat-label">创业板</div>
</div>
<div class="stat" data-ex="SH" onclick="setEx('SH')">
<div class="stat-num">${results.filter(r=>r.exchange==='SH').length}</div><div class="stat-label">上海主板</div>
</div>
<div class="stat" data-ex="SZ" onclick="setEx('SZ')">
<div class="stat-num">${results.filter(r=>r.exchange==='SZ').length}</div><div class="stat-label">深圳主板</div>
</div>
<div class="stat" data-ex="HK" onclick="setEx('HK')">
<div class="stat-num">${results.filter(r=>r.exchange==='HK').length}</div><div class="stat-label">港股主板</div>
</div>
<div class="stat" data-ex="HKG" onclick="setEx('HKG')">
<div class="stat-num">${results.filter(r=>r.exchange==='HKG').length}</div><div class="stat-label">港股创业板</div>
</div>
</div>

<div class="current-filter" id="currentFilter"></div>

<input type="text" class="search" placeholder="Search code, name, sector..." id="search">

<table>
<thead><tr><th>#</th><th>Code</th><th>Name</th><th>Exchange</th><th>Sector</th><th>Score</th><th>Cap(B)</th><th>PE</th><th>ROE%</th><th>Growth%</th></tr></thead>
<tbody id="tbody"></tbody>
</table>

<div class="paginate" id="paginate"></div>
<p class="info">💡 Click exchange badges to filter | Click stats above to switch exchange</p>

<script>
const data = ${JSON.stringify(results)};
const EX = ${JSON.stringify(EX)};
let currentEx = 'all';
let currentPage = 1;
const perPage = 50;

function getPriority(s){return s>=75?'P1':s>=60?'P2':'P3'}

function render(){
  const search=document.getElementById('search').value.toLowerCase();
  let filtered = data.filter(r=>{
    const matchSearch = !search || r.code.toLowerCase().includes(search) || r.name.toLowerCase().includes(search) || r.sector.toLowerCase().includes(search);
    const matchEx = currentEx === 'all' || r.exchange === currentEx;
    return matchSearch && matchEx;
  });
  
  const total=Math.ceil(filtered.length/perPage);
  currentPage = Math.min(currentPage, Math.max(1, total));
  const start=(currentPage-1)*perPage;
  
  const rows=filtered.slice(start,start+perPage).map((r,i)=>\`<tr>
<td>\${start+i+1}</td>
<td><b>\${r.code}</b></td>
<td>\${r.name}</td>
<td><span class="ex \${r.exchange}" onclick="setEx('\${r.exchange}')" title="\${EX[r.exchange]}">\${r.exchange}</span></td>
<td>\${r.sector}</td>
<td><span class="score">\${r.score}</span> <span class="priority \${getPriority(r.score)}">\${getPriority(r.score)}</span></td>
<td>\${r.cap}</td>
<td>\${r.pe}</td>
<td>\${r.roe}</td>
<td>\${r.revGrowth}</td>
</tr>\`).join('');
  
  document.getElementById('tbody').innerHTML = rows || '<tr><td colspan="10" style="text-align:center;padding:40px;color:#666">No stocks found</td></tr>';
  
  let pgs='<span class="page" onclick="go(1)">«</span>';
  for(let i=1;i<=total;i++)pgs+=\`<span class="page \${i===currentPage?'active':''}" onclick="go(\${i})">\${i}</span>\`;
  pgs+='<span class="page" onclick="go('+total+')">»</span>';
  document.getElementById('paginate').innerHTML = total > 1 ? pgs : '';
  
  // Update filter indicator
  document.getElementById('currentFilter').innerHTML = currentEx !== 'all' ? '<span>Showing: ' + EX[currentEx] + ' (' + filtered.length + ' stocks)</span>' : '';
}

function setEx(ex){
  currentEx = ex;
  currentPage = 1;
  document.querySelectorAll('.stat').forEach(s => s.classList.toggle('active', s.dataset.ex === ex));
  render();
}

function go(n){currentPage=n;render()}
document.getElementById('search').addEventListener('input',()=>{currentPage=1;render()});
render();
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT + '/stock_portfolio_' + TODAY + '.html', html);
console.log('✅ Saved: stock_portfolio_' + TODAY + '.html');
console.log('Total: ' + results.length + ' stocks');
