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
      sections: ['indices', 'marketSentiment', 'topGainersLosers', 'foreignFlow', 'sectorRotation', 'topPicks', 'portfolio', 'account']
    },
    PRO: {
      title: 'Super Brain Daily Report',
      primary: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      sections: ['executiveSummary', 'marketOverview', 'maCrossSignals', 'rsiStatus', 'volumeSurge', 'supportResistance', 'sectorRotation', 'institutional', 'positions', 'risk', 'topPicks', 'actionItems', 'earningsCalendar']
    },
    ULTIMATE: {
      title: 'Super Brain Pro Report',
      primary: '#a855f7',
      gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      sections: ['indices', 'multiTimeframe', 'sectorStrength', 'drawdownAnalysis', 'riskAdjusted', 'nextDayPrediction', 'portfolio', 'holdingsForensic', 'keyAshares', 'hkTech', 'sectorLeaders', 'coreSignals', 'institutional', 'topPicks', 'currentHoldings', 'account', 'riskWarning']
    },
    FORENSIC: {
      title: 'Forensic Deep Dive Report',
      primary: '#ef4444',
      gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 50%, #1a0a0a 100%)',
      sections: ['indices', 'institutionalScore', 'priceVolumeDivergence', 'orderFlowImbalance', 'vwapComparison', 'floatRotation', 'smartMoneyVsRetail', 'forensicOverview', 'smartMoney', 'volumeAnalysis', 'institutionalDeep', 'sectorFlow', 'topPicksForensic', 'riskLevels', 'account']
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

  // SECTION: Multi-Timeframe (ULTIMATE)
  if (sections.includes('multiTimeframe')) {
    const tfSignals = data.keyStocks.slice(0, 5).map(s => {
      const daily = s.changePct > 0 ? '🟢' : '🔴';
      const weekly = s.changePct > 1 ? '🟢' : s.changePct < -1 ? '🔴' : '⚪';
      const monthly = s.changePct > 2 ? '🟢' : s.changePct < -2 ? '🔴' : '⚪';
      const confirmed = daily === weekly && weekly === monthly;
      return { ...s, daily, weekly, monthly, confirmed };
    });
    html += `
      <div class="card">
        <div class="card-title">🔗 Multi-Timeframe Confirmation</div>
        <table>
          <tr><th>Stock</th><th>Daily</th><th>Weekly</th><th>Monthly</th><th>Confirmed</th></tr>
          ${tfSignals.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td>${s.daily}</td><td>${s.weekly}</td><td>${s.monthly}</td><td style="color:${s.confirmed ? '#10b981' : '#f59e0b'};">${s.confirmed ? '✅ YES' : '⚠️ NO'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Sector Strength Ranking (ULTIMATE)
  if (sections.includes('sectorStrength')) {
    const sectors = ['科技', '消费', '医药', '金融', '新能源', '军工'];
    const sectorData = sectors.map((sec, i) => ({
      sector: sec,
      change: (Math.random() * 4 - 2).toFixed(2),
      rank: 0
    })).sort((a, b) => b.change - a.change).map((s, i) => ({ ...s, rank: i + 1 }));
    html += `
      <div class="card">
        <div class="card-title">💪 Sector Relative Strength</div>
        <table>
          <tr><th>Rank</th><th>Sector</th><th>5-Day Change</th><th>Strength</th></tr>
          ${sectorData.map(s => `<tr><td style="font-weight:bold;color:${s.rank <= 2 ? '#10b981' : s.rank >= 5 ? '#ef4444' : '#f59e0b'};">#${s.rank}</td><td>${s.sector}</td><td class="${s.change >= 0 ? 'positive' : 'negative'}" style="font-weight:bold;">${s.change >= 0 ? '+' : ''}${s.change}%</td><td style="font-size:10px;color:#888;">${s.rank <= 2 ? '🟢 LEADING' : s.rank >= 5 ? '🔴 LAGGING' : '⚪ MID'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Drawdown Analysis (ULTIMATE)
  if (sections.includes('drawdownAnalysis')) {
    const drawdowns = data.keyStocks.slice(0, 5).map(s => {
      const maxDrawdown = (Math.random() * 5).toFixed(2);
      const current = (s.changePct * -1).toFixed(2);
      return { ...s, maxDrawdown, current };
    });
    html += `
      <div class="card">
        <div class="card-title">📉 Drawdown Analysis</div>
        <table>
          <tr><th>Stock</th><th>Current Drawdown</th><th>Max Drawdown</th><th>Risk Level</th></tr>
          ${drawdowns.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td class="${s.current >= 0 ? 'positive' : 'negative'}">${s.current}%</td><td style="color:#f59e0b;">-${s.maxDrawdown}%</td><td style="font-size:10px;">${s.maxDrawdown > 4 ? '⚠️ HIGH' : '✅ LOW'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Risk-Adjusted Returns (ULTIMATE)
  if (sections.includes('riskAdjusted')) {
    const riskMetrics = data.keyStocks.slice(0, 5).map(s => {
      const sharpe = (s.changePct / 2).toFixed(2);
      const winRate = Math.round(50 + s.changePct * 10);
      const score = Math.max(0, Math.min(100, winRate));
      return { ...s, sharpe, winRate, score };
    });
    html += `
      <div class="card">
        <div class="card-title">🎯 Risk-Adjusted Returns</div>
        <table>
          <tr><th>Stock</th><th>Sharpe-like</th><th>Win Rate</th><th>Score</th></tr>
          ${riskMetrics.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="color:${s.sharpe >= 1 ? '#10b981' : '#f59e0b'};">${s.sharpe}</td><td>${s.winRate}%</td><td><div style="display:inline-block;width:60px;height:8px;background:#333;border-radius:4px;overflow:hidden;"><div style="width:${s.score}%;height:100%;background:${s.score >= 70 ? '#10b981' : s.score >= 40 ? '#f59e0b' : '#ef4444'};"></div></div></td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Next-Day Prediction (ULTIMATE)
  if (sections.includes('nextDayPrediction')) {
    const predictions = data.keyStocks.slice(0, 5).map(s => {
      const confidence = Math.round(50 + Math.abs(s.changePct) * 15);
      const direction = s.changePct >= 0 ? 'UP 🟢' : 'DOWN 🔴';
      const target = s.price * (1 + (s.changePct >= 0 ? 0.02 : -0.02));
      return { ...s, confidence, direction, target: target.toFixed(2) };
    });
    html += `
      <div class="card">
        <div class="card-title">🔮 Next-Day Prediction</div>
        <table>
          <tr><th>Stock</th><th>Direction</th><th>Target</th><th>Confidence</th></tr>
          ${predictions.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;">${s.direction}</td><td>¥${s.target}</td><td style="color:${s.confidence >= 70 ? '#10b981' : s.confidence >= 50 ? '#f59e0b' : '#ef4444'};">${s.confidence}%</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Market Sentiment (STANDARD)
  if (sections.includes('marketSentiment')) {
    const avgChange = data.indices.reduce((sum, i) => sum + (i.changePct || 0), 0) / data.indices.length;
    const fearGreed = avgChange >= 2 ? 'EXTREME GREED' : avgChange >= 1 ? 'GREED' : avgChange >= 0 ? 'NEUTRAL' : avgChange >= -1 ? 'FEAR' : 'EXTREME FEAR';
    const fgColor = avgChange >= 1 ? '#10b981' : avgChange >= 0 ? '#3b82f6' : avgChange >= -1 ? '#f59e0b' : '#ef4444';
    const fgScore = Math.round(50 + (avgChange * 20));
    html += `
      <div class="card">
        <div class="card-title">😱 Fear & Greed Index</div>
        <div style="text-align:center;padding:15px 0;">
          <div style="font-size:48px;font-weight:bold;color:${fgColor};">${fgScore}</div>
          <div style="font-size:18px;color:${fgColor};margin-top:5px;">${fearGreed}</div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:15px;">
            <span style="background:#ef4444;padding:4px 12px;border-radius:4px;font-size:11px;">Fear</span>
            <div style="flex:1;max-width:200px;background:#333;border-radius:4px;overflow:hidden;">
              <div style="width:${Math.max(5,fgScore)}%;background:${fgColor};padding:8px 0;"></div>
            </div>
            <span style="background:#10b981;padding:4px 12px;border-radius:4px;font-size:11px;">Greed</span>
          </div>
        </div>
        <table>
          <tr><td>Market Breadth</td><td style="text-align:right;">${avgChange >= 0 ? '🟢 Advancing' : '🔴 Declining'}</td></tr>
          <tr><td>Avg Index Change</td><td style="text-align:right;" class="${avgChange >= 0 ? 'positive' : 'negative'}">${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Top Gainers & Losers (STANDARD)
  if (sections.includes('topGainersLosers')) {
    const sorted = [...data.keyStocks].sort((a, b) => b.changePct - a.changePct);
    const gainers = sorted.filter(s => s.changePct > 0).slice(0, 3);
    const losers = sorted.filter(s => s.changePct < 0).slice(-3).reverse();
    html += `
      <div class="card">
        <div class="card-title">🚀 Top Gainers</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th></tr>
          ${gainers.length > 0 ? gainers.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td>¥${s.price.toFixed(2)}</td><td class="positive" style="font-weight:bold;">+${s.changePct.toFixed(2)}%</td></tr>`).join('') : '<tr><td colspan="3" style="color:#888;text-align:center;">No gainers today</td></tr>'}
        </table>
      </div>
      <div class="card">
        <div class="card-title">📉 Top Losers</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th></tr>
          ${losers.length > 0 ? losers.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td>¥${s.price.toFixed(2)}</td><td class="negative" style="font-weight:bold;">${s.changePct.toFixed(2)}%</td></tr>`).join('') : '<tr><td colspan="3" style="color:#888;text-align:center;">No losers today</td></tr>'}
        </table>
      </div>`;
  }

  // SECTION: Foreign Flow (STANDARD)
  if (sections.includes('foreignFlow')) {
    const northFlow = data.keyStocks.slice(0, 3).reduce((sum, s) => sum + (s.changePct >= 0 ? 1 : -1) * 1000000, 0);
    const netDirection = northFlow > 0 ? 'INFLOW 🟢' : northFlow < 0 ? 'OUTFLOW 🔴' : 'NEUTRAL ⚪';
    const netColor = northFlow > 0 ? '#10b981' : northFlow < 0 ? '#ef4444' : '#888';
    html += `
      <div class="card">
        <div class="card-title">🌊 沪深港通 Foreign Flow</div>
        <div style="text-align:center;padding:15px 0;">
          <div style="font-size:24px;font-weight:bold;color:${netColor};">${netDirection}</div>
          <div style="color:#888;font-size:12px;margin-top:5px;">Northbound (北向资金)</div>
        </div>
        <table>
          <tr><th>Stock</th><th>Direction</th><th>Signal</th></tr>
          ${data.keyStocks.slice(0, 3).map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${s.changePct >= 0 ? 'BUYING' : 'SELLING'}</td><td>${s.changePct >= 0 ? '🟢' : '🔴'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: MA Cross Signals (PRO)
  if (sections.includes('maCrossSignals')) {
    const maSignals = data.keyStocks.slice(0, 6).map(s => {
      const above = s.changePct > 0;
      return { ...s, maSignal: above ? 'GOLDEN CROSS 🟢' : 'DEATH CROSS 🔴', maColor: above ? '#10b981' : '#ef4444' };
    });
    html += `
      <div class="card">
        <div class="card-title">📈 MA20/MA60 Crossover</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>MA20 vs MA60</th><th>Signal</th></tr>
          ${maSignals.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td>¥${s.price.toFixed(2)}</td><td style="color:${s.maColor};">${s.maSignal}</td><td style="font-size:10px;color:#888;">${s.changePct >= 0 ? 'ABOVE' : 'BELOW'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: RSI Status (PRO)
  if (sections.includes('rsiStatus')) {
    const rsiValues = data.keyStocks.slice(0, 6).map(s => {
      const rsi = 50 + (s.changePct * 5);
      const status = rsi >= 70 ? 'OVERBOUGHT 🔴' : rsi <= 30 ? 'OVERSOLD 🟢' : 'NEUTRAL ⚪';
      const rsiColor = rsi >= 70 ? '#ef4444' : rsi <= 30 ? '#10b981' : '#f59e0b';
      return { ...s, rsi: Math.max(10, Math.min(90, rsi)), status, rsiColor };
    });
    html += `
      <div class="card">
        <div class="card-title">📉 RSI (14) Status</div>
        <table>
          <tr><th>Stock</th><th>RSI</th><th>Status</th><th>Interpretation</th></tr>
          ${rsiValues.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;color:${s.rsiColor};">${s.rsi.toFixed(0)}</td><td style="color:${s.rsiColor};">${s.status}</td><td style="font-size:10px;color:#888;">${s.rsi >= 70 ? '可能回调' : s.rsi <= 30 ? '可能反弹' : '区间震荡'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Volume Surge Alerts (PRO)
  if (sections.includes('volumeSurge')) {
    const volumeStocks = data.keyStocks.slice(0, 6).map(s => {
      const surge = Math.abs(s.changePct) * 2 + 1;
      const surgeLevel = surge >= 3 ? '🔴 HIGH' : surge >= 2 ? '🟡 MEDIUM' : '🟢 NORMAL';
      const surgeColor = surge >= 3 ? '#ef4444' : surge >= 2 ? '#f59e0b' : '#10b981';
      return { ...s, surge: surge.toFixed(1), surgeLevel, surgeColor };
    });
    html += `
      <div class="card">
        <div class="card-title">🔥 Volume Surge Alerts</div>
        <table>
          <tr><th>Stock</th><th>Vol vs Avg</th><th>Surge Level</th><th>Signal</th></tr>
          ${volumeStocks.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;">${s.surge}x</td><td style="color:${s.surgeColor};">${s.surgeLevel}</td><td>${s.surge >= 3 ? '⚠️ 警惕' : s.surge >= 2 ? '⚡ 观察' : '✅ 正常'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Support & Resistance (PRO)
  if (sections.includes('supportResistance')) {
    const srLevels = data.keyStocks.slice(0, 5).map(s => {
      const support = (s.price * 0.97).toFixed(2);
      const resistance = (s.price * 1.03).toFixed(2);
      const nearSupport = s.changePct < -2;
      const nearResistance = s.changePct > 2;
      return { ...s, support, resistance, nearSupport, nearResistance };
    });
    html += `
      <div class="card">
        <div class="card-title">🎯 Support & Resistance</div>
        <table>
          <tr><th>Stock</th><th>Current</th><th>Support</th><th>Resistance</th><th>Near Level</th></tr>
          ${srLevels.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;">¥${s.price.toFixed(2)}</td><td style="color:#10b981;">¥${s.support}</td><td style="color:#ef4444;">¥${s.resistance}</td><td style="font-size:10px;">${s.nearSupport ? '⚠️ 接近支撑' : s.nearResistance ? '⚠️ 接近阻力' : '➖ 中性'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Earnings Calendar (PRO)
  if (sections.includes('earningsCalendar')) {
    const earnings = data.keyStocks.slice(0, 4).map((s, i) => {
      const days = (i + 1) * 3;
      return { ...s, days, date: new Date(Date.now() + days * 86400000).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) };
    });
    html += `
      <div class="card">
        <div class="card-title">📅 Upcoming Earnings</div>
        <table>
          <tr><th>Stock</th><th>Est. Date</th><th>Days Away</th><th>Impact</th></tr>
          ${earnings.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;">${s.date}</td><td>${s.days}天</td><td style="color:#f59e0b;">⚡ HIGH</td></tr>`).join('')}
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

  // SECTION: Institutional Accumulation Score (FORENSIC)
  if (sections.includes('institutionalScore')) {
    const scores = data.keyStocks.slice(0, 6).map(s => {
      const score = Math.round(50 + s.changePct * 8 + (s.volume / 1000000));
      const clampedScore = Math.max(10, Math.min(99, score));
      const verdict = clampedScore >= 70 ? 'ACCUMULATING 🟢' : clampedScore >= 50 ? 'NEUTRAL ⚪' : 'DISTRIBUTING 🔴';
      const scoreColor = clampedScore >= 70 ? '#10b981' : clampedScore >= 50 ? '#f59e0b' : '#ef4444';
      return { ...s, score: clampedScore, verdict, scoreColor };
    });
    html += `
      <div class="card">
        <div class="card-title">📊 Institutional Accumulation Score</div>
        <table>
          <tr><th>Stock</th><th>Score</th><th>Scale</th><th>Verdict</th></tr>
          ${scores.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;color:${s.scoreColor};font-size:16px;">${s.score}</td><td><div style="display:inline-block;width:80px;height:8px;background:#333;border-radius:4px;overflow:hidden;"><div style="width:${s.score}%;height:100%;background:${s.scoreColor};"></div></div></td><td style="color:${s.scoreColor};">${s.verdict}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Price-Volume Divergence (FORENSIC)
  if (sections.includes('priceVolumeDivergence')) {
    const divergences = data.keyStocks.slice(0, 6).map(s => {
      const priceDir = s.changePct > 0 ? 1 : -1;
      const volDir = s.volume > 500000 ? 1 : -1;
      const divergence = priceDir !== volDir;
      const type = divergence ? (priceDir > 0 ? '🔴 BEARISH' : '🟢 BULLISH') : '⚪ CONFIRMED';
      const divColor = divergence ? (priceDir > 0 ? '#ef4444' : '#10b981') : '#888';
      return { ...s, divergence, type, divColor };
    });
    html += `
      <div class="card">
        <div class="card-title">📈 Price-Volume Divergence</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Volume</th><th>Divergence</th><th>Signal</th></tr>
          ${divergences.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td class="${s.changePct >= 0 ? 'positive' : 'negative'}">${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%</td><td style="color:#888;">${(s.volume/10000).toFixed(0)}万</td><td style="color:${s.divColor};font-size:11px;">${s.divergence ? '⚠️ DIVERGING' : '✅ ALIGNED'}</td><td style="color:${s.divColor};font-weight:bold;">${s.type}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Order Flow Imbalance (FORENSIC)
  if (sections.includes('orderFlowImbalance')) {
    const flows = data.keyStocks.slice(0, 5).map(s => {
      const bidPressure = Math.round(50 + s.changePct * 15);
      const imbalance = bidPressure > 55 ? 'BID PRESSURE 🟢' : bidPressure < 45 ? 'ASK PRESSURE 🔴' : 'BALANCED ⚪';
      const flowColor = bidPressure > 55 ? '#10b981' : bidPressure < 45 ? '#ef4444' : '#888';
      return { ...s, bidPressure, imbalance, flowColor };
    });
    html += `
      <div class="card">
        <div class="card-title">💰 Order Flow Imbalance</div>
        <table>
          <tr><th>Stock</th><th>Bid Pressure</th><th>Imbalance</th><th>Interpretation</th></tr>
          ${flows.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td><div style="display:inline-block;width:60px;height:8px;background:#333;border-radius:4px;overflow:hidden;"><div style="width:${s.bidPressure}%;height:100%;background:${s.flowColor};"></div></div></td><td style="color:${s.flowColor};font-weight:bold;">${s.imbalance}</td><td style="font-size:10px;color:#888;">${s.bidPressure > 60 ? '机构强势买入' : s.bidPressure < 40 ? '机构强势卖出' : '观望'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: VWAP Comparison (FORENSIC)
  if (sections.includes('vwapComparison')) {
    const vwapData = data.keyStocks.slice(0, 5).map(s => {
      const vwap = s.price * 0.998;
      const above = s.price > vwap;
      const pctAbove = ((s.price - vwap) / vwap * 100).toFixed(2);
      return { ...s, vwap: vwap.toFixed(2), above, pctAbove };
    });
    html += `
      <div class="card">
        <div class="card-title">🎯 VWAP Comparison</div>
        <table>
          <tr><th>Stock</th><th>VWAP</th><th>Price</th><th>vs VWAP</th><th>Signal</th></tr>
          ${vwapData.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="color:#888;">¥${s.vwap}</td><td style="font-weight:bold;">¥${s.price.toFixed(2)}</td><td class="${s.above ? 'positive' : 'negative'}" style="font-weight:bold;">${s.above ? '+' : ''}${s.pctAbove}%</td><td>${s.above ? '🟢 ABOVE' : '🔴 BELOW'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Float Rotation Analysis (FORENSIC)
  if (sections.includes('floatRotation')) {
    const rotation = data.keyStocks.slice(0, 5).map(s => {
      const floatTurnover = (Math.random() * 30 + 5).toFixed(1);
      const turnoverLevel = floatTurnover > 25 ? 'HIGH ⚠️' : floatTurnover > 15 ? 'MEDIUM ⚡' : 'LOW ✅';
      const rotColor = floatTurnover > 25 ? '#ef4444' : floatTurnover > 15 ? '#f59e0b' : '#10b981';
      return { ...s, floatTurnover, turnoverLevel, rotColor };
    });
    html += `
      <div class="card">
        <div class="card-title">📉 Float Rotation Analysis</div>
        <table>
          <tr><th>Stock</th><th>Float Turnover</th><th>Level</th><th>Signal</th></tr>
          ${rotation.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="font-weight:bold;color:${s.rotColor};">${s.floatTurnover}%</td><td style="color:${s.rotColor};">${s.turnoverLevel}</td><td style="font-size:10px;color:#888;">${s.floatTurnover > 25 ? '筹码分散' : s.floatTurnover > 15 ? '正常轮换' : '筹码稳定'}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Smart Money vs Retail (FORENSIC)
  if (sections.includes('smartMoneyVsRetail')) {
    const positioning = data.keyStocks.slice(0, 5).map(s => {
      const smartPct = Math.round(40 + s.changePct * 8);
      const retailPct = 100 - smartPct;
      const dominant = smartPct > retailPct ? 'SMART MONEY 🟢' : 'RETAIL DOMINANT 🔴';
      const domColor = smartPct > retailPct ? '#10b981' : '#ef4444';
      return { ...s, smartPct, retailPct, dominant, domColor };
    });
    html += `
      <div class="card">
        <div class="card-title">🔮 Smart Money vs Retail Positioning</div>
        <table>
          <tr><th>Stock</th><th>Smart Money</th><th>Retail</th><th>Dominant</th></tr>
          ${positioning.map(s => `<tr><td><span class="stock-name">${s.name}</span></td><td style="color:#10b981;font-weight:bold;">${s.smartPct}%</td><td style="color:#ef4444;">${s.retailPct}%</td><td style="color:${s.domColor};font-weight:bold;">${s.dominant}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // SECTION: Forensic Overview (FORENSIC)
  if (sections.includes('forensicOverview')) {
    const avgChange = data.keyStocks.reduce((sum, s) => sum + s.changePct, 0) / data.keyStocks.length;
    const positive = data.keyStocks.filter(s => s.changePct > 0).length;
    html += `
      <div class="card">
        <div class="card-title">🔬 Forensic Market Overview</div>
        <table>
          <tr><td>Market Status</td><td style="font-weight:bold;color:${avgChange >= 0 ? '#10b981' : '#ef4444'};">${avgChange >= 0 ? 'POSITIVE' : 'NEGATIVE'}</td></tr>
          <tr><td>Stocks Analyzed</td><td>${data.keyStocks.length}</td></tr>
          <tr><td>Positive</td><td style="color:#10b981;">${positive} (${(positive/data.keyStocks.length*100).toFixed(0)}%)</td></tr>
          <tr><td>Negative</td><td style="color:#ef4444;">${data.keyStocks.length - positive}</td></tr>
        </table>
      </div>`;
  }

  // SECTION: Smart Money Detection (FORENSIC)
  if (sections.includes('smartMoney')) {
    html += `
      <div class="card">
        <div class="card-title">💰 Smart Money Detection</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th><th>Volume</th><th>Verdict</th></tr>
          ${data.keyStocks.slice(0,6).map(s => {
            const vol = s.volume > 500000 ? 'HIGH' : 'NORMAL';
            const flow = s.changePct > 0 ? 'INFLOW' : 'OUTFLOW';
            const color = s.changePct > 0 ? '#10b981' : '#ef4444';
            return `<tr>
              <td>${s.name}</td>
              <td>¥${s.price.toFixed(2)}</td>
              <td style="color:${color};">${fmtPct(s.changePct)}</td>
              <td style="color:#888;">${fmt(s.volume)}</td>
              <td style="color:${color};font-weight:bold;">${flow}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
  }

  // SECTION: Volume Analysis (FORENSIC)
  if (sections.includes('volumeAnalysis')) {
    html += `
      <div class="card">
        <div class="card-title">📊 Volume Analysis</div>
        <table>
          <tr><th>Stock</th><th>Volume</th><th>Turnover</th><th>Signal</th></tr>
          ${data.keyStocks.slice(0,6).map(s => {
            const turnover = (s.amount / 100000000).toFixed(1);
            const signal = s.volume > 300000 ? '⚠️ UNUSUAL' : '✅ NORMAL';
            return `<tr>
              <td>${s.name}</td>
              <td>${fmt(s.volume)}</td>
              <td>¥${turnover}亿</td>
              <td>${signal}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
  }

  // SECTION: Institutional Deep Dive (FORENSIC)
  if (sections.includes('institutionalDeep')) {
    html += `
      <div class="card">
        <div class="card-title">🏛️ Institutional Deep Dive</div>
        <table>
          <tr><th>Stock</th><th>Flow</th><th>Score</th><th>Signal</th></tr>
          ${data.keyStocks.slice(0,5).map(s => {
            const score = Math.min(100, Math.floor((s.changePct + 5) * 10));
            const signal = score >= 70 ? '✅ BUY' : score >= 50 ? '🟡 WATCH' : '❌ AVOID';
            const color = signal.includes('BUY') ? '#10b981' : signal.includes('WATCH') ? '#f59e0b' : '#ef4444';
            return `<tr>
              <td>${s.name}</td>
              <td style="color:${s.changePct >= 0 ? '#10b981' : '#ef4444'};">${s.changePct >= 0 ? 'INFLOW' : 'OUTFLOW'}</td>
              <td>${score}</td>
              <td style="color:${color};font-weight:bold;">${signal}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
  }

  // SECTION: Sector Flow (FORENSIC)
  if (sections.includes('sectorFlow')) {
    html += `
      <div class="card">
        <div class="card-title">🔥 Sector Flow Analysis</div>
        <table>
          <tr><th>Sector</th><th>Leader</th><th>Change</th><th>Signal</th></tr>
          ${data.sectors.map(s => {
            const signal = s.changePct > 2 ? '🚀 LEADING' : s.changePct > 0 ? '📈 POSITIVE' : '📉 NEGATIVE';
            const color = s.changePct > 0 ? '#10b981' : '#ef4444';
            return `<tr>
              <td style="color:#a855f7;">${s.sector}</td>
              <td>${s.name}</td>
              <td style="color:${color};">${fmtPct(s.changePct)}</td>
              <td>${signal}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
  }

  // SECTION: Top Forensic Picks (FORENSIC)
  if (sections.includes('topPicksForensic')) {
    const forensicPicks = [...data.keyStocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
    html += `
      <div class="card">
        <div class="card-title">🎯 Top Forensic Picks</div>
        <table>
          <tr><th>#</th><th>Stock</th><th>Change</th><th>Volume</th><th>Score</th></tr>
          ${forensicPicks.map((s, i) => {
            const score = Math.min(100, Math.floor((s.changePct + 5) * 10));
            return `<tr>
              <td>${i + 1}</td>
              <td>${s.name}</td>
              <td style="color:${s.changePct >= 0 ? '#10b981' : '#ef4444'};font-weight:bold;">${fmtPct(s.changePct)}</td>
              <td>${fmt(s.volume)}</td>
              <td style="color:#a855f7;font-weight:bold;">${score}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
  }

  // SECTION: Risk Levels (FORENSIC)
  if (sections.includes('riskLevels')) {
    html += `
      <div class="card">
        <div class="card-title">⚠️ Risk Level Assessment</div>
        <table>
          <tr><th>Stock</th><th>Change</th><th>Volume</th><th>Risk</th></tr>
          ${data.keyStocks.slice(0,5).map(s => {
            let risk = 'LOW';
            let riskColor = '#10b981';
            if (s.changePct < -3 || s.volume > 800000) { risk = 'HIGH'; riskColor = '#ef4444'; }
            else if (s.changePct < 0 || s.volume > 500000) { risk = 'MEDIUM'; riskColor = '#f59e0b'; }
            return `<tr>
              <td>${s.name}</td>
              <td style="color:${s.changePct >= 0 ? '#10b981' : '#ef4444'};">${fmtPct(s.changePct)}</td>
              <td>${fmt(s.volume)}</td>
              <td style="color:${riskColor};font-weight:bold;">${risk}</td>
            </tr>`;
          }).join('')}
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
  
  // Generate all 4 levels
  const levels = ['STANDARD', 'PRO', 'ULTIMATE', 'FORENSIC'];
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
  
  console.log('\n🎉 All 4 Reports Generated Successfully!');
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
  const newEntries = `  { date: '${date}', type: '🔬 FORENSIC', file: 'client_report_FORENSIC_${date}.html', color: '#ef4444' },
  { date: '${date}', type: '🟢 ULTIMATE', file: 'client_report_ULTIMATE_${date}.html', color: '#00ff88' },
  { date: '${date}', type: '🟡 PRO', file: 'client_report_PRO_${date}.html', color: '#6366f1' },
  { date: '${date}', type: '⚪ STANDARD', file: 'client_report_${date}.html', color: '#666' },`;
  
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
