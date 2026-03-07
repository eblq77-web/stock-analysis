const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/liu/Desktop/Stock_Analysis/paper_trading';
const LOG_FILE = path.join(BASE_DIR, 'paper_trading_log.json');
const SIGNALS_FILE = path.join(BASE_DIR, 'trading_signals.json');
const PORT = 3899;

function getData() {
    try {
        const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
        return { success: true, log, signals };
    } catch(e) {
        return { success: false, error: e.message };
    }
}

function executeBuy(code, name, price, shares, sector, score) {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const cost = price * shares;
    if (cost > log.capital) return { success: false, error: 'Insufficient capital' };
    
    log.positions.push({ code, name, entryPrice: price, shares, entryDate: new Date().toISOString().split('T')[0], sector, score });
    log.capital -= cost;
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
    return { success: true };
}

function executeSell(code, exitPrice) {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const idx = log.positions.findIndex(p => p.code === code);
    if (idx === -1) return { success: false, error: 'Position not found' };
    
    const p = log.positions[idx];
    const pnl = (exitPrice - p.entryPrice) * p.shares;
    const pnlPct = (exitPrice - p.entryPrice) / p.entryPrice * 100;
    
    log.closedTrades.push({
        code: p.code, name: p.name, entryPrice: p.entryPrice, exitPrice,
        shares: p.shares, entryDate: p.entryDate, exitDate: new Date().toISOString().split('T')[0],
        pnl, pnlPct, reason: 'MANUAL_SELL',
        holdingDays: Math.floor((new Date() - new Date(p.entryDate)) / (1000*60*60*24))
    });
    
    log.capital += exitPrice * p.shares;
    log.positions.splice(idx, 1);
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
    return { success: true, pnl, pnlPct };
}

