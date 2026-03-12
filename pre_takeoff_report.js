/**
 * PRE-TAKEOFF DAILY REPORT GENERATOR
 * ==================================
 * Generates Excel report of Pre-Takeoff screening results
 * Run at end of day: node pre_takeoff_report.js
 * 
 * Output: daily_pre_takeoff_report_YYYY-MM-DD.xlsx
 */

const http = require('http');
const fs = require('fs');

// Configuration
const OUTPUT_DIR = './daily_reports';
const DATE = new Date().toISOString().split('T')[0];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Stocks to screen
const SCREEN_LIST = [
  // BSE Hidden Gems
  { code: 'bj870299', name: '灿能电力', sector: '电力' },
  { code: 'bj872926', name: '贝特瑞', sector: '新能源' },
  { code: 'bj835670', name: '数字人', sector: 'AI教育' },
  { code: 'bj871047', name: '国科科技', sector: '钢铁' },
  
  // ChiNext Small Cap
  { code: 'sz002340', name: '格林美', sector: '新能源' },
  { code: 'sz000630', name: '铜陵有色', sector: '有色金属' },
  { code: 'sz002155', name: '湖南黄金', sector: '黄金' },
  { code: 'sz300123', name: '亚光科技', sector: '科技' },
  { code: 'sz300140', name: '中环装备', sector: '环保' },
  
  // Power Sector
  { code: 'sh600025', name: '华能国际', sector: '电力' },
  { code: 'sh600011', name: '华能国际', sector: '电力' },
  { code: 'sh600795', name: '鹏华资产', sector: '电力' },
  
  // Key Metals
  { code: 'sh601899', name: '紫金矿业', sector: '黄金' },
  { code: 'sh600489', name: '中金黄金', sector: '黄金' },
  { code: 'sh600362', name: '江西铜业', sector: '铜业' },
  
  // Tech Leaders
  { code: 'sz300476', name: '中际旭创', sector: '科技' },
  { code: 'sz300033', name: '同花顺', sector: '科技' },
  
  //新能源
  { code: 'sz002594', name: '比亚迪', sector: '新能源' },
  { code: 'sz300750', name: '宁德时代', sector: '新能源' },
];

// Our portfolio entries
const OUR_ENTRIES = {
  '灿能电力': 8.99,
  '格林美': 9.08,
  '铜陵有色': 7.28,
  '贝特瑞': 68.00,
  '中际旭创': 178.96,
  '数字人': 29.14,
  '吉林碳谷': 43.80,
  '隆基绿能': 28.66
};

// Scoring function
function calculateScore(stock) {
  let score = 0;
  
  // Price score (small cap < 30)
  if (stock.price >= 5 && stock.price <= 30) score += 20;
  
  // Change score (sweet spot 3-15%)
  if (stock.change > 0 && stock.change <= 15) score += 25;
  if (stock.change >= 3 && stock.change <= 10) score += 10;
  
  // Volume score
  if (stock.volume > 100000) score += 15;
  if (stock.volume > 500000) score += 10;
  
  // Sector score
  if (stock.sector === '电力' || stock.sector === '有色金属') score += 25;
  else if (stock.sector === '新能源' || stock.sector === '黄金') score += 15;
  
  return score;
}

// Main function
async function runScreening() {
  console.log('🎯 PRE-TAKEOFF DAILY REPORT');
  console.log('============================');
  console.log(`Date: ${DATE}`);
  console.log('');
  
  let results = [];
  let done = 0;
  
  return new Promise((resolve) => {
    SCREEN_LIST.forEach(stock => {
      const url = 'http://qt.gtimg.cn/q=' + stock.code;
      http.get(url, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const match = data.match(/\"([^\"]+)\"/);
            if (match) {
              const p = match[1].split('~');
              stock.price = parseFloat(p[3]);
              stock.change = parseFloat(p[4]);
              stock.volume = parseInt(p[5] || 0);
              stock.score = calculateScore(stock);
              
              // Our position?
              if (OUR_ENTRIES[stock.name]) {
                stock.ourEntry = OUR_ENTRIES[stock.name];
                stock.pnl = ((stock.price - stock.ourEntry) / stock.ourEntry * 100).toFixed(2);
                stock.position = 'OUR POSITION';
              } else {
                stock.position = 'WATCH';
              }
              
              results.push(stock);
            }
          } catch(e) {}
          done++;
          if (done === SCREEN_LIST.length) {
            resolve(results);
          }
        });
      });
    });
    
    // Timeout after 10 seconds
    setTimeout(() => resolve(results), 10000);
  });
}

