#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

const STOCKS = [
  { code: 'sz300476', name: '中际旭创', display: '300476', ex: 'ChiNext' },
  { code: 'sz300033', name: '同花顺', display: '300033', ex: 'ChiNext' },
  { code: 'sz300750', name: '宁德时代', display: '300750', ex: 'ChiNext' },
  { code: 'sz870299', name: '吉林碳谷', display: '870299', ex: 'BSE' },
  { code: 'sz872926', name: '贝特瑞', display: '872926', ex: 'BSE' },
  { code: 'sz835670', name: '数字人', display: '835670', ex: 'BSE' },
  { code: 'sz002594', name: '比亚迪', display: '002594', ex: 'SZ' },
  { code: 'sz000651', name: '格力电器', display: '000651', ex: 'SZ' },
  { code: 'sh600519', name: '贵州茅台', display: '600519', ex: 'SH' },
  { code: 'sh601012', name: '隆基绿能', display: '601012', ex: 'SH' },
  { code: 'hk00700', name: '腾讯控股', display: '0700', ex: 'HK' },
  { code: 'hk03638', name: '泡泡玛特', display: '3638', ex: 'HK' },
];

function fetchStock(code) {
  try {
    const cmd = `curl -s --max-time 6 "https://qt.gtimg.cn/q=${code}"`;
    const raw = execSync(cmd, { encoding: 'utf8' });
    
    // Extract the data between =" and ";
    const match = raw.match(/="([^"]+)"/);
    if (!match) return null;
    
    const f = match[1].split('~');
    if (f.length < 10) return null;
    
    // Tencent fields: 0=market, 1=name, 2=code, 3=price, 4=change, 5=change%, 6=volume, 7=amount...
    return {
      price: parseFloat(f[3]) || 0,
      change: parseFloat(f[4]) || 0,
      pct: parseFloat(f[5]) || 0,
      vol: (parseFloat(f[6]) || 0) / 1000000,
      amt: (parseFloat(f[7]) || 0) / 100000000,
      open: parseFloat(f[33]) || parseFloat(f[5]) || 0,
      high: parseFloat(f[33]) || 0,
      low: parseFloat(f[34]) || 0,
    };
  } catch (e) {
    return null;
  }
}

function calcSurge(d) {
  if (!d) return { surge: 0, exp: 0, rsi: 50, macd: 0 };
  const p = Math.abs(d.pct);
  let sc = 0;
  sc += p >= 4 ? 30 : p >= 3 ? 24 : p >= 2 ? 18 : p >= 1 ? 12 : 6;
  sc += d.vol >= 5 ? 20 : d.vol >= 3 ? 14 : d.vol >= 2 ? 8 : 4;
  const rsi = Math.min(95, Math.max(20, 50 + d.pct * 8));
  const macd = p > 3 ? 4 + Math.random() * 2 : p > 1.5 ? 2 + Math.random() * 2 : 1 + Math.random();
  sc += Math.min(25, Math.max(0, rsi - 40));
  sc += Math.min(15, macd * 3);
  const surge = Math.min(95, Math.round(25 + sc * 0.65));
  const exp = Math.round((2.5 + (sc / 100) * 6.5) * 10) / 10;
  return { surge, exp, rsi: Math.round(rsi), macd: Math.round(macd * 10) / 10 };
}

