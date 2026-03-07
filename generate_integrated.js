#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - INTEGRATED COMMAND CENTER
 * With Advanced Cycle Analysis & Timing
 */

const fs = require('fs');

const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const BASE_DIR = 'file://' + process.env.HOME + '/Desktop/Stock_Analysis/daily_overview/';
const TODAY = new Date().toISOString().split('T')[0];

// Advanced stock data with cycle analysis
const STOCKS = [
  { code: '835670', name: '数字人', price: 45, cycle: 'BOTTOM', cycleDay: 3, trend: 'UP', signal: 'BUY', score: 92, target: 80, stop: 38, sector: 'AI教育' },
  { code: '300476', name: '中际旭创', price: 155, cycle: 'MIDDLE', cycleDay: 15, trend: 'UP', signal: 'BUY', score: 90, target: 280, stop: 140, sector: 'AI硬件' },
  { code: '870299', name: '吉林碳谷', price: 85, cycle: 'BOTTOM', cycleDay: 5, trend: 'UP', signal: 'BUY', score: 88, target: 120, stop: 75, sector: '新材料' },
  { code: '872926', name: '贝特瑞', price: 82, cycle: 'MIDDLE', cycleDay: 20, trend: 'UP', signal: 'ACCUMULATE', score: 85, target: 180, stop: 75, sector: '新能源' },
  { code: '002594', name: '比亚迪', price: 205, cycle: 'PEAK', cycleDay: 45, trend: 'SIDE', signal: 'HOLD', score: 87, target: 300, stop: 190, sector: '新能源' },
  { code: '300750', name: '宁德时代', price: 210, cycle: 'MIDDLE', cycleDay: 30, trend: 'UP', signal: 'BUY', score: 86, target: 280, stop: 195, sector: '新能源' },
  { code: '0700', name: '腾讯控股', price: 380, cycle: 'RECOVERY', cycleDay: 10, trend: 'UP', signal: 'BUY', score: 91, target: 450, stop: 360, sector: '科技' },
  { code: '3690', name: '美团', price: 120, cycle: 'BOTTOM', cycleDay: 2, trend: 'UP', signal: 'BUY', score: 84, target: 150, stop: 110, sector: '科技' },
];

// Cycle analysis
function getCycleInfo(cycle, day) {
  const cycles = {
    'BOTTOM': { phase: '🔴 Bottom Formation', progress: day * 10, color: '#00ff88', advice: 'Start accumulating' },
    'RECOVERY': { phase: '🟢 Early Recovery', progress: day * 8, color: '#00d4ff', advice: '加速买入' },
    'MIDDLE': { phase: '🟡 Mid-Range', progress: day * 5, color: '#ffd700', advice: 'Hold, watch for signs' },
    'PEAK': { phase: '🔴 Peak Zone', progress: 100 - day * 2, color: '#ff4444', advice: 'Take profits' },
    'CORRECTION': { phase: '🔴 Correction', progress: day * 10, color: '#ff4444', advice: 'Wait for bottom' },
  };
  return cycles[cycle] || cycles['MIDDLE'];
}

// Timing analysis
function analyzeTiming(stock) {
  const cycle = getCycleInfo(stock.cycle, stock.cycleDay);
  let timing = 'WAIT';
  if (stock.cycle === 'BOTTOM' && stock.cycleDay <= 5) timing = '🔥 PERFECT ENTRY';
  else if (stock.cycle === 'RECOVERY' && stock.cycleDay <= 15) timing = '🟢 GOOD ENTRY';
  else if (stock.cycle === 'PEAK') timing = '🔴 LATE';
  else if (stock.cycle === 'CORRECTION') timing = '🟡 WAIT';
  return { ...cycle, timing };
}

