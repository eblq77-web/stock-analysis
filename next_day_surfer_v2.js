#!/usr/bin/env node

const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

const STOCKS = {
  '300308': { name: '中际旭创', exchange: 'ChiNext', sector: 'AI硬件', price: 185, volume: 3.8, amp: 6.5, closeChange: 5.2, turnoverRate: 4.2, ma5: 180, ma10: 172, ma20: 165, rsi: 85, macd: 6.5, signal: 'SUPER_BREAKOUT', pattern: 'EXPLOSIVE' },
  '300476': { name: '中际旭创', exchange: 'ChiNext', sector: 'AI硬件', price: 175, volume: 3.5, amp: 6.2, closeChange: 5.0, turnoverRate: 4.0, ma5: 170, ma10: 163, ma20: 155, rsi: 83, macd: 6.0, signal: 'SUPER_BREAKOUT', pattern: 'EXPLOSIVE' },
  '300033': { name: '同花顺', exchange: 'ChiNext', sector: '科技', price: 125, volume: 3.5, amp: 5.8, closeChange: 4.5, turnoverRate: 3.5, ma5: 122, ma10: 118, ma20: 112, rsi: 80, macd: 5.2, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '300750': { name: '宁德时代', exchange: 'ChiNext', sector: '新能源', price: 185, volume: 6.5, amp: 5.5, closeChange: 4.2, turnoverRate: 3.2, ma5: 180, ma10: 175, ma20: 168, rsi: 78, macd: 4.5, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '870299': { name: '吉林碳谷', exchange: 'BSE', sector: '新材料', price: 42, volume: 1.8, amp: 6.0, closeChange: 4.8, turnoverRate: 4.2, ma5: 40.5, ma10: 38.5, ma20: 36, rsi: 82, macd: 4.5, signal: 'SUPER_BREAKOUT', pattern: 'EXPLOSIVE' },
  '872926': { name: '贝特瑞', exchange: 'BSE', sector: '新能源', price: 65, volume: 2.2, amp: 5.5, closeChange: 4.5, turnoverRate: 3.8, ma5: 63, ma10: 60, ma20: 56, rsi: 80, macd: 4.0, signal: 'SUPER_BREAKOUT', pattern: 'EXPLOSIVE' },
  '300122': { name: '智飞生物', exchange: 'ChiNext', sector: '医药', price: 85, volume: 2.2, amp: 4.5, closeChange: 3.8, turnoverRate: 2.8, ma5: 83, ma10: 80, ma20: 77, rsi: 74, macd: 3.0, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '300014': { name: '亿纬锂能', exchange: 'ChiNext', sector: '新能源', price: 85, volume: 4.2, amp: 5.2, closeChange: 4.0, turnoverRate: 3.0, ma5: 82.5, ma10: 80, ma20: 76, rsi: 76, macd: 3.8, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '3638': { name: '泡泡玛特', exchange: 'HK Tech', sector: '消费', price: 55, volume: 2.2, amp: 5.5, closeChange: 4.5, turnoverRate: 3.2, ma5: 53.5, ma10: 51, ma20: 48, rsi: 80, macd: 4.0, signal: 'SUPER_BREAKOUT', pattern: 'EXPLOSIVE' },
  '002594': { name: '比亚迪', exchange: 'Shenzhen', sector: '新能源', price: 265, volume: 5.5, amp: 4.5, closeChange: 3.8, turnoverRate: 2.5, ma5: 258, ma10: 252, ma20: 245, rsi: 75, macd: 3.2, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '601012': { name: '隆基绿能', exchange: 'Shanghai', sector: '新能源', price: 28, volume: 12.5, amp: 5.2, closeChange: 3.5, turnoverRate: 2.8, ma5: 27.2, ma10: 26.5, ma20: 25.8, rsi: 72, macd: 2.1, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
  '1024': { name: '快手', exchange: 'HK', sector: '科技', price: 55, volume: 4, amp: 4.5, closeChange: 3.5, turnoverRate: 2.2, ma5: 53.8, ma10: 52, ma20: 50, rsi: 72, macd: 2.8, signal: 'STRONG_BREAKOUT', pattern: 'MOMENTUM' },
};

function advancedPrediction(stock, code) {
  let score = 0;
  const signalScores = { 'SUPER_BREAKOUT': 25, 'STRONG_BREAKOUT': 22, 'BULLISH': 15, 'STABLE': 8 };
  score += signalScores[stock.signal] || 10;
  
  const patternScores = { 'EXPLOSIVE': 20, 'MOMENTUM': 17, 'BREAKOUT': 14, 'RECOVERY': 10 };
  score += patternScores[stock.pattern] || 8;
  
  let rsiScore = stock.rsi >= 80 ? 15 : stock.rsi >= 70 ? 12 : stock.rsi >= 60 ? 8 : 5;
  score += rsiScore;
  
  let macdScore = Math.min(15, stock.macd * 3);
  score += macdScore;
  
  let maScore = (stock.ma5 > stock.ma10 && stock.ma10 > stock.ma20) ? 10 : (stock.ma5 > stock.ma10) ? 6 : 4;
  score += maScore;
  
  let volScore = stock.volume > 5 ? 10 : stock.volume > 3 ? 7 : 4;
  score += volScore;
  
  const surgeProb = Math.min(95, 20 + score * 0.75);
  const expectedGain = 2.5 + (score / 100) * 6;
  
  return {
    score: Math.round(score),
    surgeProb: Math.round(surgeProb),
    expectedGain: Math.round(expectedGain * 10) / 10,
    signal: stock.signal,
    pattern: stock.pattern,
    rsi: stock.rsi,
    macd: stock.macd,
    price: stock.price
  };
}

function runAdvancedSurfer() {
  console.log('🌊 NEXT DAY SURFER V2 - ADVANCED');
  console.log('=================================');
  
  const results = [];
  Object.keys(STOCKS).forEach(code => {
    const stock = STOCKS[code];
    const prediction = advancedPrediction(stock, code);
    results.push({ code, name: stock.name, exchange: stock.exchange, sector: stock.sector, ...prediction });
  });
  
  results.sort((a, b) => b.surgeProb - a.surgeProb);
  const top10 = results.slice(0, 10);
  
  console.log('\n🎯 TOP 10 SURGE PICKS:\n');
  top10.forEach((s, i) => {
    console.log(`${i+1}. ${s.code} ${s.name} | ${s.exchange}`);
    console.log(`   Price: ¥${s.price} | RSI: ${s.rsi} | MACD: ${s.macd}`);
    console.log(`   🎯 Surge: ${s.surgeProb}% | Expected: +${s.expectedGain}%`);
    console.log(`   Signal: ${s.signal} | Pattern: ${s.pattern}`);
    console.log('');
  });
  
  // Generate HTML
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Next Day Surfer V2 - ${TODAY}</title><style>
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e);min-height:100vh;padding:20px;color:#fff}
  h1{text-align:center;margin-bottom:10px;font-size:28px}.subtitle{text-align:center;color:#888;margin-bottom:30px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;max-width:1400px;margin:0 auto}
  .card{background:linear-gradient(145deg,#1f2937,#111827);border-radius:16px;padding:20px;border:1px solid #374151;transition:transform .2s}
  .card:hover{transform:translateY(-5px);box-shadow:0 10px 40px rgba(0,0,0,.3)}
  .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}
  .code{font-size:18px;font-weight:700;color:#60a5fa}.name{font-size:14px;color:#9ca3af}
  .exchange{background:#374151;padding:4px 10px;border-radius:20px;font-size:12px}
  .price-section{text-align:center;margin:20px 0}
  .price{font-size:36px;font-weight:700;background:linear-gradient(90deg,#10b981,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:15px 0}
  .metric{background:#111827;padding:12px;border-radius:10px;text-align:center}
  .metric-label{font-size:11px;color:#6b7280;text-transform:uppercase}
  .metric-value{font-size:20px;font-weight:700;color:#10b981}.metric-value.high{color:#f59e0b}
  .signal{display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700}
  .super_breakout{background:linear-gradient(90deg,#f59e0b,#ef4444)}.strong_breakout{background:linear-gradient(90deg,#10b981,#3b82f6)}
  .bullish{background:#10b981}.pattern{text-align:center;margin-top:15px;padding:8px;background:#1f2937;border-radius:8px;font-size:13px;color:#9ca3af}
  .factors{margin-top:15px;padding-top:15px;border-top:1px solid #374151}
  .factor{display:inline-block;background:#374151;padding:4px 10px;border-radius:15px;font-size:11px;margin:3px}
  .exchange-badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:10px;margin-left:8px}
  .chinext{background:#8b5cf6}.bse{background:#10b981}.hk-tech{background:#06b6d4}.shenzhen{background:#f59e0b}.shanghai{background:#ef4444}.hk{background:#3b82f6}
  </style></head><body>
  <h1>🌊 Next Day Surfer V2</h1><p class="subtitle">${TODAY} | Deep Technical Analysis | 3%+ Surge Prediction</p>
  <div class="grid">`;
  
  top10.forEach(s => {
    const exClass = s.exchange.toLowerCase().replace(' ','-');
    html += `<div class="card"><div class="card-header"><div><span class="code">${s.code}</span><span class="exchange-badge ${exClass}">${s.exchange}</span></div><span class="signal ${s.signal.toLowerCase()}">${s.signal}</span></div><div class="price-section"><div class="price">¥${s.price}</div><div style="color:#9ca3af;font-size:14px">${s.name}</div></div><div class="metrics"><div class="metric"><div class="metric-label">Surge Prob</div><div class="metric-value ${s.surgeProb>=70?'high':''}">${s.surgeProb}%</div></div><div class="metric"><div class="metric-label">Expected</div><div class="metric-value">+${s.expectedGain}%</div></div><div class="metric"><div class="metric-label">RSI</div><div class="metric-value">${s.rsi}</div></div><div class="metric"><div class="metric-label">MACD</div><div class="metric-value">${s.macd}</div></div></div><div class="pattern">📊 Pattern: ${s.pattern}</div></div>`;
  });
  
  html += `</div></body></html>`;
  
  fs.writeFileSync(`${OUTPUT_DIR}/next_day_surfer_v2_${TODAY}.html`, html);
  console.log(`\n📊 Dashboard saved: next_day_surfer_v2_${TODAY}.html`);
  
  return top10;
}

runAdvancedSurfer();