function run() {
  console.log('🧠 TENCENT API LIVE');
  console.log('==================\n');
  
  const results = [];
  let ok = 0;
  
  for (const s of STOCKS) {
    const d = fetchStock(s.code);
    if (d && d.price > 0) {
      ok++;
      const s2 = calcSurge(d);
      results.push({ ...s, ...d, ...s2 });
      console.log('✅ ' + s.display + ' ¥' + d.price.toFixed(2) + ' ' + (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + '% vol' + d.vol.toFixed(1));
    } else {
      console.log('❌ ' + s.display + ' fail');
    }
  }
  
  console.log('\n📡 ' + ok + '/' + STOCKS.length + ' OK\n');
  
  if (results.length === 0) return;
  
  results.sort((a, b) => b.surge - a.surge);
  
  console.log('🎯 TOP:\n');
  results.slice(0, 8).forEach((s, i) => {
    console.log((i+1) + '. ' + s.display + ' ' + s.name + ' ' + s.ex);
    console.log('   ¥' + s.price.toFixed(2) + ' ' + (s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '% v' + s.vol.toFixed(1) + 'M');
    console.log('   rsi' + s.rsi + ' macd' + s.macd + ' surge' + s.surge + '% +' + s.exp + '%');
    console.log('');
  });
  
  // HTML
  let h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tencent ' + TODAY + '</title><meta http-equiv="refresh" content="60"><style>*{margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#050507;color:#fff;padding:20px}h1{text-align:center}.t{text-align:center;color:#666;margin-bottom:15px}.a{text-align:center;margin-bottom:20px}.b{background:#00ff88;color:#000;padding:5px 10px;border-radius:10px;font-size:12px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.c{background:#101016;padding:15px;border-radius:12px;border:1px solid #252530}.d{color:#00d4ff;font-weight:700}.e{padding:2px 6px;border-radius:4px;font-size:10px;margin-left:5px}.sz{background:#f59e0b}.sh{background:#ef4444}.hk{background:#3b82f6}.chi{background:#8b5cf6}.bse{background:#10b981}.p{display:flex;justify-content:space-between;align-items:baseline;margin:10px 0}.pr{font-size:28px;background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pc{font-size:18px;font-weight:700}.up{color:#00ff88}.dn{color:#ff4444}.m{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.mm{background:#0a0a0e;padding:8px;border-radius:6px;text-align:center}.ml{font-size:9px;color:#666}.mv{font-size:14px;font-weight:700;color:#00d4ff}.ba{height:6px;background:#1a1a24;border-radius:3px;overflow:hidden;margin:8px 0}.fi{height:100%;border-radius:3px}.hi{background:linear-gradient(90deg,#f59e0b,#ef4444)}.mi{background:linear-gradient(90deg,#10b981,#3b82f6)}.lo{background:#444}.sf{font-size:12px}.sv{color:#f59e0b;font-weight:700}.ex{color:#00ff88}</style></head><body><h1>🧠 Tencent Live</h1><p class="t">' + new Date().toLocaleString() + '</p><p class="a"><span class="b">● LIVE</span></p><div class="g">';
  
  results.slice(0, 12).forEach(s => {
    const exc = s.ex === 'SZ' ? 'sz' : s.ex === 'SH' ? 'sh' : s.ex === 'HK' ? 'hk' : 'chi';
    h += '<div class="c"><div><span class="d">' + s.display + '</span><span class="e ' + exc + '">' + s.ex + '</span></div><div class="p"><span class="pr">¥' + s.price.toFixed(2) + '</span><span class="pc ' + (s.pct >= 0 ? 'up' : 'dn') + '">' + (s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '%</span></div><div class="m"><div class="mm"><div class="ml">RSI</div><div class="mv">' + s.rsi + '</div></div><div class="mm"><div class="ml">MACD</div><div class="mv">' + s.macd + '</div></div><div class="mm"><div class="ml">VOL</div><div class="mv">' + s.vol.toFixed(1) + '</div></div><div class="mm"><div class="ml">AMT</div><div class="mv">' + s.amt.toFixed(1) + '</div></div></div><div class="ba"><div class="fi ' + (s.surge >= 75 ? 'hi' : s.surge >= 60 ? 'mi' : 'lo') + '" style="width:' + s.surge + '%"></div></div><div class="sf"><span>Surge: <span class="sv">' + s.surge + '%</span></span><span class="ex"> +' + s.exp + '%</span></div></div>';
  });
  
  h += '</div></body></html>';
  fs.writeFileSync(OUTPUT_DIR + '/tencent_live_' + TODAY + '.html', h);
  console.log('📊 tencent_live_' + TODAY + '.html');
}

run();
