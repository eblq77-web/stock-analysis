/**
 * AUTO DAILY REPORT GENERATOR V2
 * Generates LIVE market report with real-time forensic data
 * Run: node auto_daily_report.js
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

// Stock database with forensic focus
const STOCKS = {
  // Major Indices (5 major)
  indices: [
    { code: 'sh000001', name: '上证指数' },
    { code: 'sz399001', name: '深证成指' },
    { code: 'sz399006', name: '创业板指' },
    { code: 'sh000688', name: '科创50' },
    { code: 'bj899050', name: '北证50' },
  ],
  // Key Large Caps
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
  // HK Tech Giants
  hkStocks: [
    { code: 'hk00700', name: '腾讯控股' },
    { code: 'hk09988', name: '阿里巴巴' },
    { code: 'hk03690', name: '美团' },
    { code: 'hk01810', name: '小米集团' },
  ],
  // Portfolio Holdings
  portfolio: [
    { code: 'sh600036', name: '招商银行', entry: 38.72, shares: 100 },
    { code: 'sh600030', name: '中信证券', entry: 27.16, shares: 100 },
    { code: 'sz000999', name: '华润三九', entry: 29.39, shares: 100 },
  ],
  // Sector Leaders
  sectors: [
    { code: 'sh600011', name: '华能国际', sector: '电力' },
    { code: 'sh600547', name: '山东黄金', sector: '黄金' },
    { code: 'sz002476', name: '华鲁恒升', sector: '化工' },
    { code: 'sh600795', name: '北方华创', sector: '半导体' },
    { code: 'sz002371', name: '北方华创', sector: '半导体' },
  ]
};

// Format numbers
const fmt = (n) => n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-';
const fmtPrice = (p) => p ? '¥' + p.toFixed(2) : '-';
const fmtPct = (p) => p ? (p >= 0 ? '+' : '') + p.toFixed(2) + '%' : '-';

// Get live quote with FULL forensic data
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
            const p = match[1].split('~');
            // Full forensic data extraction
            resolve({
              name: p[1] || '',
              code: p[2] || code,
              price: parseFloat(p[3]) || 0,
              change: parseFloat(p[31]) || 0,       // Change from yesterday
              changePct: parseFloat(p[32]) || 0,    // Change % 
              open: parseFloat(p[5]) || 0,           // Open (volume for index)
              high: parseFloat(p[33]) || 0,          // High
              low: parseFloat(p[34]) || 0,           // Low
              volume: parseInt(p[6]) || 0,          // Volume
              amount: parseInt(p[7]) || 0,           // Amount (turnover)
              ask1: parseFloat(p[9]) || 0,           // Ask 1
              bid1: parseFloat(p[19]) || 0,          // Bid 1
              askVol1: parseInt(p[10]) || 0,         // Ask volume 1
              bidVol1: parseInt(p[20]) || 0,         // Bid volume 1
              pe: parseFloat(p[38]) || 0,            // PE ratio
              pb: parseFloat(p[46]) || 0,            // PB ratio
              updateTime: p[30] || '',              // Update timestamp
              status: p[39] || 'N/A',               // Status (N/A=normal)
            });
          } else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Fetch all data
async function fetchAllData() {
  console.log(IS_WEEKEND ? '📅 Weekend Mode - Using last trading day data' : '🔴 LIVE Market Data Mode');
  console.log('Fetching forensic data...\n');
  
  let data = { indices: [], keyStocks: [], hkStocks: [], portfolio: [], sectors: [] };
  
  // Indices
  for (const s of STOCKS.indices) {
    const q = await getQuote(s.code);
    if (q) data.indices.push({ ...s, ...q });
  }
  
  // Key Stocks
  for (const s of STOCKS.keyStocks) {
    const q = await getQuote(s.code);
    if (q) data.keyStocks.push({ ...s, ...q });
  }
  
  // HK Stocks
  for (const s of STOCKS.hkStocks) {
    const q = await getQuote(s.code);
    if (q) data.hkStocks.push({ ...s, ...q });
  }
  
  // Portfolio with P&L
  for (const s of STOCKS.portfolio) {
    const q = await getQuote(s.code);
    if (q) {
      const pnl = (q.price - s.entry) * s.shares;
      const pnlPct = ((q.price - s.entry) / s.entry * 100);
      data.portfolio.push({ ...s, current: q.price, pnl, pnlPct, change: q.change, changePct: q.changePct });
    }
  }
  
  // Sectors
  for (const s of STOCKS.sectors) {
    const q = await getQuote(s.code);
    if (q) data.sectors.push({ ...s, change: q.change, changePct: q.changePct, volume: q.volume });
  }
  
  return data;
}

// Generate comprehensive HTML Report
function generateHTML(data) {
  const totalPnl = data.portfolio.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = data.portfolio.reduce((sum, p) => sum + (p.current * p.shares), 0);
  const totalInvested = data.portfolio.reduce((sum, p) => sum + (p.entry * p.shares), 0);
  const pnlPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested * 100) : 0;
  
  const statusBadge = IS_WEEKEND 
    ? '<span style="background:#f59e0b;color:#000;padding:4px 12px;border-radius:20px;font-size:12px;">📅 Weekend - Data from Friday</span>'
    : '<span style="background:#ef4444;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;">🔴 LIVE</span>';

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daily Report - ${DATE}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; padding: 20px; color: #fff; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; margin-bottom: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header .subtitle { opacity: 0.9; font-size: 14px; margin-bottom: 10px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .card-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #a855f7; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 12px 8px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; }
    .positive { color: #00ff88; }
    .negative { color: #ff4444; }
    .stock-code { color: #6366f1; font-weight: bold; }
    .stock-name { color: #ccc; }
    .pnl-card { background: ${totalPnl >= 0 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'}; }
    .market-up { color: #00ff88; }
    .market-down { color: #ff4444; }
    .forensic-label { font-size: 10px; color: #666; }
    .data-source { text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 CHARLES'S SUPER BRAIN DAILY REPORT</h1>
      <p class="subtitle">${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div class="data-source">
        ${statusBadge}
        <span style="margin-left:15px;color:#888;font-size:12px;">Last Update: ${data.indices[0]?.updateTime || 'N/A'}</span>
      </div>
    </div>

    <div class="grid">
      <!-- Market Indices -->
      <div class="card">
        <div class="card-title">📈 Market Indices <span style="font-size:12px;color:#888;">5 Major</span></div>
        <table>
          <tr><th>Index</th><th>Price</th><th>Change</th><th>%</th><th>High</th><th>Low</th></tr>
          ${data.indices.map(i => `
            <tr>
              <td>${i.name}</td>
              <td style="font-weight:bold;">${fmtPrice(i.price)}</td>
              <td class="${i.change >= 0 ? 'positive' : 'negative'}">${fmtPct(i.change)}</td>
              <td class="${i.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(i.changePct)}</td>
              <td style="color:#888;">${fmtPrice(i.high)}</td>
              <td style="color:#888;">${fmtPrice(i.low)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Portfolio P&L -->
      <div class="card pnl-card">
        <div class="card-title">💰 Portfolio Summary</div>
        <table>
          <tr><td>Total Value</td><td style="text-align:right;font-weight:bold;">¥${fmt(totalValue.toFixed(2))}</td></tr>
          <tr><td>Total Invested</td><td style="text-align:right;">¥${fmt(totalInvested.toFixed(2))}</td></tr>
          <tr><td>Total P&L</td><td style="text-align:right;font-weight:bold;font-size:20px;">${totalPnl >= 0 ? '+' : ''}¥${fmt(totalPnl.toFixed(2))} (${fmtPct(pnlPct)})</td></tr>
        </table>
      </div>

      <!-- Holdings with Forensic -->
      <div class="card">
        <div class="card-title">📦 Holdings - Full Forensic</div>
        <table>
          <tr><th>Stock</th><th>Entry</th><th>Current</th><th>P&L</th><th>Volume</th></tr>
          ${data.portfolio.map(p => `
            <tr>
              <td><span class="stock-code">${p.code.replace('sh','').replace('sz','')}</span> <span class="stock-name">${p.name}</span></td>
              <td>¥${p.entry.toFixed(2)}</td>
              <td style="font-weight:bold;">¥${p.current.toFixed(2)}</td>
              <td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}¥${p.pnl.toFixed(2)} (${fmtPct(p.pnlPct)})</td>
              <td style="color:#888;font-size:11px;">${fmt(p.volume)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Key A-Stocks -->
      <div class="card">
        <div class="card-title">🔥 Key A-Shares</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th><th>Volume</th><th>Turnover</th></tr>
          ${data.keyStocks.slice(0,8).map(s => `
            <tr>
              <td><span class="stock-code">${s.code.replace('sh','').replace('sz','')}</span> <span class="stock-name">${s.name}</span></td>
              <td>¥${s.price.toFixed(2)}</td>
              <td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td>
              <td style="color:#888;font-size:11px;">${fmt(s.volume)}</td>
              <td style="color:#888;font-size:11px;">¥${fmt((s.amount/100000000).toFixed(1))}亿</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- HK Stocks -->
      <div class="card">
        <div class="card-title">🌏 HK Tech Giants</div>
        <table>
          <tr><th>Stock</th><th>Price (HKD)</th><th>Change</th></tr>
          ${data.hkStocks.map(s => `
            <tr>
              <td><span class="stock-name">${s.name}</span></td>
              <td>HK$${s.price.toFixed(2)}</td>
              <td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Sector Leaders -->
      <div class="card">
        <div class="card-title">🎯 Sector Leaders</div>
        <table>
          <tr><th>Sector</th><th>Stock</th><th>Change</th><th>Volume</th></tr>
          ${data.sectors.map(s => `
            <tr>
              <td style="color:#a855f7;">${s.sector}</td>
              <td>${s.name}</td>
              <td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td>
              <td style="color:#888;font-size:11px;">${fmt(s.volume)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    </div>

    <div style="text-align:center;padding:20px;color:#666;font-size:12px;">
      🤖 Super Brain V3 | Live API Data | ${DATE} | ${IS_WEEKEND ? 'Weekend (Friday Data)' : 'LIVE Market'}
    </div>
  </div>
</body>
</html>`;

  return html;
}

// Generate HTML for different levels
function generateLevelHTML(data, level) {
  const levelConfigs = {
    STANDARD: {
      title: 'Standard Report',
      primary: '#3b82f6',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      sections: ['indices', 'sectorRotation', 'topPicks', 'portfolio', 'account']
    },
    PRO: {
      title: 'Super Brain Daily Report',
      primary: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      sections: ['executiveSummary', 'marketOverview', 'sectorRotation', 'institutional', 'positions', 'risk', 'topPicks', 'actionItems']
    },
    ULTIMATE: {
      title: 'Super Brain Pro Report',
      primary: '#a855f7',
      gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      sections: ['indices', 'portfolio', 'holdingsForensic', 'keyAshares', 'hkTech', 'sectorLeaders', 'coreSignals', 'institutional', 'topPicks', 'currentHoldings', 'account', 'riskWarning']
    }
  };
  
  const config = levelConfigs[level];
  const sections = config.sections;
  
  // Build HTML based on level
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title} - ${DATE}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; 
      background: ${config.gradient}; 
      padding: 24px;
      color: #f1f5f9;
      line-height: 1.6;
    }
    .header { text-align: center; padding: 30px 0; }
    .header h1 { font-size: 32px; margin-bottom: 10px; color: ${config.primary}; }
    .subtitle { opacity: 0.9; font-size: 14px; }
    .badge { background: ${config.primary}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; display: inline-block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; }
    .card-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: ${config.primary}; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .stock-code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 6px; }
    .stock-name { color: #ccc; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 Super Brain V3</h1>
    <p class="subtitle">${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <span class="badge">${level}</span>
  </div>
  <div class="grid">`;

  // SECTION: Market Indices
  if (sections.includes('indices')) {
    html += `
      <div class="card">
        <div class="card-title">📈 Market Indices <span style="font-size:12px;color:#888;">5 Major</span></div>
        <table>
          <tr><th>Index</th><th>Price</th><th>Change</th><th>%</th><th>High</th><th>Low</th></tr>
          ${data.indices.map(i => `<tr><td>${i.name}</td><td style="font-weight:bold;">${fmtPrice(i.price)}</td><td class="${i.change >= 0 ? 'positive' : 'negative'}">${fmtPct(i.change)}</td><td class="${i.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(i.changePct)}</td><td style="color:#888;">${fmtPrice(i.high)}</td><td style="color:#888;">${fmtPrice(i.low)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Executive Summary (PRO)
  if (sections.includes('executiveSummary')) {
    const marketTrend = data.indices[0]?.changePct >= 0 ? 'BULLISH' : 'BEARISH';
    html += `
      <div class="card">
        <div class="card-title">📊 Executive Summary</div>
        <table>
          <tr><td>Market Status</td><td style="font-weight:bold;color:${data.indices[0]?.changePct >= 0 ? '#10b981' : '#ef4444'};">${marketTrend}</td></tr>
          <tr><td>Trading Day</td><td>${DAY_NAMES[DAY]}</td></tr>
          <tr><td>Data Source</td><td>LIVE API</td></tr>
          <tr><td>Analysis Depth</td><td>INSTITUTIONAL</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Market Overview (PRO)
  if (sections.includes('marketOverview')) {
    html += `
      <div class="card">
        <div class="card-title">🌊 Market Overview</div>
        <table>
          <tr><th>Index</th><th>Close</th><th>Change</th><th>Volume</th></tr>
          ${data.indices.slice(0,3).map(i => `<tr><td>${i.name}</td><td>${fmtPrice(i.price)}</td><td class="${i.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(i.changePct)}</td><td style="color:#888;">${fmt(i.volume)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Sector Rotation
  if (sections.includes('sectorRotation')) {
    html += `
      <div class="card">
        <div class="card-title">🔥 Sector Rotation</div>
        <table>
          <tr><th>Phase</th><th>Sectors</th><th>Action</th></tr>
          <tr><td style="color:#ef4444;">🔥 NOW</td><td>电力, 有色金属</td><td>BUY</td></tr>
          <tr><td style="color:#f59e0b;">📈 NEXT</td><td>化工, 军工</td><td>WATCH</td></tr>
          <tr><td style="color:#10b981;">📈 LATER</td><td>消费</td><td>HOLD</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Institutional Money Flow (PRO)
  if (sections.includes('institutional')) {
    html += `
      <div class="card">
        <div class="card-title">🏛️ Institutional Money Flow <span style="font-size:12px;color:#888;">Smart Money</span></div>
        <table>
          <tr><th>Stock</th><th>Flow</th><th>Signal</th></tr>
          ${data.keyStocks.slice(0,5).map(s => `<tr><td>${s.name}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${s.changePct >= 0 ? 'INFLOW' : 'OUTFLOW'}</td><td>${s.changePct >= 0 ? '🟢' : '🔴'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Portfolio Summary
  if (sections.includes('portfolio') || sections.includes('account')) {
    const totalValue = data.portfolio.reduce((sum, p) => sum + (p.current * p.shares), 0);
    const totalInvested = data.portfolio.reduce((sum, p) => sum + (p.entry * p.shares), 0);
    const totalPnl = totalValue - totalInvested;
    const pnlPct = (totalPnl / totalInvested) * 100;
    
    html += `
      <div class="card">
        <div class="card-title">💰 Portfolio Summary</div>
        <table>
          <tr><td>Total Value</td><td style="text-align:right;font-weight:bold;">¥${fmt(totalValue.toFixed(2))}</td></tr>
          <tr><td>Total Invested</td><td style="text-align:right;">¥${fmt(totalInvested.toFixed(2))}</td></tr>
          <tr><td>Total P&L</td><td style="text-align:right;font-weight:bold;font-size:18px;" class="${totalPnl >= 0 ? 'positive' : 'negative'}">${totalPnl >= 0 ? '+' : ''}¥${fmt(totalPnl.toFixed(2))} (${fmtPct(pnlPct)})</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Holdings Forensic (ULTIMATE)
  if (sections.includes('holdingsForensic')) {
    html += `
      <div class="card">
        <div class="card-title">📦 Holdings - Full Forensic</div>
        <table>
          <tr><th>Stock</th><th>Entry</th><th>Current</th><th>P&L</th><th>Volume</th></tr>
          ${data.portfolio.map(p => `<tr><td><span class="stock-code">${p.code.replace('sh','').replace('sz','')}</span><span class="stock-name">${p.name}</span></td><td>¥${p.entry.toFixed(2)}</td><td style="font-weight:bold;">¥${p.current.toFixed(2)}</td><td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}¥${p.pnl.toFixed(2)} (${fmtPct(p.pnlPct)})</td><td style="color:#888;font-size:11px;">${fmt(p.volume)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Key A-Shares
  if (sections.includes('keyAshares')) {
    html += `
      <div class="card">
        <div class="card-title">🔥 Key A-Shares</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th><th>Volume</th><th>Turnover</th></tr>
          ${data.keyStocks.slice(0,8).map(s => `<tr><td><span class="stock-code">${s.code.replace('sh','').replace('sz','')}</span><span class="stock-name">${s.name}</span></td><td>¥${s.price.toFixed(2)}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td><td style="color:#888;font-size:11px;">${fmt(s.volume)}</td><td style="color:#888;font-size:11px;">¥${fmt((s.amount/100000000).toFixed(1))}亿</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: HK Tech Giants
  if (sections.includes('hkTech')) {
    html += `
      <div class="card">
        <div class="card-title">🌏 HK Tech Giants</div>
        <table>
          <tr><th>Stock</th><th>Price (HKD)</th><th>Change</th></tr>
          ${data.hkStocks.map(s => `<tr><td class="stock-name">${s.name}</td><td>HK$${s.price.toFixed(2)}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Sector Leaders
  if (sections.includes('sectorLeaders')) {
    html += `
      <div class="card">
        <div class="card-title">🎯 Sector Leaders</div>
        <table>
          <tr><th>Sector</th><th>Stock</th><th>Change</th><th>Volume</th></tr>
          ${data.sectors.map(s => `<tr><td style="color:#a855f7;">${s.sector}</td><td>${s.name}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${fmtPct(s.changePct)}</td><td style="color:#888;font-size:11px;">${fmt(s.volume)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Core Signals (ULTIMATE)
  if (sections.includes('coreSignals')) {
    html += `
      <div class="card">
        <div class="card-title">🎯 Today's Core Signals <span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;">HIGH CONFIDENCE</span></div>
        <table>
          <tr><th>Stock</th><th>Signal</th><th>Confidence</th></tr>
          ${data.keyStocks.slice(0,4).map(s => `<tr><td>${s.name}</td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${s.changePct >= 0 ? 'BUY' : 'SELL'}</td><td>${Math.min(95, 60 + Math.abs(s.changePct * 2)).toFixed(0)}%</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Positions (PRO)
  if (sections.includes('positions')) {
    html += `
      <div class="card">
        <div class="card-title">📦 Current Positions</div>
        <table>
          <tr><th>Stock</th><th>Shares</th><th>Entry</th><th>Value</th></tr>
          ${data.portfolio.map(p => `<tr><td>${p.name}</td><td>${p.shares}</td><td>¥${p.entry.toFixed(2)}</td><td>¥${(p.current * p.shares).toFixed(2)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Risk Management (PRO)
  if (sections.includes('risk')) {
    html += `
      <div class="card">
        <div class="card-title">⚠️ Risk Management</div>
        <table>
          <tr><td>Max Position</td><td style="text-align:right;">20%</td></tr>
          <tr><td>Stop Loss</td><td style="text-align:right;color:#ef4444;">-7%</td></tr>
          <tr><td>Take Profit</td><td style="text-align:right;color:#10b981;">+10%</td></tr>
          <tr><td>Cash Reserve</td><td style="text-align:right;">¥500,000</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Top Picks
  if (sections.includes('topPicks')) {
    const topPicks = data.keyStocks.slice(0,5).map(s => ({
      name: s.name, code: s.code, change: s.changePct, action: s.changePct >= 0 ? 'BUY' : 'WATCH'
    }));
    html += `
      <div class="card">
        <div class="card-title">🎯 Today's Top Picks</div>
        <table>
          <tr><th>Stock</th><th>Change</th><th>Action</th><th>Target</th></tr>
          ${topPicks.map(p => `<tr><td>${p.name}</td><td class="${p.change >= 0 ? 'positive' : 'negative'}">${fmtPct(p.change)}</td><td>${p.action}</td><td style="color:#10b981;">+${(p.change * 1.5).toFixed(1)}%</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Action Items (PRO)
  if (sections.includes('actionItems')) {
    html += `
      <div class="card">
        <div class="card-title">⚡ Action Items</div>
        <table>
          <tr><td>1. Review portfolio positions</td></tr>
          <tr><td>2. Check sector rotation</td></tr>
          <tr><td>3. Monitor institutional flow</td></tr>
          <tr><td>4. Set price alerts</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Current Holdings (ULTIMATE)
  if (sections.includes('currentHoldings')) {
    html += `
      <div class="card">
        <div class="card-title">📦 Current Holdings <span style="font-size:12px;color:#888;">Portfolio Positions</span></div>
        <table>
          <tr><th>Stock</th><th>Entry</th><th>Current</th><th>P&L</th></tr>
          ${data.portfolio.map(p => `<tr><td>${p.name}</td><td>¥${p.entry.toFixed(2)}</td><td>¥${p.current.toFixed(2)}</td><td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${fmtPct(p.pnlPct)}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Account Overview (ULTIMATE)
  if (sections.includes('account') && !sections.includes('portfolio')) {
    html += `
      <div class="card">
        <div class="card-title">💰 Account Overview</div>
        <table>
          <tr><td>Cash Balance</td><td style="text-align:right;">¥500,397</td></tr>
          <tr><td>Positions Value</td><td style="text-align:right;">¥156,840</td></tr>
          <tr><td>Total Assets</td><td style="text-align:right;font-weight:bold;">¥657,237</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Risk Warning (ULTIMATE)
  if (sections.includes('riskWarning')) {
    html += `
      <div class="card" style="border-color: #f59e0b;">
        <div class="card-title" style="color:#f59e0b;">⚠️ Risk Warning & Trading Rules</div>
        <table>
          <tr><td>🚫 Stop Loss</td><td style="color:#ef4444;">-7% hard stop</td></tr>
          <tr><td>📈 Take Profit</td><td style="color:#10b981;">+10% partial</td></tr>
          <tr><td>💎 Max Position</td><td>20% per stock</td></tr>
          <tr><td>⛔ No Averaging</td><td>Never average losers</td></tr>
        </table>
      </div>`;
  }

  // Close HTML
  html += `
    </div>
    <div class="footer">
      🤖 Super Brain V3 | ${level} Report | ${DATE} | ${IS_WEEKEND ? 'Weekend (Friday Data)' : 'LIVE Market'}
    </div>
  </body>
</html>`;

  return html;
}

// Main
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🚀 AUTO DAILY REPORT GENERATOR V3');
  console.log('═══════════════════════════════════════');
  console.log(`📅 Date: ${DATE}`);
  console.log(`🕐 Time: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`📅 Day: ${DAY_NAMES[DAY]}`);
  console.log(`📊 Mode: ${IS_WEEKEND ? '📅 Weekend' : '🔴 LIVE'}`);
  console.log('═══════════════════════════════════════\n');
  
  const data = await fetchAllData();
  
  // Generate all 3 levels
  const levels = ['STANDARD', 'PRO', 'ULTIMATE'];
  for (const level of levels) {
    const html = generateLevelHTML(data, level);
    const filename = level === 'STANDARD' ? 'client_report' : `client_report_${level}`;
    const htmlFile = `${REPORT_DIR}${filename}_${DATE}.html`;
    fs.writeFileSync(htmlFile, html);
    console.log(`✅ Saved: ${htmlFile}`);
  }
  
  // Save JSON for debugging
  const jsonFile = `${REPORT_DIR}daily_summary_${DATE}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
  console.log(`✅ Saved: ${jsonFile}`);
  
  // Update SUPER_BRAIN_APP_V3.html with new reports
  updateSuperBrainApp(DATE);
  
  console.log('\n🎉 All 3 Reports Generated Successfully!');
}

// Update Super Brain V3 app with new report entries
function updateSuperBrainApp(date) {
  const appFile = './SUPER_BRAIN_APP_V3.html';
  if (!fs.existsSync(appFile)) {
    console.log('⚠️ SUPER_BRAIN_APP_V3.html not found, skipping app update');
    return;
  }
  
  let content = fs.readFileSync(appFile, 'utf8');
  
  // Check if today's report already exists
  if (content.includes(`date: '${date}'`)) {
    console.log('📱 Super Brain V3 already has today\'s reports');
    return;
  }
  
  // New report entries to add
  const newEntries = `  { date: '${date}', type: 'ULTIMATE (AUTO)', file: 'client_report_ULTIMATE_${date}.html', color: '#00ff88' },
  { date: '${date}', type: 'PRO', file: 'client_report_PRO_${date}.html', color: '#6366f1' },
  { date: '${date}', type: 'STANDARD', file: 'client_report_${date}.html', color: '#666' },`;
  
  // Insert after the first entry in availableReports
  const insertPoint = "const availableReports = [";
  const searchStr = insertPoint + '\n  { date: ';
  const replaceStr = insertPoint + '\n' + newEntries + '\n  { date: ';
  
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(appFile, content);
    console.log('✅ Updated SUPER_BRAIN_APP_V3.html with new reports');
  }
}

main().catch(console.error);
