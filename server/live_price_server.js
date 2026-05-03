#!/usr/bin/env node
// Simple local server that fetches live prices from API
// Desktop app reads from this local server (bypasses CORS)

const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 3899;
const PRICES_FILE = '/Users/liu/Desktop/Stock_Analysis/server/current_prices.json';
const ENTRIES_FILE = '/Users/liu/Desktop/Stock_Analysis/server/entries.json';

const STOCKS = {
  '600085': '同仁堂', '000792': '盐湖股份', '600066': '宇通客车',
  '000938': '紫光股份', '000651': '格力电器', '300045': '奥普光电',
  '300046': '台基股份', '000513': '丽珠集团', '300122': '智飞生物',
  '0700': '腾讯控股', '601012': '隆基绿能'
};

function getEntries() {
  try { return JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8')); } catch(e) { return {}; }
}

function fetchPrice(code) {
  return new Promise((resolve) => {
    let prefix = 'sh';
    if (/^0[0-9]{4}$/.test(code) && !code.startsWith('000') && !code.startsWith('002') && !code.startsWith('300') && !code.startsWith('001')) {
      prefix = 'hk';
    } else if (code.startsWith('8')) {
      prefix = 'bj';
    } else if (code.startsWith('0') || code.startsWith('3')) {
      prefix = 'sz';
    }
    
    https.get(`https://qt.gtimg.cn/q=${prefix}${code}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const p = data.split('~');
          resolve({ price: parseFloat(p[3]) || 0, change: parseFloat(p[32]) || 0, vol: parseFloat(p[4]) || 0 });
        } catch(e) { resolve({ price: 0, change: 0, vol: 0 }); }
      });
    }).on('error', () => resolve({ price: 0, change: 0, vol: 0 }));
  });
}

async function updatePrices() {
  const prices = {};
  for (let code of Object.keys(STOCKS)) {
    prices[code] = await fetchPrice(code);
    await new Promise(r => setTimeout(r, 100));
  }
  fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2));
  console.log(`[${new Date().toLocaleTimeString()}] Prices updated`);
}

async function main() {
  await updatePrices();
  setInterval(updatePrices, 30000);
  
  const server = http.createServer((req, res) => {
    if (req.url === '/prices') {
      try {
        const prices = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(prices));
      } catch(e) {
        res.writeHead(500);
        res.end('{}');
      }
    } else if (req.url === '/dashboard') {
      const entries = getEntries();
      const stocksJson = JSON.stringify(STOCKS);
      const entriesJson = JSON.stringify(entries);
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Live P&L Dashboard</title>
  <meta http-equiv="refresh" content="30">
  <style>
    body { font-family: -apple-system, sans-serif; background: #0a0a1a; color: #fff; padding: 20px; }
    h1 { color: #00ff88; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #333; }
    th { color: #888; }
    .up { color: #00ff88; }
    .down { color: #ff4444; }
  </style>
</head>
<body>
  <h1>📊 Live P&L Dashboard</h1>
  <p>Auto-refreshes every 30 seconds | <a href="/" style="color:#00ff88;">Home</a></p>
  <div id="prices">Loading...</div>
  <script>
    const STOCKS = ${stocksJson};
    const ENTRIES = ${entriesJson};
    function update() {
      fetch('/prices').then(r=>r.json()).then(data=>{
        let html = '<table><tr><th>Code</th><th>Name</th><th>Entry</th><th>Current</th><th>Change</th><th>P&L</th></tr>';
        let totalPnL = 0;
        let totalValue = 0;
        for(let code in STOCKS) {
          const d = data[code] || {};
          const entry = ENTRIES[code] || 0;
          const current = d.price || entry;
          const pnl = (current - entry) * 100;
          const shares = Math.round(10000 / entry);
          totalPnL += pnl * shares;
          totalValue += current * shares;
          const cls = d.change > 0 ? 'up' : d.change < 0 ? 'down' : '';
          const sign = d.change >= 0 ? '+' : '';
          html += '<tr><td>'+code+'</td><td>'+STOCKS[code]+'</td><td>¥'+entry.toFixed(2)+'</td><td>¥'+current.toFixed(2)+'</td><td class="'+cls+'">'+sign+(d.change||0).toFixed(2)+'%</td><td class="'+cls+'">'+sign+'¥'+(pnl*shares).toFixed(0)+'</td></tr>';
        }
        const pnlCls = totalPnL >= 0 ? 'up' : 'down';
        const pnlSign = totalPnL >= 0 ? '+' : '';
        html += '<tr style="font-weight:bold;background:#1a1a2e;"><td colspan="5">Total P&L</td><td class="'+pnlCls+'">'+pnlSign+'¥'+totalPnL.toFixed(0)+'</td></tr>';
        html += '</table>';
        document.getElementById('prices').innerHTML = html;
      });
    }
    update();
    setInterval(update, 30000);
  </script>
</body>
</html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Live Price Server\nEndpoints:\n  /prices - JSON prices\n  /dashboard - HTML dashboard');
    }
  });
  
  server.listen(PORT, () => {
    console.log(`\n✅ Live Price Server running!`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`📈 API: http://localhost:${PORT}/prices\n`);
  });
}

main();