function generate() {
  // Build stock rows with cycle info
  const stockRows = STOCKS.map(s => {
    const timing = analyzeTiming(s);
    return {
      ...s,
      ...timing
    };
  }).sort((a, b) => b.score - a.score);

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🧠 Charles's Super Brain - Integrated Command Center</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0a0a15 0%, #1a1a2e 100%); min-height: 100vh; color: #fff; }
.header { background: rgba(0,0,0,0.6); padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
.header h1 { font-size: 20px; background: linear-gradient(90deg, #00ff88, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.btn { background: #00ff88; border: none; color: #000; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; }
.container { max-width: 1800px; margin: 0 auto; padding: 20px; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.panel { background: rgba(255,255,255,0.03); border-radius: 15px; padding: 20px; border: 1px solid #333; }
.panel h2 { font-size: 16px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333; }
.stock-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.stock-table th { text-align: left; padding: 10px; color: #888; border-bottom: 1px solid #333; font-size: 10px; }
.stock-table td { padding: 12px 10px; border-bottom: 1px solid #222; }
.code { color: #00d4ff; font-weight: bold; }
.score { color: #00ff88; font-weight: bold; font-size: 14px; }
.signal { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
.signal.buy { background: rgba(0,255,136,0.2); color: #00ff88; }
.signal.hold { background: rgba(255,200,0,0.2); color: #ffd700; }
.signal.sell { background: rgba(255,68,68,0.2); color: #ff4444; }
.cycle-bar { height: 8px; background: #222; border-radius: 4px; overflow: hidden; margin-top: 5px; }
.cycle-fill { height: 100%; border-radius: 4px; }
.timing { font-size: 10px; font-weight: bold; }
.timing.perfect { color: #00ff88; }
.timing.good { color: #00d4ff; }
.timing.late { color: #ff4444; }
.timing.wait { color: #ffd700; }
.reports { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 20px; }
.report-link { background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 10px; padding: 15px; text-align: center; text-decoration: none; display: block; transition: all 0.3s; }
.report-link:hover { background: rgba(0,255,136,0.1); border-color: #00ff88; transform: translateY(-2px); }
.report-link .icon { font-size: 24px; display: block; margin-bottom: 5px; }
.report-link .name { color: #fff; font-size: 11px; font-weight: bold; }
.report-link .desc { color: #888; font-size: 9px; margin-top: 3px; }
.footer { text-align: center; padding: 20px; color: #666; font-size: 11px; }
</style>
</head>
<body>
<div class="header">
<h1>🧠 CHARLES'S SUPER BRAIN - INTEGRATED COMMAND CENTER</h1>
<button class="btn" onclick="location.reload()">🔄 Refresh</button>
</div>
<div class="container">
<div class="grid">
<div class="panel">
<h2>🎯 CYCLE & TIMING ANALYSIS - ENTRY SIGNALS</h2>
<table class="stock-table">
<tr><th>Code</th><th>Name</th><th>Price</th><th>Cycle Phase</th><th>Progress</th><th>Trend</th><th>Signal</th><th>Score</th><th>Target</th><th>Stop</th><th>Timing</th></tr>
${stockRows.map(s => `<tr>
<td class="code">${s.code}</td>
<td>${s.name}</td>
<td>¥${s.price}</td>
<td style="color:${s.color}">${s.phase}</td>
<td><div class="cycle-bar"><div class="cycle-fill" style="width:${Math.min(100,s.progress)}%;background:${s.color}"></div></div></td>
<td>${s.trend}</td>
<td><span class="signal ${s.signal.toLowerCase()}">${s.signal}</span></td>
<td class="score">${s.score}</td>
<td style="color:#00ff88">¥${s.target}</td>
<td style="color:#ff4444">¥${s.stop}</td>
<td class="timing ${s.timing === '🔥 PERFECT ENTRY' ? 'perfect' : s.timing === '🟢 GOOD ENTRY' ? 'good' : s.timing === '🔴 LATE' ? 'late' : 'wait'}">${s.timing}</td>
</tr>`).join('')}
</table>
</div>
<div class="panel">
<h2>📊 MARKET CYCLE INDICATORS</h2>
<div style="padding:15px">
<div style="margin-bottom:20px">
<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>🌊 Market Cycle</span><span style="color:#00ff88">RECOVERY</span></div>
<div class="cycle-bar"><div class="cycle-fill" style="width:35%;background:linear-gradient(90deg,#00ff88,#00d4ff)"></div></div>
</div>
<div style="margin-bottom:20px">
<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>📈 Trend Direction</span><span style="color:#00ff88">BULLISH</span></div>
<div class="cycle-bar"><div class="cycle-fill" style="width:70%;background:linear-gradient(90deg,#00ff88,#00d4ff)"></div></div>
</div>
<div style="margin-bottom:20px">
<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>⏰ Entry Window</span><span style="color:#00ff88">OPEN</span></div>
<div class="cycle-bar"><div class="cycle-fill" style="width:85%;background:linear-gradient(90deg,#00ff88,#00d4ff)"></div></div>
</div>
<div style="margin-bottom:20px">
<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>⚠️ Risk Level</span><span style="color:#ffd700">MODERATE</span></div>
<div class="cycle-bar"><div class="cycle-fill" style="width:45%;background:linear-gradient(90deg,#ffd700,#ff8800)"></div></div>
</div>
</div>
</div>
</div>
</div>
<div class="panel" style="margin-top:20px">
<h2>🔮 CYCLE PREDICTIONS - PEAK & BOTTOM</h2>
<table class="stock-table">
<tr><th>Stock</th><th>Current Cycle</th><th>Days to Peak</th><th>Days to Bottom</th><th>Prediction</th></tr>
${stockRows.slice(0,5).map(s => `<tr>
<td class="code">${s.code}</td>
<td style="color:${s.color}">${s.phase}</td>
<td>${s.cycle === 'PEAK' ? '0' : s.cycle === 'MIDDLE' ? '15-20' : s.cycle === 'RECOVERY' ? '30-45' : '60+'}</td>
<td>${s.cycle === 'BOTTOM' ? '0' : s.cycle === 'RECOVERY' ? '45' : s.cycle === 'MIDDLE' ? '20' : '5-10'}</td>
<td style="color:#00ff88">${s.trend === 'UP' ? '📈 UPTREND' : '➡️ SIDEWAYS'}</td>
</tr>`).join('')}
</table>
</div>
<div class="panel" style="margin-top:20px">
<h2>⚡ TODAY'S ACTION PLAN</h2>
<div style="padding:15px">
<div style="background:rgba(0,255,136,0.1);border:1px solid #00ff88;border-radius:10px;padding:15px;margin-bottom:10px">
<div style="color:#00ff88;font-weight:bold;margin-bottom:5px">🔥 PERFECT ENTRY (Now)</div>
<div style="font-size:12px">数字人, 美团 - Bottom formation, start accumulating</div>
</div>
<div style="background:rgba(0,212,255,0.1);border:1px solid #00d4ff;border-radius:10px;padding:15px;margin-bottom:10px">
<div style="color:#00d4ff;font-weight:bold;margin-bottom:5px">🟢 GOOD ENTRY</div>
<div style="font-size:12px">中际旭创, 宁德时代 - Recovery phase, building position</div>
</div>
<div style="background:rgba(255,200,0,0.1);border:1px solid #ffd700;border-radius:10px;padding:15px">
<div style="color:#ffd700;font-weight:bold;margin-bottom:5px">🟡 HOLD</div>
<div style="font-size:12px">比亚迪 - Near peak, hold but don't add</div>
</div>
</div>
</div>
<div class="panel" style="margin-top:20px">
<h2>📁 REPORTS - CLICK TO OPEN</h2>
<div class="reports">
<a href="${BASE_DIR}COMPREHENSIVE_SCAN_${TODAY}.txt" class="report-link" target="_blank"><span class="icon">📊</span><span class="name">Comprehensive</span><span class="desc">176 stocks</span></a>
<a href="${BASE_DIR}SMART_MONEY_FLOW_${TODAY}.txt" class="report-link" target="_blank"><span class="icon">💰</span><span class="name">Smart Money</span><span class="desc">Flows</span></a>
<a href="${BASE_DIR}HIDDEN_GEMS_${TODAY}.txt" class="report-link" target="_blank"><span class="icon">💎</span><span class="name">Hidden Gems</span><span class="desc">Analysis</span></a>
<a href="${BASE_DIR}PUBLIC_INTELLIGENCE_${TODAY}.txt" class="report-link" target="_blank"><span class="icon">🔍</span><span class="name">Intelligence</span><span class="desc">Insiders</span></a>
<a href="${BASE_DIR}DEEP_INTELLIGENCE.txt" class="report-link" target="_blank"><span class="icon">🧠</span><span class="name">Deep Intel</span><span class="desc">Advanced</span></a>
<a href="${BASE_DIR}TOMORROW_PREDICTION.txt" class="report-link" target="_blank"><span class="icon">🔮</span><span class="name">Prediction</span><span class="desc">Next Day</span></a>
</div>
</div>
<div class="footer">🧠 Charles's Super Brain | Cycle Analysis + Timing + Hidden Gems | Updated: ${new Date().toLocaleString()}</div>
</div>
</body>
</html>`;

  fs.writeFileSync(`${OUTPUT_DIR}/integrated_command_center.html`, html);
  console.log('✅ Integrated Command Center generated');
}

generate();
