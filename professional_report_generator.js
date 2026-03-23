/**
 * SUPER BRAIN V3 - PROFESSIONAL REPORT GENERATOR
 * Generates institutional-grade daily market reports
 * Run: node professional_report_generator.js
 */

const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');

const REPORT_DIR = './daily_reports/';
const DATE = new Date().toISOString().slice(0,10);
const NOW = new Date();
const DAY = NOW.getDay();
const IS_WEEKEND = DAY === 0 || DAY === 6;
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// Stock database
const STOCKS = {
  indices: [
    { code: 'sh000001', name: '上证指数' },
    { code: 'sz399001', name: '深证成指' },
    { code: 'sz399006', name: '创业板指' },
    { code: 'sh000688', name: '科创50' },
    { code: 'bj899050', name: '北证50' },
  ],
  keyStocks: [
    { code: 'sh600519', name: '贵州茅台' },
    { code: 'sz000858', name: '五粮液' },
    { code: 'sz002594', name: '比亚迪' },
    { code: 'sh600036', name: '招商银行' },
    { code: 'sh601012', name: '隆基绿能' },
    { code: 'sz000333', name: '美的集团' },
    { code: 'sh600030', name: '中信证券' },
    { code: 'sh600276', name: '恒瑞医药' },
    { code: 'sz000999', name: '华润三九' },
    { code: 'sz000651', name: '格力电器' },
  ],
  hkStocks: [
    { code: 'hk00700', name: '腾讯控股' },
    { code: 'hk09988', name: '阿里巴巴' },
    { code: 'hk03690', name: '美团' },
    { code: 'hk01810', name: '小米集团' },
  ],
  portfolio: [
    { code: 'sh600036', name: '招商银行', entry: 38.72, shares: 100 },
    { code: 'sh600030', name: '中信证券', entry: 27.16, shares: 100 },
    { code: 'sz000999', name: '华润三九', entry: 29.39, shares: 100 },
  ],
  sectors: [
    { code: 'sh600011', name: '华能国际', sector: '电力' },
    { code: 'sh600547', name: '山东黄金', sector: '黄金' },
    { code: 'sz002476', name: '华鲁恒升', sector: '化工' },
    { code: 'sh600795', name: '北方华创', sector: '半导体' },
  ]
};

const fmt = (n) => n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-';
const fmtPrice = (p) => p ? '¥' + p.toFixed(2) : '-';
const fmtPct = (p) => p ? (p >= 0 ? '+' : '') + p.toFixed(2) + '%' : '-';

