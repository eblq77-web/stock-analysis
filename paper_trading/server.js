/**
 * Paper Trading Dashboard Server
 * Interactive buy/sell interface
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/liu/Desktop/Stock_Analysis/paper_trading';
const LOG_FILE = path.join(BASE_DIR, 'paper_trading_log.json');
const SIGNALS_FILE = path.join(BASE_DIR, 'trading_signals.json');
const PORT = 3899;

function getData() {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
    return { log, signals };
}

function saveData(log) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function executeBuy(code, name, price, shares, sector, score) {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const cost = price * shares;
    
    if (cost > log.capital) {
        return { success: false, error: 'Insufficient capital' };
    }
    
    log.positions.push({
        code, name, entryPrice: price, shares,
        entryDate: new Date().toISOString().split('T')[0],
        sector, score
    });
    log.capital -= cost;
    saveData(log);
    return { success: true };
}

function executeSell(code, exitPrice) {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const idx = log.positions.findIndex(p => p.code === code);
    
    if (idx === -1) {
        return { success: false, error: 'Position not found' };
    }
    
    const p = log.positions[idx];
    const pnl = (exitPrice - p.entryPrice) * p.shares;
    const pnlPct = (exitPrice - p.entryPrice) / p.entryPrice * 100;
    
    log.closedTrades.push({
        code: p.code, name: p.name, entryPrice: p.entryPrice, exitPrice,
        shares: p.shares, entryDate: p.entryDate,
        exitDate: new Date().toISOString().split('T')[0],
        pnl, pnlPct, reason: 'MANUAL_SELL',
        holdingDays: Math.floor((new Date() - new Date(p.entryDate)) / (1000*60*60*24))
    });
    
    log.capital += exitPrice * p.shares;
    log.positions.splice(idx, 1);
    saveData(log);
    return { success: true, pnl, pnlPct };
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📈 Paper Trading Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: #fff; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 20px; font-size: 1.8rem; }
        h1 span { font-size: 2.2rem; }
        
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .btn { background: linear-gradient(135deg, #667eea, #764ba2); border: none; padding: 10px 20px; border-radius: 8px; color: white; cursor: pointer; font-size: 0.9rem; }
        .btn:hover { opacity: 0.9; }
        .btn-buy { background: linear-gradient(135deg, #00c853, #00e676); }
        .btn-sell { background: linear-gradient(135deg, #ff1744, #ff5252); }
        
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 25px; }
        .card { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; }
        .card h3 { color: #aaa; font-size: 0.8rem; margin-bottom: 8px; }
        .card .value { font-size: 1.4rem; font-weight: bold; }
        .card .value.green { color: #00ff88; }
        .card .value.red { color: #ff4757; }
        
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 1.2rem; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        
        .trade-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .trade-card { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 15px; border-left: 4px solid #667eea; }
        .trade-card.profit { border-left-color: #00ff88; }
        .trade-card.loss { border-left-color: #ff4757; }
        
        .trade-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .trade-card .code { font-weight: bold; font-size: 1.1rem; }
        .trade-card .name { color: #aaa; font-size: 0.85rem; }
        .trade-card .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; margin-bottom: 12px; }
        .trade-card .info span { color: #aaa; }
        .trade-card .pnl { font-size: 1.2rem; font-weight: bold; }
        
        .trade-card .actions { display: flex; gap: 8px; }
        .trade-card .actions button { flex: 1; padding: 8px; font-size: 0.85rem; }
        
        table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.05); border-radius: 10px; }
        th, td { padding: 10px 12px; text-align: left; font-size: 0.85rem; }
        th { background: rgba(255,255,255,0.1); font-weight: 600; color: #aaa; }
        tr { border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        .positive { color: #00ff88; }
        .negative { color: #ff4757; }
        .tag { padding: 3px 8px; border-radius: 15px; font-size: 0.7rem; background: rgba(255,255,255,0.1); }
        .tag.high { background: rgba(0,255,136,0.2); color: #00ff88; }
        
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; }
        .modal.active { display: flex; }
        .modal-content { background: #1a1a2e; padding: 25px; border-radius: 15px; width: 90%; max-width: 400px; }
        .modal-content h3 { margin-bottom: 20px; }
        .modal-content input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #333; background: #0f0f1a; color: #fff; }
        .modal-content .btn-group { display: flex; gap: 10px; }
        .modal-content .btn-group button { flex: 1; }
        
        .timestamp { text-align: center; color: #666; margin-top: 20px; font-size: 0.75rem; }
        
        .alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none; }
        .alert.success { background: rgba(0,255,136,0.2); color: #00ff88; display: block; }
        .alert.error { background: rgba(255,23,68,0.2); color: #ff4757; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span>📈</span> Paper Trading Dashboard</h1>
        
        <div class="top-bar">
            <button class="btn" onclick="loadData()">🔄 Refresh</button>
            <button class="btn" onclick="showModal('buy')">➕ New Buy Order</button>
        </div>
        
        <div class="alert" id="alert"></div>
        
        <div class="summary">
            <div class="card"><h3>💰 Available Capital</h3><div class="value" id="capital">¥0</div></div>
            <div class="card"><h3>📊 Open Positions</h3><div class="value" id="positions">0</div></div>
            <div class="card"><h3>✅ Closed Trades</h3><div class="value" id="closed">0</div></div>
            <div class="card"><h3>📈 Total Invested</h3><div class="value" id="invested">¥0</div></div>
            <div class="card"><h3>🎯 Total P&L</h3><div class="value" id="totalPnl">¥0</div></div>
        </div>
        
        <div class="section">
            <h2>📋 Open Positions (Click SELL to close)</h2>
            <div class="trade-grid" id="positionsGrid"></div>
        </div>
        
        <div class="section">
            <h2>🟢 Buy Signals (Click BUY to open)</h2>
            <table>
                <thead><tr><th>Code</th><th>Name</th><th>Sector</th><th>Score</th><th>Est. Price</th><th>Action</th></tr></thead>
                <tbody id="buyTable"></tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>📜 Trade History</h2>
            <table>
                <thead><tr><th>Date</th><th>Code</th><th>Name</th><th>Entry</th><th>Exit</th><th>P&L</th><th>P&L%</th></th></tr></thead>
                <tbody id="historyTable"></tbody>
<th>Days            </table>
        </div>
        
        <div class="timestamp" id="timestamp"></div>
    </div>
    
    <!-- Buy Modal -->
    <div class="modal" id="buyModal">
        <div class="modal-content">
            <h3>➕ New Buy Order</h3>
            <input type="text" id="buyCode" placeholder="Stock Code (e.g., 300122)">
            <input type="text" id="buyName" placeholder="Stock Name">
            <input type="number" id="buyPrice" placeholder="Price">
            <input type="number" id="buyShares" placeholder="Shares">
            <input type="text" id="buySector" placeholder="Sector">
            <div class="btn-group">
                <button class="btn btn-buy" onclick="submitBuy()">Buy</button>
                <button class="btn" onclick="closeModal('buy')">Cancel</button>
            </div>
        </div>
    </div>
    
    <!-- Sell Modal -->
    <div class="modal" id="sellModal">
        <div class="modal-content">
            <h3>🔴 Close Position</h3>
            <input type="hidden" id="sellCode">
            <p id="sellInfo" style="margin-bottom: 15px; color: #aaa;"></p>
            <input type="number" id="sellPrice" placeholder="Sell Price">
            <div class="btn-group">
                <button class="btn btn-sell" onclick="submitSell()">Confirm Sell</button>
                <button class="btn" onclick="closeModal('sell')">Cancel</button>
            </div>
        </div>
    </div>
    
    <script>
        let currentData = {};
        
        async function loadData() {
            try {
                const res = await fetch('/api/data');
                currentData = await res.json();
                render();
            } catch(e) {
                showAlert('Error loading data', 'error');
            }
        }
        
        function render() {
            const log = currentData.log;
            const signals = currentData.signals;
            
            document.getElementById('capital').textContent = '¥' + Math.round(log.capital).toLocaleString();
            document.getElementById('positions').textContent = log.positions.length;
            document.getElementById('closed').textContent = log.closedTrades.length;
            
            const invested = log.positions.reduce((s, p) => s + (p.entryPrice * p.shares), 0);
            document.getElementById('invested').textContent = '¥' + Math.round(invested).toLocaleString();
            
            const closedPnl = log.closedTrades.reduce((s, t) => s + t.pnl, 0);
            document.getElementById('totalPnl').textContent = '¥' + Math.round(closedPnl).toLocaleString();
            document.getElementById('totalPnl').className = 'value ' + (closedPnl >= 0 ? 'green' : 'red');
            
            // Positions Grid
            document.getElementById('positionsGrid').innerHTML = log.positions.map(p => {
                const pnl = ((p.currentPrice || p.entryPrice) - p.entryPrice) / p.entryPrice * 100;
                const pnlClass = pnl >= 0 ? 'profit' : 'loss';
                const pnlColor = pnl >= 0 ? '#00ff88' : '#ff4757';
                return '<div class="trade-card ' + pnlClass + '">' +
                    '<div class="header">' +
                        '<div><div class="code">' + p.code + '</div><div class="name">' + p.name + '</div></div>' +
                        '<div class="pnl" style="color:' + pnlColor + '">' + (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%</div>' +
                    '</div>' +
                    '<div class="info">' +
                        '<div><span>Entry:</span> ¥' + p.entryPrice.toFixed(2) + '</div>' +
                        '<div><span>Shares:</span> ' + p.shares + '</div>' +
                        '<div><span>Value:</span> ¥' + Math.round(p.entryPrice * p.shares).toLocaleString() + '</div>' +
                        '<div><span>Score:</span> ' + p.score + '</div>' +
                    '</div>' +
                    '<div class="actions">' +
                        '<button class="btn btn-sell" onclick="openSell(\'' + p.code + '\', ' + p.entryPrice + ', ' + p.shares + ', \'' + p.name + '\')">🔴 SELL</button>' +
                    '</div>' +
                '</div>';
            }).join('') || '<p style="color:#666;">No open positions</p>';
            
            // Buy Signals
            document.getElementById('buyTable').innerHTML = signals.buy.slice(0, 10).map(s => 
                '<tr><td><b>' + s.code + '</b></td><td>' + s.name + '</td><td>' + s.sector + '</td><td><span class="tag high">' + s.score + '</span></td><td>¥' + (s.currentPrice ? s.currentPrice.toFixed(2) : 'N/A') + '</td><td><button class="btn btn-buy" style="padding:5px 15px;font-size:0.8rem" onclick="quickBuy(\'' + s.code + '\', \'' + s.name + '\', ' + (s.currentPrice || 0) + ', \'' + s.sector + '\', ' + s.score + ')">🟢 BUY</button></td></tr>'
            ).join('');
            
            // History
            document.getElementById('historyTable').innerHTML = log.closedTrades.slice(-10).reverse().map(t => 
                '<tr><td>' + t.exitDate + '</td><td><b>' + t.code + '</b></td><td>' + t.name + '</td><td>¥' + t.entryPrice.toFixed(2) + '</td><td>¥' + t.exitPrice.toFixed(2) + '</td><td class="' + (t.pnl >= 0 ? 'positive' : 'negative') + '">¥' + Math.round(t.pnl).toLocaleString() + '</td><td class="' + (t.pnlPct >= 0 ? 'positive' : 'negative') + '">' + (t.pnlPct >= 0 ? '+' : '') + t.pnlPct.toFixed(2) + '%</td><td>' + t.holdingDays + 'd</td></tr>'
            ).join('') || '<tr><td colspan="8" style="text-align:center;color:#666">No closed trades</td></tr>';
            
            document.getElementById('timestamp').textContent = 'Last updated: ' + new Date().toLocaleString();
        }
        
        function showModal(type) {
            document.getElementById(type + 'Modal').classList.add('active');
        }
        
        function closeModal(type) {
            document.getElementById(type + 'Modal').classList.remove('active');
        }
        
        async function submitBuy() {
            const code = document.getElementById('buyCode').value;
            const name = document.getElementById('buyName').value;
            const price = parseFloat(document.getElementById('buyPrice').value);
            const shares = parseInt(document.getElementById('buyShares').value);
            const sector = document.getElementById('buySector').value || 'N/A';
            
            if (!code || !price || !shares) {
                showAlert('Please fill all fields', 'error');
                return;
            }
            
            try {
                const res = await fetch('/api/buy', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, name, price, shares, sector, score: 75})
                });
                const result = await res.json();
                if (result.success) {
                    showAlert('Buy order executed!', 'success');
                    closeModal('buy');
                    loadData();
                } else {
                    showAlert(result.error, 'error');
                }
            } catch(e) {
                showAlert('Error: ' + e.message, 'error');
            }
        }
        
        function openSell(code, price, shares, name) {
            document.getElementById('sellCode').value = code;
            document.getElementById('sellPrice').value = price.toFixed(2);
            document.getElementById('sellInfo').innerHTML = '<b>' + code + '</b> ' + name + '<br>Current: ¥' + price.toFixed(2) + ' x ' + shares + ' = ¥' + Math.round(price*shares).toLocaleString();
            showModal('sell');
        }
        
        async function submitSell() {
            const code = document.getElementById('sellCode').value;
            const price = parseFloat(document.getElementById('sellPrice').value);
            
            try {
                const res = await fetch('/api/sell', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code, exitPrice: price})
                });
                const result = await res.json();
                if (result.success) {
                    showAlert('Sold! P&L: ¥' + Math.round(result.pnl).toLocaleString() + ' (' + (result.pnlPct >= 0 ? '+' : '') + result.pnlPct.toFixed(2) + '%)', 'success');
                    closeModal('sell');
                    loadData();
                } else {
                    showAlert(result.error, 'error');
                }
            } catch(e) {
                showAlert('Error: ' + e.message, 'error');
            }
        }
        
        async function quickBuy(code, name, price, sector, score) {
            const maxShares = Math.floor(currentData.log.capital * 0.2 / price);
            const shares = Math.floor(maxShares / 100) * 100;
            
            if (shares < 100) {
                showAlert('Insufficient capital', 'error');
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
                    showAlert('Bought ' + code + '! ' + shares + ' shares @ ¥' + price, 'success');
                    loadData();
                } else {
                    showAlert(result.error, 'error');
                }
            } catch(e) {
                showAlert('Error: ' + e.message, 'error');
            }
        }
        
        function showAlert(msg, type) {
            const el = document.getElementById('alert');
            el.textContent = msg;
            el.className = 'alert ' + type;
            setTimeout(() => el.className = 'alert', 3000);
        }
        
        loadData();
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
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
    console.log('Paper Trading Dashboard: http://localhost:' + PORT);
});
