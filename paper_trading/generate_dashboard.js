const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/liu/Desktop/Stock_Analysis/paper_trading';
const LOG_FILE = path.join(BASE_DIR, 'paper_trading_log.json');
const SIGNALS_FILE = path.join(BASE_DIR, 'trading_signals.json');

function generateDashboard() {
    const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
    
    const totalInvested = log.positions.reduce((s, p) => s + (p.entryPrice * p.shares), 0);
    const closedPnl = log.closedTrades.reduce((s, t) => s + t.pnl, 0);
    const returnPct = ((closedPnl / 1000000) * 100).toFixed(2);
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📈 Paper Trading Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: #fff; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 30px; font-size: 2rem; }
        h1 span { font-size: 2.5rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .card h3 { color: #aaa; font-size: 0.9rem; margin-bottom: 10px; }
        .card .value { font-size: 1.8rem; font-weight: bold; }
        .card .value.green { color: #00ff88; }
        .card .value.red { color: #ff4757; }
        .section { margin-bottom: 30px; }
        .section h2 { background: linear-gradient(90deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
        th, td { padding: 12px 15px; text-align: left; }
        th { background: rgba(255,255,255,0.1); font-weight: 600; color: #aaa; }
        tr { border-bottom: 1px solid rgba(255,255,255,0.05); }
        tr:hover { background: rgba(255,255,255,0.05); }
        .positive { color: #00ff88; }
        .negative { color: #ff4757; }
        .tag { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; background: rgba(255,255,255,0.1); margin-right: 5px; }
        .tag.high { background: rgba(0,255,136,0.2); color: #00ff88; }
        .positions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; }
        .position-card { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; border-left: 4px solid #667eea; }
        .position-card.profit { border-left-color: #00ff88; }
        .position-card.loss { border-left-color: #ff4757; }
        .position-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .position-card .code { font-weight: bold; font-size: 1.1rem; }
        .position-card .name { color: #aaa; font-size: 0.9rem; }
        .position-card .details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; }
        .position-card .detail span { color: #aaa; }
        .position-card .pnl { font-size: 1.3rem; font-weight: bold; }
        .btn { background: linear-gradient(135deg, #667eea, #764ba2); border: none; padding: 12px 25px; border-radius: 8px; color: white; cursor: pointer; font-size: 1rem; margin: 10px 5px; }
        .btn:hover { opacity: 0.9; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span>📈</span> Paper Trading Dashboard</h1>
        
        <div class="summary">
            <div class="card"><h3>💰 Capital</h3><div class="value">¥${log.capital.toLocaleString()}</div></div>
            <div class="card"><h3>📊 Open Positions</h3><div class="value">${log.positions.length}</div></div>
            <div class="card"><h3>✅ Closed Trades</h3><div class="value">${log.closedTrades.length}</div></div>
            <div class="card"><h3>🎯 Total P&L</h3><div class="value ${closedPnl >= 0 ? 'green' : 'red'}">¥${closedPnl.toLocaleString()}</div></div>
            <div class="card"><h3>📈 Return %</h3><div class="value ${returnPct >= 0 ? 'green' : 'red'}">${returnPct}%</div></div>
        </div>
        
        <div class="section">
            <h2>📋 Open Positions</h2>
            <div class="positions-grid">
${log.positions.map(p => {
    const pnl = ((p.currentPrice || p.entryPrice) - p.entryPrice) / p.entryPrice * 100;
    const pnlClass = pnl >= 0 ? 'profit' : 'loss';
    const pnlColor = pnl >= 0 ? '#00ff88' : '#ff4757';
    return `                <div class="position-card ${pnlClass}">
                    <div class="header">
                        <div><div class="code">${p.code}</div><div class="name">${p.name}</div></div>
                        <div class="pnl" style="color:${pnlColor}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</div>
                    </div>
                    <div class="details">
                        <div class="detail"><span>Entry:</span> ¥${p.entryPrice.toFixed(2)}</div>
                        <div class="detail"><span>Shares:</span> ${p.shares}</div>
                        <div class="detail"><span>Sector:</span> ${p.sector}</div>
                        <div class="detail"><span>Score:</span> ${p.score}</div>
                        <div class="detail"><span>Value:</span> ¥${(p.entryPrice * p.shares).toLocaleString()}</div>
                        <div class="detail"><span>Date:</span> ${p.entryDate}</div>
                    </div>
                </div>`;
}).join('\n')}
            </div>
        </div>
        
        <div class="section">
            <h2>🟢 Buy Signals (${signals.buy.length})</h2>
            <table>
                <thead><tr><th>Code</th><th>Name</th><th>Sector</th><th>Score</th><th>Price</th><th>Reason</th></tr></thead>
                <tbody>
${signals.buy.map(s => `                    <tr><td><b>${s.code}</b></td><td>${s.name}</td><td>${s.sector}</td><td><span class="tag high">${s.score}</span></td><td>¥${s.currentPrice?.toFixed(2) || 'N/A'}</td><td>${s.reason}</td></tr>`).join('\n')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>👀 Watch List (${signals.watch.length})</h2>
            <table>
                <thead><tr><th>Code</th><th>Name</th><th>Entry</th><th>Current</th><th>P&L</th><th>Status</th></tr></thead>
                <tbody>
${signals.watch.map(s => {
    const pnlClass = s.pnl >= 0 ? 'positive' : 'negative';
    return `                    <tr><td><b>${s.code}</b></td><td>${s.name}</td><td>¥${s.entryPrice?.toFixed(2) || 'N/A'}</td><td>¥${s.currentPrice?.toFixed(2) || 'N/A'}</td><td class="${pnlClass}">${s.pnl >= 0 ? '+' : ''}${s.pnl?.toFixed(2) || '0'}%</td><td><span class="tag">${s.status}</span></td></tr>`;
}).join('\n')}
                </tbody>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn" onclick="location.reload()">🔄 Refresh</button>
        </div>
        
        <div class="timestamp">Last updated: ${new Date().toLocaleString()}</div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(BASE_DIR, 'dashboard.html'), html);
    console.log('✅ Dashboard generated!');
}

generateDashboard();
