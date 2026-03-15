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

// Main
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🚀 AUTO DAILY REPORT GENERATOR V2');
  console.log('═══════════════════════════════════════');
  console.log(`📅 Date: ${DATE}`);
  console.log(`🕐 Time: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`📅 Day: ${DAY_NAMES[DAY]}`);
  console.log(`📊 Mode: ${IS_WEEKEND ? '📅 Weekend (Last trading day data)' : '🔴 LIVE'}`);
  console.log('═══════════════════════════════════════\n');
  
  const data = await fetchAllData();
  const html = generateHTML(data);
  
  // Save files
  const htmlFile = `${REPORT_DIR}client_report_ULTIMATE_${DATE}.html`;
  fs.writeFileSync(htmlFile, html);
  console.log('✅ Saved:', htmlFile);
  
  // Also save JSON for debugging
  const jsonFile = `${REPORT_DIR}daily_summary_${DATE}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
  console.log('✅ Saved:', jsonFile);
  
  console.log('\n🎉 Report Generated Successfully!');
  return htmlFile;
}

main().catch(console.error);