// Generate HTML Report
function generateHTMLReport(results) {
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pre-Takeoff Report ${DATE}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a2e; color: #fff; }
    h1 { color: #00ff88; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
    th { background: #16213e; color: #00ff88; }
    .buy { color: #00ff88; }
    .watch { color: #ffaa00; }
    .avoid { color: #ff4444; }
    .positive { color: #00ff88; }
    .negative { color: #ff4444; }
    .our-position { background: #1a3a2e; }
    .score-high { color: #00ff88; font-weight: bold; }
    .score-mid { color: #ffaa00; }
    .score-low { color: #ff4444; }
    .summary { display: flex; gap: 30px; margin: 20px 0; }
    .summary-box { background: #16213e; padding: 20px; border-radius: 10px; }
    .summary-box h3 { margin: 0 0 10px 0; color: #00ff88; }
  </style>
</head>
<body>
  <h1>🎯 Pre-Takeoff Daily Report</h1>
  <p>Date: ${DATE} | Generated: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <div class="summary-box">
      <h3>📊 Summary</h3>
      <p>Total Screened: ${results.length}</p>
      <p>Buy Signals: ${results.filter(r => r.score >= 80).length}</p>
      <p>Watch: ${results.filter(r => r.score >= 60 && r.score < 80).length}</p>
    </div>
    <div class="summary-box">
      <h3>💰 Our Positions</h3>
      ${results.filter(r => r.position === 'OUR POSITION').map(r => `
        <p>${r.name}: ${r.pnl}%</p>
      `).join('')}
    </div>
  </div>
  
  <h2>📈 Full Screening Results</h2>
  <table>
    <tr>
      <th>Signal</th>
      <th>Stock</th>
      <th>Sector</th>
      <th>Price</th>
      <th>Change</th>
      <th>Volume</th>
      <th>Score</th>
      <th>Status</th>
    </tr>
    ${results.map(r => {
      const signal = r.score >= 80 ? '🚀' : r.score >= 60 ? '👀' : '⏳';
      const scoreClass = r.score >= 80 ? 'score-high' : r.score >= 60 ? 'score-mid' : 'score-low';
      const rowClass = r.position === 'OUR POSITION' ? 'our-position' : '';
      return `<tr class="${rowClass}">
        <td>${signal}</td>
        <td>${r.name}</td>
        <td>${r.sector}</td>
        <td>¥${r.price}</td>
        <td class="${r.change >= 0 ? 'positive' : 'negative'}">${r.change}%</td>
        <td>${Math.round(r.volume/10000)}万</td>
        <td class="${scoreClass}">${r.score}</td>
        <td>${r.position}</td>
      </tr>`;
    }).join('')}
  </table>
  
  <h2>🎯 Sector Analysis</h2>
  <table>
    <tr>
      <th>Sector</th>
      <th>Avg Change</th>
      <th>Stocks</th>
      <th>Verdict</th>
    </tr>
    ${Object.entries(
      results.reduce((acc, r) => {
        if (!acc[r.sector]) acc[r.sector] = { change: 0, count: 0 };
        acc[r.sector].change += r.change;
        acc[r.sector].count++;
        return acc;
      }, {})
    ).map(([sector, data]) => {
      const avg = (data.change / data.count).toFixed(2);
      const verdict = avg > 5 ? '🔥 HOT' : avg > 0 ? '📈 UP' : '↔️ WEAK';
      return `<tr>
        <td>${sector}</td>
        <td>${avg}%</td>
        <td>${data.count}</td>
        <td>${verdict}</td>
      </tr>`;
    }).join('')}
  </table>
  
  <footer style="margin-top: 30px; color: #666;">
    Generated by Charles's Super Brain - Pre-Takeoff Screening System
  </footer>
</body>
</html>`;
  
  return html;
}

// Main execution
(async () => {
  try {
    const results = await runScreening();
    
    // Generate report
    const html = generateHTMLReport(results);
    const filename = `${OUTPUT_DIR}/pre_takeoff_report_${DATE}.html`;
    
    fs.writeFileSync(filename, html);
    console.log('');
    console.log('✅ Report saved:', filename);
  
  // Also save CSV
  const csv = [
    ['Signal', 'Stock', 'Sector', 'Price', 'Change', 'Volume', 'Score', 'Our Entry', 'PnL', 'Status'].join(','),
    ...results.map(r => [
      r.score >= 80 ? 'BUY' : r.score >= 60 ? 'WATCH' : 'WAIT',
      r.name,
      r.sector,
      r.price,
      r.change,
      r.volume,
      r.score,
      r.ourEntry || '',
      r.pnl || '',
      r.position
    ].join(','))
  ].join('\n');
  
  const csvFilename = `${OUTPUT_DIR}/pre_takeoff_report_${DATE}.csv`;
  fs.writeFileSync(csvFilename, '\ufeff' + csv); // BOM for Excel
  console.log('✅ CSV saved:', csvFilename);
  
  console.log('');
  console.log('📊 TOP PICKS:');
  results.filter(r => r.score >= 80).forEach(r => {
    console.log(`  🚀 ${r.name} (${r.sector}) - Score: ${r.score}`);
  });
  
  console.log('');
  console.log('💰 OUR POSITIONS:');
  results.filter(r => r.position === 'OUR POSITION').forEach(r => {
    const emoji = parseFloat(r.pnl) >= 0 ? '🟢' : '🔴';
    console.log(`  ${emoji} ${r.name}: Entry ¥${r.ourEntry} → ¥${r.price} (${r.pnl}%)`);
  });
})();
