/**
 * AUTO DAILY REPORT GENERATOR
 * Generates live market report with real-time data
 * Run: node auto_daily_report.js
 */

const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');

const REPORT_DIR = './daily_reports/';
const DATE = new Date().toISOString().slice(0,10);

// Stock database
const STOCKS = {
  // Major Indices
  indices: [
    { code: 'sh000001', name: '上证指数', type: 'index' },
    { code: 'sz399001', name: '深证成指', type: 'index' },
    { code: 'sh000300', name: '沪深300', type: 'index' },
    { code: 'sz399006', name: '创业板指', type: 'index' },
  ],
  // Key Stocks
  keyStocks: [
    { code: 'sh600519', name: '贵州茅台' },
    { code: 'sz000858', name: '五粮液' },
    { code: 'sz002594', name: '比亚迪' },
    { code: 'sh600036', name: '招商银行' },
    { code: 'sh601012', name: '隆基绿能' },
    { code: 'sz000333', name: '美的集团' },
    { code: 'sz000651', name: '格力电器' },
    { code: 'sh600276', name: '恒瑞医药' },
    { code: 'hk00700', name: '腾讯控股' },
    { code: 'hk09988', name: '阿里巴巴' },
  ],
  // Portfolio Holdings (from Super Brain V3)
  portfolio: [
    { code: 'sh600036', name: '招商银行', entry: 38.72, shares: 100 },
    { code: 'sh600030', name: '中信证券', entry: 27.16, shares: 100 },
    { code: 'sz000999', name: '华润三九', entry: 29.39, shares: 100 },
  ],
  // Sector Leaders
  sectors: [
    { code: 'sh600011', name: '华能国际', sector: '电力' },
    { code: 'sh600795', name: '北方华创', sector: '半导体' },
    { code: 'sz002476', name: '华鲁恒升', sector: '化工' },
    { code: 'sh600547', name: '山东黄金', sector: '黄金' },
    { code: 'sz002371', name: '北方华创', sector: '半导体' },
  ]
};

// Fetch quote from Tencent API (GBK encoding -> UTF-8)
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
            resolve({
              name: p[1] || '',
              price: parseFloat(p[3]) || 0,
              change: parseFloat(p[4]) || 0,
              volume: parseInt(p[5]) || 0,
              amount: parseInt(p[6]) || 0,
              high: parseFloat(p[33]) || 0,
              low: parseFloat(p[34]) || 0,
              open: parseFloat(p[5]) || 0,
              close: parseFloat(p[3]) || 0,
            });
          } else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Fetch all quotes
async function fetchAllData() {
  console.log('📡 Fetching live market data...');
  
  let data = { indices: [], keyStocks: [], portfolio: [], sectors: [] };
  
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
  
  // Portfolio
  for (const s of STOCKS.portfolio) {
    const q = await getQuote(s.code);
    if (q) {
      const pnl = (q.price - s.entry) * s.shares;
      const pnlPct = ((q.price - s.entry) / s.entry * 100);
      data.portfolio.push({ ...s, current: q.price, pnl, pnlPct, change: q.change });
    }
  }
  
  // Sectors
  for (const s of STOCKS.sectors) {
    const q = await getQuote(s.code);
    if (q) data.sectors.push({ ...s, ...q });
  }
  
  return data;
}