const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Paper Trading</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: #fff; padding: 20px; }
        h1 { text-align: center; }
        .stats { display: flex; gap: 20px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
        .stat { background: #16213e; padding: 20px; border-radius: 10px; min-width: 150px; text-align: center; }
        .stat h3 { color: #888; margin: 0 0 10px 0; font-size: 14px; }
        .stat .val { font-size: 24px; font-weight: bold; }
        .green { color: #00ff88; }
        .red { color: #ff4757; }
        
        .section { margin: 30px 0; }
        .section h2 { border-bottom: 1px solid #333; padding-bottom: 10px; }
        
        .positions { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
        .pos-card { background: #16213e; padding: 15px; border-radius: 10px; border-left: 4px solid #667eea; }
        .pos-card.profit { border-left-color: #00ff88; }
        .pos-card.loss { border-left-color: #ff4757; }
        .pos-header { display: flex; justify-content: space-between; align-items: center; }
        .pos-code { font-size: 18px; font-weight: bold; }
        .pos-name { color: #888; font-size: 14px; }
        .pos-pnl { font-size: 20px; font-weight: bold; }
        .pos-info { margin: 10px 0; font-size: 14px; color: #aaa; }
        .pos-info span { color: #fff; }
        
        button { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; }
        button.buy { background: #00c853; }
        button.sell { background: #ff1744; }
        button:hover { opacity: 0.8; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #333; }
        th { color: #888; }
        
        .error { background: #ff4757; padding: 10px; border-radius: 5px; margin: 10px 0; display: none; }
        .error.show { display: block; }
        
        .top-bar { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        
        .btn-new { background: #00c853; }
    </style>
</head>
<body>
    <h1>📈 Paper Trading Dashboard</h1>
    
    <div class="top-bar">
        <button onclick="loadData()">🔄 Refresh</button>
        <button class="btn-new" onclick="document.getElementById('newOrder').style.display='block'">➕ New Order</button>
    </div>
    
    <div id="error" class="error"></div>
    
    <div class="stats">
        <div class="stat"><h3>💰 Capital</h3><div class="val" id="capital">-</div></div>
        <div class="stat"><h3>📊 Positions</h3><div class="val" id="positions">-</div></div>
        <div class="stat"><h3>✅ Closed</h3><div class="val" id="closed">-</div></div>
        <div class="stat"><h3>🎯 P&L</h3><div class="val" id="pnl">-</div></div>
    </div>
    
    <div class="section" id="newOrder" style="display:none; background:#16213e; padding:20px; border-radius:10px;">
        <h3>➕ New Buy Order</h3>
        <input type="text" id="buyCode" placeholder="Stock Code" style="padding:10px; margin:5px;">
        <input type="text" id="buyName" placeholder="Name" style="padding:10px; margin:5px;">
        <input type="number" id="buyPrice" placeholder="Price" style="padding:10px; margin:5px;">
        <input type="number" id="buyShares" placeholder="Shares" style="padding:10px; margin:5px;">
        <button class="buy" onclick="submitBuy()">Buy</button>
        <button onclick="document.getElementById('newOrder').style.display='none'">Cancel</button>
    </div>
    
    <div class="section">
        <h2>📋 Open Positions</h2>
        <div class="positions" id="positionsList"></div>
    </div>
    
    <div class="section">
        <h2>🟢 Buy Signals</h2>
        <table>
            <thead><tr><th>Code</th><th>Name</th><th>Sector</th><th>Score</th><th>Action</th></tr></thead>
            <tbody id="buyList"></tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>📜 Trade History</h2>
        <table>
            <thead><tr><th>Date</th><th>Code</th><th>Name</th><th>Entry</th><th>Exit</th><th>P&L</th><th>%</th></tr></thead>
            <tbody id="historyList"></tbody>
        </table>
    </div>
    
    <script>
    let data = null;
    
    function showError(msg) {
        const el = document.getElementById('error');
        el.textContent = msg;
        el.classList.add('show');
    }
    
    async function loadData() {
        try {
            const res = await fetch('/api/data');
            data = await res.json();
            
            if (!data.success) {
                showError(data.error);
                return;
            }
            
            document.getElementById('error').classList.remove('show');
            render();
        } catch(e) {
            showError('Error: ' + e.message);
        }
    }
    
    function render() {
        const log = data.log;
        const sig = data.signals;
        
        document.getElementById('capital').textContent = '¥' + Math.round(log.capital).toLocaleString();
        document.getElementById('positions').textContent = log.positions.length;
        document.getElementById('closed').textContent = log.closedTrades.length;
        
        const closedPnl = log.closedTrades.reduce((s, t) => s + t.pnl, 0);
        const pnlEl = document.getElementById('pnl');
        pnlEl.textContent = '¥' + Math.round(closedPnl).toLocaleString();
        pnlEl.className = 'val ' + (closedPnl >= 0 ? 'green' : 'red');
        
        // Positions
        document.getElementById('positionsList').innerHTML = log.positions.map(p => {
            const pnl = ((p.currentPrice || p.entryPrice) - p.entryPrice) / p.entryPrice * 100;
            const cls = pnl >= 0 ? 'profit' : 'loss';
            const color = pnl >= 0 ? '#00ff88' : '#ff4757';
            return '<div class="pos-card ' + cls + '">' +
                '<div class="pos-header">' +
                    '<div><div class="pos-code">' + p.code + '</div><div class="pos-name">' + p.name + '</div></div>' +
                    '<div class="pos-pnl" style="color:' + color + '">' + (pnl>=0?'+':'') + pnl.toFixed(2) + '%</div>' +
                '</div>' +
                '<div class="pos-info">' +
                    'Entry: <span>¥' + p.entryPrice.toFixed(2) + '</span> | ' +
                    'Shares: <span>' + p.shares + '</span> | ' +
                    'Value: <span>¥' + Math.round(p.entryPrice*p.shares).toLocaleString() + '</span>' +
                '</div>' +
                '<button class="sell" onclick="sell(\'' + p.code + '\', ' + p.entryPrice + ')">🔴 SELL</button>' +
            '</div>';
        }).join('') || '<p style="color:#666">No positions</p>';
        
        // Buy signals
        document.getElementById('buyList').innerHTML = sig.buy.slice(0,10).map(s => 
            '<tr><td><b>' + s.code + '</b></td><td>' + s.name + '</td><td>' + s.sector + '</td><td>' + s.score + '</td><td><button class="buy" onclick="quickBuy(\'' + s.code + '\', \'' + s.name + '\', ' + (s.currentPrice||0) + ', \'' + s.sector + '\', ' + s.score + ')">🟢 BUY</button></td></tr>'
        ).join('');
        
        // History
        document.getElementById('historyList').innerHTML = log.closedTrades.slice(-10).reverse().map(t => 
            '<tr><td>' + t.exitDate + '</td><td><b>' + t.code + '</b></td><td>' + t.name + '</td><td>¥' + t.entryPrice.toFixed(2) + '</td><td>¥' + t.exitPrice.toFixed(2) + '</td><td class="' + (t.pnl>=0?'green':'red') + '">¥' + Math.round(t.pnl).toLocaleString() + '</td><td class="' + (t.pnlPct>=0?'green':'red') + '">' + (t.pnlPct>=0?'+':'') + t.pnlPct.toFixed(2) + '%</td></tr>'
        ).join('') || '<tr><td colspan="7" style="text-align:center;color:#666">No trades yet</td></tr>';
    }
    
    async function submitBuy() {
        const code = document.getElementById('buyCode').value;
        const name = document.getElementById('buyName').value;
        const price = parseFloat(document.getElementById('buyPrice').value);
        const shares = parseInt(document.getElementById('buyShares').value);
        
        if (!code || !price || !shares) {
            showError('Please fill all fields');
            return;
        }
        
        try {
            const res = await fetch('/api/buy', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({code, name, price, shares, sector: 'N/A', score: 75})
            });
            const result = await res.json();
            if (result.success) {
                document.getElementById('newOrder').style.display = 'none';
                loadData();
            } else {
                showError(result.error);
            }
        } catch(e) {
            showError(e.message);
        }
    }
    
    async function quickBuy(code, name, price, sector, score) {
        const maxShares = Math.floor(data.log.capital * 0.2 / price);
        const shares = Math.floor(maxShares / 100) * 100;
        
        if (shares < 100) {
            showError('Insufficient capital');
            return;
        }
        
        try {
            const res = await fetch('/api/buy', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({code, name, price, shares, sector, score})
            });
            const result = await res.json();
            if (result.success) {
                loadData();
            } else {
                showError(result.error);
            }
        } catch(e) {
            showError(e.message);
        }
    }
    
    async function sell(code, price) {
        const confirmSell = confirm('Sell ' + code + ' at ¥' + price + '?');
        if (!confirmSell) return;
        
        try {
            const res = await fetch('/api/sell', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({code, exitPrice: price})
            });
            const result = await res.json();
            if (result.success) {
                alert('Sold! P&L: ¥' + Math.round(result.pnl).toLocaleString());
                loadData();
            } else {
                showError(result.error);
            }
        } catch(e) {
            showError(e.message);
        }
    }
    
    loadData();
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.end('');
        return;
    }
    
    if (req.url === '/api/data') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(getData()));
    }
    else if (req.url === '/api/buy' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const result = executeBuy(data.code, data.name, data.price, data.shares, data.sector, data.score);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        });
    }
    else if (req.url === '/api/sell' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const result = executeSell(data.code, data.exitPrice);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        });
    }
    else {
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
    }
});

server.listen(PORT, () => {
    console.log('Paper Trading: http://localhost:' + PORT);
});
