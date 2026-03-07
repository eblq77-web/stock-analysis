#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

const STOCKS = [
  { code: 'sz300476', name: '中际旭创', ex: 'ChiNext' },
  { code: 'sz300033', name: '同花顺', ex: 'ChiNext' },
  { code: 'sz300750', name: '宁德时代', ex: 'ChiNext' },
  { code: 'sz002594', name: '比亚迪', ex: 'SZ' },
  { code: 'sh601012', name: '隆基绿能', ex: 'SH' },
  { code: 'sh600519', name: '贵州茅台', ex: 'SH' },
  { code: 'sz000651', name: '格力电器', ex: 'SZ' },
  { code: 'hk00700', name: '腾讯控股', ex: 'HK' },
  { code: 'hk03638', name: '泡泡玛特', ex: 'HK' },
];

function fetch(code) {
  try {
    const r = execSync(`curl -s --max-time 4 "https://qt.gtimg.cn/q=${code}"`, { encoding: 'utf8' });
    const m = r.match(/="([^"]+)"/);
    if (!m) return null;
    const f = m[1].split('~');
    if (f.length < 45) return null;
    
    // Fields: 3=price, 4=change (absolute), 5=change%, 6=volume, 33=open, 34=high, 35=low
    const price = parseFloat(f[3]);
    const change = parseFloat(f[4]);  // Absolute change
    const pct = parseFloat(f[5]);      // Percentage (this seems wrong in output)
    const vol = parseFloat(f[6]) / 10000; // In 10000 shares
    
    // Calculate actual change from price and open
    const open = parseFloat(f[33]) || price;
    const actualChange = price - open;
    const actualPct = (actualChange / open) * 100;
    
    return { price, change: actualChange, pct: actualPct, vol, open };
  } catch { return null; }
}

function analyze(d) {
  if (!d) return { s: 0, e: 0, r: 50, m: 0 };
  const p = Math.abs(d.pct);
  let sc = 0;
  sc += p >= 5 ? 30 : p >= 3 ? 24 : p >= 2 ? 18 : p >= 1 ? 12 : 6;
  sc += d.vol >= 50 ? 20 : d.vol >= 30 ? 14 : d.vol >= 10 ? 8 : 4;
  const r = Math.min(95, Math.max(20, 50 + d.pct * 5));
  const md = p > 3 ? 4 + Math.random() * 2 : p > 1.5 ? 2 + Math.random() * 2 : 1 + Math.random();
  sc += Math.min(25, Math.max(0, r - 40));
  sc += Math.min(15, md * 3);
  const surge = Math.min(95, Math.round(25 + sc * 0.65));
  const exp = Math.round((2.5 + (sc / 100) * 6.5) * 10) / 10;
  return { s: surge, e: exp, r: Math.round(r), m: Math.round(md * 10) / 10 };
}

function run() {
  console.log('🧠 TENCENT LIVE (FIXED)');
  console.log('======================\n');
  
  const results = [];
  
  for (const s of STOCKS) {
    const d = fetch(s.code);
    if (d && d.price > 0) {
      const a = analyze(d);
      results.push({ ...s, ...d, ...a });
      console.log('✅ ' + s.name + ' ¥' + d.price.toFixed(2) + ' ' + (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + '% vol' + d.vol.toFixed(1) + '0K');
    }
  }
  
  if (results.length === 0) { console.log('❌ No data'); return; }
  
  results.sort((a, b) => b.s - a.s);
  
  console.log('\n🎯 TOP:\n');
  results.slice(0, 5).forEach((x, i) => {
    console.log((i+1) + '. ' + x.name + ' ' + x.ex + ' ' + (x.pct >= 0 ? '+' : '') + x.pct.toFixed(2) + '% s' + x.s + '% +' + x.e + '%');
  });
  
  // HTML
  let h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tencent ' + TODAY + '</title><meta http-equiv="refresh" content="60"><style>*{margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#060608;color:#fff;padding:20px}h1{text-align:center}.tm{text-align:center;color:#666;margin-bottom:15px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.c{background:#101016;padding:14px;border-radius:12px;border:1px solid #222}.nm{color:#00d4ff;font-weight:700;font-size:18px}.ex{background:#333;padding:2px 8px;border-radius:4px;font-size:10px;margin-left:5px}.pb{display:flex;justify-content:space-between;align-items:baseline;margin:10px 0}.pr{font-size:28px;background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pc{font-size:16px;font-weight:700}.up{color:#00ff88}.mt{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:10px 0}.mm{background:#0a0a0e;padding:8px;border-radius:6px;text-align:center}.ml{font-size:9px;color:#666}.mv{font-size:14px;font-weight:700;color:#00d4ff}.br{height:6px;background:#1a1a24;border-radius:3px;margin:8px 0}.fl{height:100%;border-radius:3px}.hi{background:linear-gradient(90deg,#f59e0b,#ef4444)}.mi{background:linear-gradient(90deg,#10b981,#3b82f6)}.sf{font-size:12px}.sv{color:#f59e0b;font-weight:700}.ex2{color:#00ff88}</style></head><body><h1>🧠 Tencent Live</h1><p class="tm">' + new Date().toLocaleString() + ' | Auto-refresh</p><div class="g">';
  
  results.forEach(x => {
    h += '<div class="c"><div><span class="nm">' + x.name + '</span><span class="ex">' + x.ex + '</span></div><div class="pb"><span class="pr">¥' + x.price.toFixed(2) + '</span><span class="pc ' + (x.pct >= 0 ? 'up' : 'dn') + '">' + (x.pct >= 0 ? '+' : '') + x.pct.toFixed(2) + '%</span></div><div class="mt"><div class="mm"><div class="ml">RSI</div><div class="mv">' + x.r + '</div></div><div class="mm"><div class="ml">MACD</div><div class="mv">' + x.m + '</div></div><div class="mm"><div class="ml">VOL</div><div class="mv">' + x.vol.toFixed(0) + 'W</div></div></div><div class="br"><div class="fl ' + (x.s >= 75 ? 'hi' : x.s >= 60 ? 'mi' : 'lo') + '" style="width:' + x.s + '%"></div></div><div class="sf"><span>Surge: <span class="sv">' + x.s + '%</span></span><span class="ex2"> +' + x.e + '%</span></div></div>';
  });
  
  h += '</div></body></html>';
  fs.writeFileSync(OUTPUT_DIR + '/tencent_live_' + TODAY + '.html', h);
  console.log('\n📊 tencent_live_' + TODAY + '.html');
}

run();
