/**
 * Live Trading API Server v2 - Super Brain Real-Time Execution
 * Port: 3898
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 3898;
const DATA_FILE = '/Users/liu/Desktop/Stock_Analysis/live_trading/live_positions.json';
const HK_STOCKS = ['0700','9988','3690','9618','9888','1024','1810','2282','0005','0939','3988','0941','0001','0011','6823','1177','0185','0669'];

// Initialize
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ capital: 100000, positions: [], orders: [] }));
}

function getData() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function fetchPrice(code) {
  return new Promise(resolve => {
    let prefix, c = code;
    // Check if it's a known HK stock
    if (HK_STOCKS.includes(code)) {
      prefix = 'hk';
      c = '0' + code; // 0700 -> 00700 (5 digits)
    } else if (code.startsWith('0') || code.startsWith('3')) {
      prefix = 'sz';
    } else {
      prefix = 'sh';
    }
    const url = `https://qt.gtimg.cn/q=${prefix}${c}`;
    https.get(url, r => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => {
        try {
          // For HK stocks: v_hk00700="100~name~code~price..."
          // For A stocks: v_pv_none_match="0~name~code~price..."
          let price = 0, change = 0;
          
          if (data.includes('v_hk')) {
            // HK format: v_hk00700="100~name~00700~502.000~..."
            const parts = data.split('~');
            price = parseFloat(parts[3]) || 0;
            change = parseFloat(parts[4]) || 0;
          } else {
            // A-share format
            const m = data.match(/\"([^\"]+)\"/);
            if (m) {
              const parts = m[1].split('~');
              price = parseFloat(parts[3]) || 0;
              change = parseFloat(parts[4]) || 0;
            }
          }
          
          resolve({ price, change: isNaN(change) ? 0 : change });
        } catch(e) { resolve({ price: 0, change: 0 }); }
      });
    }).on('error', () => resolve({ price: 0, change: 0 }));
  });
}

async function handle(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const [url, q] = req.url.split('?');
  const method = req.method;

  const getParams = () => Object.fromEntries((q||'').split('&').filter(x=>x).map(x=>x.split('=')));
  const params = getParams();

  // GET /status - portfolio
  if (url === '/api/status' && method === 'GET') {
    const data = getData();
    for (let p of data.positions) {
      const live = await fetchPrice(p.code);
      p.currentPrice = live.price;
      p.change = live.change;
      p.pnl = (live.price - p.entryPrice) * p.shares;
      p.pnlPct = ((live.price - p.entryPrice) / p.entryPrice * 100).toFixed(2);
    }
    saveData(data);
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  // GET /api/paper - read from paper_trading_log.json
  if (url === '/api/paper' && method === 'GET') {
    const PAPER_FILE = '/Users/liu/Desktop/Stock_Analysis/paper_trading/paper_trading_log.json';
    try {
      const paperData = JSON.parse(fs.readFileSync(PAPER_FILE, 'utf8'));
      const positions = (paperData.positions || []).map(p => ({
        code: p.code,
        name: p.name,
        entryPrice: p.entryPrice,
        shares: p.shares,
        entryDate: p.entryDate,
        sector: p.sector,
        period: p.period,
        score: p.score,
        currentPrice: p.entryPrice,
        change: 0,
        pnl: 0,
        pnlPct: 0
      }));

      // Fetch live prices for all positions
      for (let p of positions) {
        const code6 = String(p.code).padStart(6, '0');
        // Don't pad HK codes (they use 4-5 digits like 0700, 00700)
        const isHKStock = HK_STOCKS.includes(String(p.code));
        const fetchCode = isHKStock ? String(p.code) : code6;
        try {
          const live = await fetchPrice(fetchCode);
          if (live.price > 0) {
            p.currentPrice = live.price;
            p.change = live.change;
            p.pnl = (live.price - p.entryPrice) * p.shares;
            p.pnlPct = p.entryPrice > 0 ? ((live.price - p.entryPrice) / p.entryPrice * 100).toFixed(2) : 0;
          }
        } catch(e) { /* skip */ }
      }

      const closedPnL = (paperData.closedTrades || []).reduce((s, t) => s + (t.pnl || 0), 0);
      res.end(JSON.stringify({
        success: true,
        data: {
          capital: paperData.capital || 126034,
          positions,
          closedTrades: paperData.closedTrades || [],
          closedPnL,
          totalPnL: closedPnL + positions.reduce((s, p) => s + (p.pnl || 0), 0)
        }
      }));
    } catch(e) {
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // POST /buy
  if (url === '/api/buy' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      const { code, name, shares } = JSON.parse(body);
      const live = await fetchPrice(code);
      const data = getData();
      const cost = live.price * shares;
      
      if (!live.price || cost > data.capital) {
        res.end(JSON.stringify({ success: false, error: !live.price ? 'Price unavailable' : 'Insufficient capital' }));
        return;
      }
      
      data.capital -= cost;
      data.positions.push({ code, name, entryPrice: live.price, shares, entryDate: new Date().toISOString().split('T')[0], currentPrice: live.price, change: live.change, pnl: 0, pnlPct: 0 });
      data.orders.push({ type: 'BUY', code, name, price: live.price, shares, time: new Date().toISOString() });
      saveData(data);
      res.end(JSON.stringify({ success: true, order: { code, name, price: live.price, shares } }));
    });
    return;
  }

  // POST /sell
  if (url === '/api/sell' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      const { code, shares } = JSON.parse(body);
      const data = getData();
      const idx = data.positions.findIndex(p => p.code === code);
      if (idx === -1) { res.end(JSON.stringify({ success: false, error: 'Not found' })); return; }
      
      const live = await fetchPrice(code);
      const pos = data.positions[idx];
      const sellShares = shares || pos.shares;
      const proceeds = live.price * sellShares;
      
      data.capital += proceeds;
      if (sellShares >= pos.shares) data.positions.splice(idx, 1);
      else pos.shares -= sellShares;
      
      data.orders.push({ type: 'SELL', code, name: pos.name, price: live.price, shares: sellShares, time: new Date().toISOString() });
      saveData(data);
      res.end(JSON.stringify({ success: true, proceeds, pnl: (live.price - pos.entryPrice) * sellShares }));
    });
    return;
  }

  // GET /price/:code
  if (url.startsWith('/api/price/')) {
    const code = url.split('/')[3];
    const live = await fetchPrice(code);
    res.end(JSON.stringify({ success: true, price: live }));
    return;
  }

  res.end(JSON.stringify({ endpoints: ['/api/status','/api/buy','/api/sell','/api/price/:code'] }));
}

http.createServer(handle).listen(PORT, () => console.log(`🚀 Live API: http://localhost:${PORT}`));
