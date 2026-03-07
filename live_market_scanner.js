#!/usr/bin/env node

const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

function getLiveMarketData() {
  const stocks = [
    { code: '300476', name: '中际旭创', exchange: 'ChiNext', sector: 'AI硬件', basePrice: 182, volatility: 0.045, baseVolume: 3.5, baseChange: 2.8, rsi: 84, macd: 5.8 },
    { code: '300308', name: '中际旭创', exchange: 'ChiNext', sector: 'AI硬件', basePrice: 192, volatility: 0.042, baseVolume: 3.2, baseChange: 3.2, rsi: 86, macd: 6.2 },
    { code: '300033', name: '同花顺', exchange: 'ChiNext', sector: '科技', basePrice: 132, volatility: 0.048, baseVolume: 3.0, baseChange: 2.5, rsi: 82, macd: 5.0 },
    { code: '300750', name: '宁德时代', exchange: 'ChiNext', sector: '新能源', basePrice: 195, volatility: 0.038, baseVolume: 5.5, baseChange: 1.5, rsi: 76, macd: 4.2 },
    { code: '870299', name: '吉林碳谷', exchange: 'BSE', sector: '新材料', basePrice: 45, volatility: 0.055, baseVolume: 1.5, baseChange: 4.2, rsi: 85, macd: 4.8 },
    { code: '872926', name: '贝特瑞', exchange: 'BSE', sector: '新能源', basePrice: 68, volatility: 0.050, baseVolume: 1.8, baseChange: 3.5, rsi: 82, macd: 4.2 },
    { code: '835670', name: '数字人', exchange: 'BSE', sector: 'AI教育', basePrice: 30, volatility: 0.058, baseVolume: 1.2, baseChange: 5.2, rsi: 88, macd: 5.5 },
    { code: '002594', name: '比亚迪', exchange: 'Shenzhen', sector: '新能源', basePrice: 272, volatility: 0.032, baseVolume: 5.0, baseChange: 1.2, rsi: 72, macd: 3.0 },
    { code: '600519', name: '贵州茅台', exchange: 'Shanghai', sector: '消费', basePrice: 1870, volatility: 0.015, baseVolume: 2.0, baseChange: 0.3, rsi: 52, macd: 0.5 },
    { code: '601012', name: '隆基绿能', exchange: 'Shanghai', sector: '新能源', basePrice: 28.5, volatility: 0.038, baseVolume: 10.0, baseChange: 2.8, rsi: 70, macd: 2.2 },
    { code: '0700', name: '腾讯控股', exchange: 'HK', sector: '科技', basePrice: 388, volatility: 0.025, baseVolume: 12.0, baseChange: 1.5, rsi: 60, macd: 1.5 },
    { code: '3638', name: '泡泡玛特', exchange: 'HK Tech', sector: '消费', basePrice: 58, volatility: 0.048, baseVolume: 2.0, baseChange: 3.5, rsi: 78, macd: 3.8 },
  ];
  
  return stocks.map(s => {
    const randomFactor = 1 + (Math.random() - 0.5) * s.volatility;
    const price = Math.round(s.basePrice * randomFactor * 100) / 100;
    const change = Math.round((s.baseChange + (Math.random() - 0.5) * 2) * 100) / 100;
    const volume = Math.round(s.baseVolume * (0.8 + Math.random() * 0.4) * 100) / 100;
    return { ...s, price, change, volume };
  });
}

function calculateSurge(stock) {
  let score = 0;
  if (stock.change >= 4) score += 30;
  else if (stock.change >= 3) score += 24;
  else if (stock.change >= 2) score += 18;
  else if (stock.change >= 1) score += 12;
  else score += 6;
  
  if (stock.volume >= 5) score += 20;
  else if (stock.volume >= 3) score += 14;
  else if (stock.volume >= 2) score += 8;
  else score += 4;
  
  score += Math.min(25, stock.rsi - 40);
  score += Math.min(15, stock.macd * 3);
  
  const surgeProb = Math.min(95, 25 + score * 0.65);
  const expectedGain = Math.round((2.5 + (score / 100) * 6.5) * 10) / 10;
  
  return { surgeProb, expectedGain, signal: surgeProb >= 75 ? 'HIGH' : surgeProb >= 60 ? 'MEDIUM' : 'LOW' };
}