// Generate HTML Report
function generateHTML(data) {
  const totalPnl = data.portfolio.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = data.portfolio.reduce((sum, p) => sum + (p.current * p.shares), 0);
  const totalInvested = data.portfolio.reduce((sum, p) => sum + (p.entry * p.shares), 0);
  const pnlPct = ((totalValue - totalInvested) / totalInvested * 100);
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daily Report - ${DATE}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; padding: 20px; color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; margin-bottom: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .card-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #a855f7; display: flex; align-items: center; gap: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #888; font-weight: 500; }
    .positive { color: #00ff88; }
    .negative { color: #ff4444; }
    .stock-code { color: #6366f1; font-weight: bold; }
    .stock-name { color: #ccc; }
    .section-title { font-size: 20px; font-weight: bold; margin: 30px 0 15px; color: #fff; }
    .pnl-card { background: ${totalPnl >= 0 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'}; }
    .market-up { color: #00ff88; }
    .market-down { color: #ff4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 CHARLES'S SUPER BRAIN DAILY REPORT</h1>
      <p>Generated: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
      <span class="badge">🤖 Auto-Generated by Super Brain V3</span>
    </div>

    <div class="grid">
      <!-- Market Indices -->
      <div class="card">
        <div class="card-title">📈 Market Indices</div>
        <table>
          <tr><th>Index</th><th>Price</th><th>Change</th></tr>
          ${data.indices.map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${i.price.toFixed(2)}</td>
              <td class="${i.change >= 0 ? 'positive' : 'negative'}">${i.change >= 0 ? '+' : ''}${i.change.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Portfolio P&L -->
      <div class="card pnl-card">
        <div class="card-title">💰 Portfolio Summary</div>
        <table>
          <tr><td>Total Value</td><td style="text-align:right;font-weight:bold;">¥${totalValue.toFixed(2)}</td></tr>
          <tr><td>Total Invested</td><td style="text-align:right;">¥${totalInvested.toFixed(2)}</td></tr>
          <tr><td>Total P&L</td><td style="text-align:right;font-weight:bold;font-size:18px;">${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toFixed(2)} (${pnlPct.toFixed(2)}%)</td></tr>
        </table>
      </div>

      <!-- Holdings -->
      <div class="card">
        <div class="card-title">📦 Holdings</div>
        <table>
          <tr><th>Stock</th><th>Entry</th><th>Current</th><th>P&L</th></tr>
          ${data.portfolio.map(p => `
            <tr>
              <td><span class="stock-code">${p.code.replace('sh','').replace('sz','')}</span> <span class="stock-name">${p.name}</span></td>
              <td>¥${p.entry.toFixed(2)}</td>
              <td>¥${p.current.toFixed(2)}</td>
              <td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}¥${p.pnl.toFixed(2)} (${p.pnlPct.toFixed(1)}%)</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Key Stocks -->
      <div class="card">
        <div class="card-title">🔥 Key Stocks</div>
        <table>
          <tr><th>Stock</th><th>Price</th><th>Change</th></tr>
          ${data.keyStocks.slice(0,6).map(s => `
            <tr>
              <td><span class="stock-code">${s.code.replace('sh','').replace('sz','').replace('hk','')}</span> <span class="stock-name">${s.name}</span></td>
              <td>¥${s.price.toFixed(2)}</td>
              <td class="${s.change >= 0 ? 'positive' : 'negative'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Sector Leaders -->
      <div class="card">
        <div class="card-title">🎯 Sector Leaders</div>
        <table>
          <tr><th>Sector</th><th>Stock</th><th>Change</th></tr>
          ${data.sectors.map(s => `
            <tr>
              <td>${s.sector}</td>
              <td>${s.name}</td>
              <td class="${s.change >= 0 ? 'positive' : 'negative'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>
    </div>

    <div style="text-align:center;padding:20px;color:#666;font-size:12px;">
      Super Brain V3 | Auto-generated Daily Report | ${DATE}
    </div>
  </div>
</body>
</html>`;

  return html;
}

// Main
async function main() {
  console.log('🚀 Generating Daily Report for', DATE);
  
  const data = await fetchAllData();
  const html = generateHTML(data);
  
  // Save files
  const htmlFile = `${REPORT_DIR}client_report_ULTIMATE_${DATE}.html`;
  const txtFile = `${REPORT_DIR}client_report_${DATE}.txt`;
  
  fs.writeFileSync(htmlFile, html);
  console.log('✅ Saved:', htmlFile);
  
  // Simple text version
  const totalPnl = data.portfolio.reduce((sum, p) => sum + p.pnl, 0);
  const txt = `CHARLES'S DAILY REPORT - ${DATE}
================================
Market: 上证 ${data.indices[0]?.price || '-'} (${data.indices[0]?.change || '-'}%)
Portfolio P&L: ${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toFixed(2)}

Holdings:
${data.portfolio.map(p => `- ${p.name}: ¥${p.current} (P&L: ${p.pnl >= 0 ? '+' : ''}¥${p.pnl.toFixed(2)})`).join('\n')}
`;
  fs.writeFileSync(txtFile, txt);
  console.log('✅ Saved:', txtFile);
  
  console.log('🎉 Daily Report Generated Successfully!');
  return htmlFile;
}

main().catch(console.error);