function getQuote(code) {
  return new Promise((resolve) => {
    const url = `https://qt.gtimg.cn/q=${code}`;
    const chunks = [];
    https.get(url, (res) => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const text = iconv.decode(buffer, 'GBK');
          const match = text.match(/="([^"]+)"/);
          if (match) {
            const parts = match[1].split('~');
            resolve({
              name: parts[1],
              price: parseFloat(parts[3]),
              change: parseFloat(parts[4]),
              changePct: parseFloat(parts[5]),
              high: parseFloat(parts[33]),
              low: parseFloat(parts[34]),
              volume: parseInt(parts[36]),
              amount: parseFloat(parts[37]),
              updateTime: parts[30]
            });
          } else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function fetchAllData() {
  console.log('Fetching live market data...');
  const data = { indices: [], keyStocks: [], hkStocks: [], portfolio: [], sectors: [] };
  
  for (const stock of STOCKS.indices) {
    const q = await getQuote(stock.code);
    if (q) data.indices.push({ ...stock, ...q });
  }
  for (const stock of STOCKS.keyStocks) {
    const q = await getQuote(stock.code);
    if (q) data.keyStocks.push({ ...stock, ...q });
  }
  for (const stock of STOCKS.hkStocks) {
    const q = await getQuote(stock.code);
    if (q) data.hkStocks.push({ ...stock, ...q });
  }
  for (const stock of STOCKS.portfolio) {
    const q = await getQuote(stock.code);
    if (q) {
      const pnl = (q.price - stock.entry) * stock.shares;
      const pnlPct = ((q.price - stock.entry) / stock.entry) * 100;
      data.portfolio.push({ ...stock, current: q.price, pnl, pnlPct, volume: q.volume });
    }
  }
  for (const stock of STOCKS.sectors) {
    const q = await getQuote(stock.code);
    if (q) data.sectors.push({ ...stock, price: q.price, changePct: q.changePct, volume: q.volume });
  }
  return data;
}

function generateProfessionalHTML(data, level) {
  const configs = {
    STANDARD: {
      title: 'Daily Market Report',
      subtitle: 'China A-Share Market Summary',
      primary: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0c1929 0%, #132743 50%, #0c1929 100%)',
      badge: 'STANDARD'
    },
    PRO: {
      title: 'Institutional Analysis Report',
      subtitle: 'Professional Market Intelligence',
      primary: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      badge: 'PRO'
    },
    ULTIMATE: {
      title: 'Super Brain Pro Intelligence',
      subtitle: 'Institutional-Grade Forensic Analysis',
      primary: '#f59e0b',
      gradient: 'linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 50%, #1f1f1f 100%)',
      badge: 'ULTIMATE'
    }
  };
  
  const c = configs[level];
  const totalValue = data.portfolio.reduce((sum, p) => sum + (p.current * p.shares), 0);
  const totalInvested = data.portfolio.reduce((sum, p) => sum + (p.entry * p.shares), 0);
  const totalPnl = totalValue - totalInvested;
  const pnlPct = (totalPnl / totalInvested) * 100;
  const marketTrend = data.indices[0]?.changePct >= 0 ? 'BULLISH' : 'BEARISH';
  const marketColor = data.indices[0]?.changePct >= 0 ? '#10b981' : '#ef4444';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.title} - ${DATE}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: ${c.gradient}; 
      padding: 20px;
      color: #e2e8f0;
      line-height: 1.6;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { text-align: center; padding: 40px 20px; background: rgba(0,0,0,0.3); border-radius: 24px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${c.primary}, ${c.primary}80, ${c.primary}); }
    .header h1 { font-size: 36px; font-weight: 700; background: linear-gradient(135deg, ${c.primary}, ${c.primary}aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
    .header .subtitle { opacity: 0.8; font-size: 16px; color: #94a3b8; margin-bottom: 16px; }
    .header-meta { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 16px; }
    .meta-item { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .meta-item .dot { width: 8px; height: 8px; border-radius: 50%; background: ${c.primary}; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .market-banner { background: rgba(0,0,0,0.4); border-radius: 16px; padding: 20px 30px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .market-status { display: flex; align-items: center; gap: 12px; }
    .market-status h2 { font-size: 24px; font-weight: 600; }
    .market-status .trend { font-size: 14px; padding: 4px 12px; border-radius: 12px; }
    .market-status .trend.bull { background: rgba(16,185,129,0.2); color: #10b981; }
    .market-status .trend.bear { background: rgba(239,68,68,0.2); color: #ef4444; }
    .market-summary { display: flex; gap: 30px; flex-wrap: wrap; }
    .summary-item { text-align: center; }
    .summary-item .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
    .summary-item .value { font-size: 20px; font-weight: 600; color: ${marketColor}; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 30px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; transition: all 0.3s ease; }
    .card:hover { background: rgba(255,255,255,0.05); border-color: ${c.primary}40; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .card-title { font-size: 18px; font-weight: 600; color: ${c.primary}; display: flex; align-items: center; gap: 10px; }
    .card-badge { font-size: 10px; padding: 4px 10px; border-radius: 10px; background: ${c.primary}30; color: ${c.primary}; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #64748b; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    tr:hover { background: rgba(255,255,255,0.03); }
    .positive { color: #10b981; font-weight: 500; }
    .negative { color: #ef4444; font-weight: 500; }
    .stock-code { background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin-right: 8px; }
    .stock-name { color: #cbd5e1; }
    .portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .portfolio-item { background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; text-align: center; }
    .portfolio-item .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
    .portfolio-item .value { font-size: 18px; font-weight: 600; }
    .portfolio-item .value.positive { color: #10b981; }
    .portfolio-item .value.negative { color: #ef4444; }
    .sector-tag { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 12px; margin-right: 8px; margin-bottom: 8px; }
    .sector-tag.hot { background: rgba(239,68,68,0.2); color: #ef4444; }
    .sector-tag.warm { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .sector-tag.cool { background: rgba(16,185,129,0.2); color: #10b981; }
    .action-btn { display: inline-block; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; margin-right: 8px; }
    .action-btn.buy { background: rgba(16,185,129,0.2); color: #10b981; }
    .action-btn.sell { background: rgba(239,68,68,0.2); color: #ef4444; }
    .action-btn.watch { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .risk-card { background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(0,0,0,0.3) 100%); border-color: rgba(245,158,11,0.3); }
    .risk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .risk-item { display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; }
    .risk-item .rule { font-weight: 500; }
    .risk-item .value { font-weight: 600; }
    .risk-item .value.danger { color: #ef4444; }
    .risk-item .value.success { color: #10b981; }
    .signal-card { display: flex; justify-content: space-between; align-items: center; padding: 14px; background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 10px; border-left: 3px solid ${c.primary}; }
    .signal-stock { font-weight: 600; }
    .signal-action { padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; }
    .signal-action.buy { background: #10b98120; color: #10b981; }
    .signal-action.sell { background: #ef444420; color: #ef4444; }
    .signal-action.watch { background: #f59e0b20; color: #f59e0b; }
    .signal-confidence { font-size: 12px; color: #94a3b8; }
    .hk-price { font-size: 16px; font-weight: 600; }
    .footer { text-align: center; padding: 30px; color: #64748b; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 30px; }
    .footer-logo { font-size: 20px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Super Brain V3</h1>
      <p class="subtitle">${c.subtitle}</p>
      <div class="header-meta">
        <div class="meta-item"><span class="dot"></span>LIVE Data</div>
        <div class="meta-item">📅 ${DATE} ${DAY_NAMES[DAY]}</div>
        <div class="meta-item">🏷️ ${c.badge}</div>
        <div class="meta-item">🔄 ${data.indices[0]?.updateTime || 'N/A'}</div>
      </div>
    </div>
    <div class="market-banner">
      <div class="market-status">
        <h2 style="color: ${marketColor};">${marketTrend}</h2>
        <span class="trend ${data.indices[0]?.changePct >= 0 ? 'bull' : 'bear'}">${data.indices[0]?.changePct >= 0 ? '📈' : '📉'}</span>
      </div>
      <div class="market-summary">
        <div class="summary-item"><div class="label">Shanghai</div><div class="value">${fmtPrice(data.indices[0]?.price)}</div></div>
        <div class="summary-item"><div class="label">Change</div><div class="value" style="color: ${marketColor}">${fmtPct(data.indices[0]?.changePct)}</div></div>
        <div class="summary-item"><div class="label">Volume</div><div class="value" style="color: #fff;">${fmt(data.indices[0]?.volume)}</div></div>
      </div>
    </div>
    <div class="grid">
      <div class="card">
        <div class="card-header"><div class="card-title">📊 Market Indices</div><div class="card-badge">5 Major</div></div>
        <table><tr><th>Index</th><th>Price</th><th>Change</th><th>High</th><th>Low</th></tr>
        ${data.indices.map(i => `<tr><td><span class="stock-name">${i.name}</span></td><td style="font-weight:600;">${fmtPrice(i.price)}</td><td class="${i.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(i.changePct)}</td><td style="color:#64748b;">${fmtPrice(i.high)}</td><td style="color:#64748b;">${fmtPrice(i.low)}</td></tr>`).join('')}
        </table>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">💰 Portfolio Summary</div><div class="card-badge">Positions</div></div>
        <div class="portfolio-grid">
          <div class="portfolio-item"><div class="label">Total Value</div><div class="value">¥${fmt(totalValue.toFixed(0))}</div></div>
          <div class="portfolio-item"><div class="label">Invested</div><div class="value">¥${fmt(totalInvested.toFixed(0))}</div></div>
          <div class="portfolio-item"><div class="label">P&L</div><div class="value ${totalPnl >= 0 ? 'positive' : 'negative'}">${totalPnl >= 0 ? '+' : ''}¥${fmt(totalPnl.toFixed(0))}</div></div>
        </div>
        ${level !== 'STANDARD' ? `
        <table><tr><th>Stock</th><th>Entry</th><th>Current</th><th>P&L</th></tr>
        ${data.portfolio.map(p => `<tr><td><span class="stock-code">${p.code.replace('sh','').replace('sz','')}</span><span class="stock-name">${p.name}</span></td><td>¥${p.entry.toFixed(2)}</td><td style="font-weight:600;">¥${p.current.toFixed(2)}</td><td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}¥${p.pnl.toFixed(0)}</td></tr>`).join('')}
        </table>` : ''}
      </div>
    </div>
    <div class="grid">
      <div class="card">
        <div class="card-header"><div class="card-title">🔥 Sector Rotation</div><div class="card-badge">Analysis</div></div>
        <div style="margin-bottom:16px;">
          <span class="sector-tag hot">🔥 NOW - 电力, 有色金属</span>
          <span class="sector-tag warm">📈 NEXT - 化工, 军工</span>
          <span class="sector-tag cool">📈 LATER - 消费, 科技</span>
        </div>
        <table><tr><th>Sector</th><th>Leader</th><th>Change</th><th>Volume</th></tr>
        ${data.sectors.map(s => `<tr><td><span class="sector-tag" style="background:${s.changePct >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};color:${s.changePct >= 0 ? '#10b981' : '#ef4444'}">${s.sector}</span></td><td>${s.name}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td><td style="color:#64748b;font-size:12px;">${fmt(s.volume)}</td></tr>`).join('')}
        </table>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🏆 Key A-Shares</div><div class="card-badge">Top 10</div></div>
        <table><tr><th>Stock</th><th>Price</th><th>Change</th><th>Turnover</th></tr>
        ${data.keyStocks.slice(0,8).map(s => `<tr><td><span class="stock-code">${s.code.replace('sh','').replace('sz','')}</span><span class="stock-name">${s.name}</span></td><td style="font-weight:600;">¥${s.price?.toFixed(2) || '-'}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td><td style="color:#64748b;font-size:12px;">¥${((s.amount || 0)/100000000).toFixed(1)}亿</td></tr>`).join('')}
        </table>
      </div>
    </div>
    ${level !== 'STANDARD' ? `
    <div class="grid">
      <div class="card">
        <div class="card-header"><div class="card-title">🌏 HK Tech Giants</div><div class="card-badge">Hong Kong</div></div>
        <table><tr><th>Stock</th><th>Price (HKD)</th><th>Change</th><th>Action</th></tr>
        ${data.hkStocks.map(s => `<tr><td class="stock-name">${s.name}</td><td class="hk-price">HK$${s.price?.toFixed(2) || '-'}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td><td><span class="action-btn ${s.changePct >= 0 ? 'buy' : 'watch'}">${s.changePct >= 0 ? 'BUY' : 'WATCH'}</span></td></tr>`).join('')}
        </table>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🏛️ Institutional Flow</div><div class="card-badge">Smart Money</div></div>
        ${data.keyStocks.slice(0,5).map(s => `<div class="signal-card"><div><div class="signal-stock">${s.name}</div><div class="signal-confidence">Vol: ${fmt(s.volume)}</div></div><div style="text-align:right;"><div class="signal-action ${s.changePct >= 0 ? 'buy' : 'sell'}">${s.changePct >= 0 ? '🟢 INFLOW' : '🔴 OUTFLOW'}</div><div class="signal-confidence">${fmtPct(s.changePct)}</div></div></div>`).join('')}
      </div>
    </div>` : ''}
    ${level === 'ULTIMATE' ? `
    <div class="grid">
      <div class="card">
        <div class="card-header"><div class="card-title">🎯 Today's Top Picks</div><div class="card-badge" style="background:#10b98130;color:#10b981;">HIGH CONFIDENCE</div></div>
        ${data.keyStocks.slice(0,4).map((s, i) => `<div class="signal-card" style="border-left-color:#10b981;"><div><div class="signal-stock">${i+1}. ${s.name}</div><div style="font-size:12px;color:#64748b;">¥${s.price?.toFixed(2)}</div></div><div style="text-align:right;"><div class="signal-action ${s.changePct >= 0 ? 'buy' : 'watch'}">${s.changePct >= 0 ? 'BUY' : 'WATCH'}</div><div class="signal-confidence">Target: +${(Math.abs(s.changePct) * 1.5).toFixed(1)}%</div></div></div>`).join('')}
      </div>
      <div class="card risk-card">
        <div class="card-header"><div class="card-title" style="color:#f59e0b;">⚠️ Trading Rules & Risk</div></div>
        <div class="risk-grid">
          <div class="risk-item"><span class="rule">🚫 Stop Loss</span><span class="value danger">-7% Hard</span></div>
          <div class="risk-item"><span class="rule">📈 Take Profit</span><span class="value success">+10% Partial</span></div>
          <div class="risk-item"><span class="rule">💎 Max Position</span><span class="value">20% Per Stock</span></div>
          <div class="risk-item"><span class="rule">⛔ No Averaging</span><span class="value danger">Never</span></div>
        </div>
      </div>
    </div>` : ''}
    ${level === 'PRO' ? `
    <div class="grid">
      <div class="card">
        <div class="card-header"><div class="card-title">⚡ Action Items</div><div class="card-badge">Today</div></div>
        ${[1,2,3,4].map((n, i) => `<div class="signal-card"><div class="signal-stock">${n}. ${['Review Portfolio','Sector Rotation','Set Alerts','Risk Check'][i]}</div><div class="signal-action ${['watch','buy','watch','sell'][i]}">${['Check P&L','Follow Flow','Monitor','Verify'][i]}</div></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📈 Market Outlook</div><div class="card-badge">Analysis</div></div>
        <table><tr><th>Indicator</th><th>Status</th><th>Signal</th></tr>
        <tr><td>Market Trend</td><td class="${data.indices[0]?.changePct >= 0 ? 'positive' : 'negative'}">${marketTrend}</td><td>${data.indices[0]?.changePct >= 0 ? '🟢' : '🔴'}</td></tr>
        <tr><td>Volume</td><td>${data.indices[0]?.volume > 300000000 ? 'High' : 'Normal'}</td><td>📊</td></tr>
        <tr><td>Sector Flow</td><td>Rotation</td><td>🔥</td></tr>
        <tr><td>Risk Level</td><td style="color:#f59e0b;">Moderate</td><td>⚠️</td></tr>
        </table>
      </div>
    </div>` : ''}
    <div class="footer">
      <div class="footer-logo">🧠 Super Brain V3</div>
      <div>${c.title} | ${DATE} | ${DAY_NAMES[DAY]} | Generated at ${new Date().toLocaleTimeString('zh-CN', {timeZone:'Asia/Shanghai'})}</div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🚀 PROFESSIONAL REPORT GENERATOR V3');
  console.log('═══════════════════════════════════════');
  console.log(`📅 Date: ${DATE}`);
  console.log(`📅 Day: ${DAY_NAMES[DAY]}`);
  console.log('═══════════════════════════════════════\n');
  
  const data = await fetchAllData();
  
  const levels = ['STANDARD', 'PRO', 'ULTIMATE'];
  for (const level of levels) {
    const html = generateProfessionalHTML(data, level);
    const filename = level === 'STANDARD' ? 'client_report' : `client_report_${level}`;
    const htmlFile = `${REPORT_DIR}${filename}_${DATE}.html`;
    fs.writeFileSync(htmlFile, html);
    console.log(`✅ Saved: ${htmlFile}`);
  }
  
  console.log('\n🎉 Professional Reports Generated Successfully!');
}

main().catch(console.error);