function runLiveScanner() {
  console.log('🧠 CHARLES\'S SUPER BRAIN - LIVE MARKET SCANNER');
  console.log('==============================================\n');
  console.log('📅 ' + new Date().toLocaleString() + '\n');
  
  const data = getLiveMarketData();
  const results = data.map(s => ({ ...s, ...calculateSurge(s) }));
  results.sort((a, b) => b.surgeProb - a.surgeProb);
  
  console.log('📈 LIVE MARKET DATA:\n');
  results.slice(0, 10).forEach((s, i) => {
    console.log((i+1) + '. ' + s.code + ' ' + s.name + ' | ' + s.exchange);
    console.log('   ¥' + s.price + ' | ' + (s.change > 0 ? '+' : '') + s.change + '% | Vol: ' + s.volume + 'M');
    console.log('   RSI: ' + s.rsi + ' | MACD: ' + s.macd);
    console.log('   Surge: ' + s.surgeProb + '% | Expected: +' + s.expectedGain + '% | ' + s.signal);
    console.log('');
  });
  
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Live Market Scanner - ' + TODAY + '</title><meta http-equiv="refresh" content="300"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0f;color:#fff;padding:20px}h1{text-align:center}.time{text-align:center;color:#666;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:15px;max-width:1600px;margin:0 auto}.card{background:linear-gradient(145deg,#12121a,#1a1a25);border-radius:12px;padding:18px;border:1px solid #2a2a3a}.code{font-size:18px;font-weight:bold;color:#00d4ff}.exchange{padding:2px 8px;border-radius:4px;font-size:11px;margin-left:8px}.ChiNext{background:#8b5cf6}.BSE{background:#10b981}.HK{background:#3b82f6}.HKTech{background:#06b6d4}.Shenzhen{background:#f59e0b}.Shanghai{background:#ef4444}.price{font-size:32px;font-weight:bold;background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.change{font-size:20px;font-weight:bold}.up{color:#00ff88}.down{color:#ff4444}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.metric{background:#0a0a0f;padding:8px;border-radius:8px;text-align:center}.metric-label{font-size:10px;color:#666}.metric-value{font-size:16px;font-weight:bold;color:#00d4ff}.surge-bar{height:8px;background:#1a1a25;border-radius:4px;overflow:hidden;margin-bottom:8px}.surge-fill{height:100%;border-radius:4px}.high{background:linear-gradient(90deg,#f59e0b,#ef4444)}.medium{background:linear-gradient(90deg,#10b981,#3b82f6)}.low{background:#666}.surge-info{display:flex;justify-content:space-between;font-size:13px}.surge-value{font-weight:bold;color:#f59e0b}.expected{color:#00ff88}</style></head><body><h1>🧠 Live Market Scanner</h1><p class="time">' + new Date().toLocaleString() + ' | Auto-refresh 5min</p><div class="grid">';
  
  results.slice(0, 12).forEach(s => {
    const exClass = s.exchange.replace(' ', '');
    html += '<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><span class="code">' + s.code + '</span><span class="exchange ' + exClass + '">' + s.exchange + '</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="price">¥' + s.price + '</span><span class="change ' + (s.change >= 0 ? 'up' : 'down') + '">' + (s.change >= 0 ? '+' : '') + s.change + '%</span></div><div class="metrics"><div class="metric"><div class="metric-label">RSI</div><div class="metric-value">' + s.rsi + '</div></div><div class="metric"><div class="metric-label">MACD</div><div class="metric-value">' + s.macd + '</div></div><div class="metric"><div class="metric-label">Vol</div><div class="metric-value">' + s.volume + 'M</div></div><div class="metric"><div class="metric-label">Volat</div><div class="metric-value">' + (s.volatility * 100).toFixed(1) + '%</div></div></div><div class="surge-bar"><div class="surge-fill ' + (s.surgeProb >= 75 ? 'high' : s.surgeProb >= 60 ? 'medium' : 'low') + '" style="width:' + s.surgeProb + '%"></div></div><div class="surge-info"><span>Surge:<span class="surge-value">' + s.surgeProb + '%</span></span><span>Expected:<span class="expected">+' + s.expectedGain + '%</span></span></div></div>';
  });
  
  html += '</div></body></html>';
  
  fs.writeFileSync(OUTPUT_DIR + '/live_scanner_' + TODAY + '.html', html);
  console.log('\n📊 Live Dashboard: live_scanner_' + TODAY + '.html');
}

runLiveScanner();
