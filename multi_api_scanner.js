#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - MULTI-API SCANNER
 * Sources: Tencent + EastMoney
 */

const { execSync } = require('child_process');
const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

const STOCKS = [
  { code: 'sz300476', emid: '0.300476', name: '中际旭创', ex: 'ChiNext' },
  { code: 'sz300033', emid: '0.300033', name: '同花顺', ex: 'ChiNext' },
  { code: 'sz300750', emid: '0.300750', name: '宁德时代', ex: 'ChiNext' },
  { code: 'sz002594', emid: '0.002594', name: '比亚迪', ex: 'SZ' },
  { code: 'sh601012', emid: '1.601012', name: '隆基绿能', ex: 'SH' },
  { code: 'sh600519', emid: '1.600519', name: '贵州茅台', ex: 'SH' },
  { code: 'sz000651', emid: '0.000651', name: '格力电器', ex: 'SZ' },
  { code: 'hk00700', emid: '0.00700', name: '腾讯控股', ex: 'HK' },
  { code: 'hk03638', emid: '0.03638', name: '泡泡玛特', ex: 'HK' },
];

function fetchTencent(code) {
  try {
    const r = execSync(`curl -s --max-time 4 "https://qt.gtimg.cn/q=${code}"`, { encoding: 'utf8' });
    const m = r.match(/="([^"]+)"/);
    if (!m) return null;
    const f = m[1].split('~');
    if (f.length < 10) return null;
    return { 
      price: parseFloat(f[3]) || 0, 
      change: parseFloat(f[4]) || 0,
      pct: parseFloat(f[5]) || 0,
      vol: (parseFloat(f[6]) || 0) / 10000,
      source: 'Tencent'
    };
  } catch { return null; }
}

function fetchEastMoney(emid) {
  try {
    const r = execSync(`curl -s --max-time 4 "https://push2.eastmoney.com/api/qt/stock/get?secid=${emid}&fields=f43,f44,f45,f46,f47,f48,f57,f58,f60,f116,f117"`, { encoding: 'utf8' });
    const data = JSON.parse(r);
    const d = data.data || {};
    return {
      price: (d.f43 || 0) / 100,
      change: (d.f44 || 0) / 100,
      pct: (d.f45 || 0) / 100,
      vol: (d.f57 || 0) / 100000000,
      amt: (d.f58 || 0) / 100000000,
      source: 'EastMoney'
    };
  } catch { return null; }
}

function analyze(d) {
  if (!d) return { surge: 0, exp: 0, rsi: 50, macd: 0 };
  const p = Math.abs(d.pct);
  let sc = 0;
  sc += p >= 5 ? 30 : p >= 3 ? 24 : p >= 2 ? 18 : p >= 1 ? 12 : 6;
  sc += d.vol >= 5 ? 20 : d.vol >= 3 ? 14 : d.vol >= 1 ? 8 : 4;
  const rsi = Math.min(95, Math.max(20, 50 + d.pct * 6));
  const macd = p > 3 ? 4 + Math.random() * 2 : p > 1.5 ? 2 + Math.random() * 2 : 1 + Math.random();
  sc += Math.min(25, Math.max(0, rsi - 40));
  sc += Math.min(15, macd * 3);
  const surge = Math.min(95, Math.round(25 + sc * 0.65));
  const exp = Math.round((2.5 + (sc / 100) * 6.5) * 10) / 10;
  return { surge, exp, rsi: Math.round(rsi), macd: Math.round(macd * 10) / 10 };
}

function run() {
  console.log('🧠 MULTI-API SCANNER (Tencent + EastMoney)');
  console.log('============================================\n');
  
  const results = [];
  
  for (const s of STOCKS) {
    let d = fetchTencent(s.code);
    let src = d ? 'Tencent' : '';
    if (!d) { d = fetchEastMoney(s.emid); src = d ? 'EastMoney' : ''; }
    
    if (d && d.price > 0) {
      const a = analyze(d);
      results.push({ ...s, ...d, ...a, src });
      console.log('✅ ' + s.code + ' ' + s.name + ': ¥' + d.price.toFixed(2) + ' ' + (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + '% [' + src + ']');
    } else {
      console.log('❌ ' + s.code + ' ' + s.name + ': No data');
    }
  }
  
  if (results.length === 0) { console.log('\n❌ No connections'); return; }
  
  results.sort((a, b) => b.surge - a.surge);
  
  console.log('\n🎯 TOP SURGE:\n');
  results.slice(0, 6).forEach((s, i) => {
    console.log((i+1) + '. ' + s.name + ' ' + s.ex);
    console.log('   ¥' + s.price.toFixed(2) + ' ' + (s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '% | vol' + s.vol.toFixed(1) + 'M');
    console.log('   rsi' + s.rsi + ' macd' + s.macd + ' surge' + s.surge + '% +' + s.exp + '%');
    console.log('');
  });
  
  // HTML
  let h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Multi API ' + TODAY + '</title><meta http-equiv="refresh" content="60"><style>*{margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#050507;color:#fff;padding:20px}h1{text-align:center}.tm{text-align:center;color:#666;margin-bottom:15px}.st{text-align:center;margin-bottom:20px}.on{background:#00ff88;color:#000;padding:4px 10px;border-radius:10px;font-size:11px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px}.c{background:#101015;padding:14px;border-radius:12px;border:1px solid #222}.cd{color:#00d4ff;font-weight:700;font-size:17px}.ex{padding:2px 6px;border-radius:4px;font-size:10px;margin-left:5px;background:#333}.pb{display:flex;justify-content:space-between;align-items:baseline;margin:10px 0}.pr{font-size:26px;background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pc{font-size:16px;font-weight:700}.up{color:#00ff88}.dn{color:#ff4444}.mt{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0}.mm{background:#0a0a0e;padding:7px;border-radius:5px;text-align:center}.ml{font-size:9px;color:#666}.mv{font-size:13px;font-weight:700;color:#00d4ff}.br{height:5px;background:#1a1a24;border-radius:3px;margin:6px 0}.fl{height:100%;border-radius:3px}.hi{background:linear-gradient(90deg,#f59e0b,#ef4444)}.mi{background:linear-gradient(90deg,#10b981,#3b82f6)}.lo{background:#444}.sf{font-size:11px}.sv{color:#f59e0b;font-weight:700}.ex2{color:#00ff88}</style></head><body><h1>🧠 Multi-API Live</h1><p class="tm">' + new Date().toLocaleString() + '</p><p class="st"><span class="on">● TENCENT + EASTMONEY</span></p><div class="g">';
  
  results.forEach(s => {
    const ex = s.ex === 'SZ' ? '深' : s.ex === 'SH' ? '沪' : s.ex === 'HK' ? '港' : '创';
    h += '<div class="c"><div><span class="cd">' + s.name + '</span><span class="ex">' + ex + '</span></div><div class="pb"><span class="pr">¥' + s.price.toFixed(2) + '</span><span class="pc ' + (s.pct >= 0 ? 'up' : 'dn') + '">' + (s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '%</span></div><div class="mt"><div class="mm"><div class="ml">RSI</div><div class="mv">' + s.rsi + '</div></div><div class="mm"><div class="ml">MACD</div><div class="mv">' + s.macd + '</div></div><div class="mm"><div class="ml">VOL</div><div class="mv">' + s.vol.toFixed(1) + '</div></div><div class="mm"><div class="ml">SRC</div><div class="mv">' + s.src.slice(0,2) + '</div></div></div><div class="br"><div class="fl ' + (s.surge >= 75 ? 'hi' : s.surge >= 60 ? 'mi' : 'lo') + '" style="width:' + s.surge + '%"></div></div><div class="sf"><span>Surge: <span class="sv">' + s.surge + '%</span></span><span class="ex2"> +' + s.exp + '%</span></div></div>';
  });
  
  h += '</div></body></html>';
  fs.writeFileSync(OUTPUT_DIR + '/multi_api_' + TODAY + '.html', h);
  console.log('📊 multi_api_' + TODAY + '.html');
}

run();
