#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - MEGA API SCANNER
 * Tests and uses ALL available financial APIs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

// API Endpoints discovered
const APIs = {
  // Working APIs
  tencent: {
    name: 'Tencent',
    url: (c) => `https://qt.gtimg.cn/q=${c}`,
    parse: (r) => {
      const m = r.match(/="([^"]+)"/);
      if (!m) return null;
      const f = m[1].split('~');
      if (f.length < 10) return null;
      return { price: parseFloat(f[3]), open: parseFloat(f[33]), high: f[34], low: f[35] };
    }
  },
  tencentKLine: {
    name: 'Tencent KLine',
    url: (c) => `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${c},day,,,320,qfq`,
    parse: (r) => {
      try {
        const d = JSON.parse(r);
        if (d.data) {
          const keys = Object.keys(d.data);
          if (keys.length > 0) {
            const arr = d.data[keys[0]].qfqday;
            if (arr && arr.length > 0) {
              const last = arr[arr.length - 1];
              return { price: parseFloat(last[4]), change: parseFloat(last[1]) - parseFloat(last[4]) };
            }
          }
        }
      } catch {}
      return null;
    }
  },
  eastmoney: {
    name: 'EastMoney',
    url: (c) => `https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/PageAjax?code=${c}`,
    parse: (r) => {
      try {
        const d = JSON.parse(r);
        if (d.jbzl && d.jbzl[0]) {
          return { name: d.jbzl[0].SECURITY_NAME_ABBR };
        }
      } catch {}
      return null;
    }
  },
  eastmoneyQuotes: {
    name: 'EastMoney Quotes',
    url: (c) => `https://searchapi.eastmoney.com/api/suggest/get?input=${c}&type=14&token=D43BF7C8E33B8AD`,
    parse: (r) => {
      try {
        const d = JSON.parse(r);
        if (d.QuotationCodeTable && d.QuotationCodeTable.Data) {
          return { suggestions: d.QuotationCodeTable.Data.length };
        }
      } catch {}
      return null;
    }
  }
};

// Stock codes
const STOCKS = [
  { code: 'sh600519', name: '贵州茅台', display: '600519' },
  { code: 'sz300476', name: '中际旭创', display: '300476' },
  { code: 'sz002594', name: '比亚迪', display: '002594' },
  { code: 'sh601012', name: '隆基绿能', display: '601012' },
  { code: 'sz300750', name: '宁德时代', display: '300750' },
  { code: 'hk00700', name: '腾讯控股', display: '0700' },
];

function testAPI(name, url) {
  try {
    const r = execSync(`curl -s --max-time 4 "${url}"`, { encoding: 'utf8' });
    return r.length > 10;
  } catch { return false; }
}

function fetchStock(code) {
  // Try Tencent first (most reliable)
  try {
    const r = execSync(`curl -s --max-time 3 "https://qt.gtimg.cn/q=${code}"`, { encoding: 'utf8' });
    const m = r.match(/="([^"]+)"/);
    if (m) {
      const f = m[1].split('~');
      if (f.length >= 35) {
        const price = parseFloat(f[3]);
        const open = parseFloat(f[33]) || price;
        const pct = ((price - open) / open) * 100;
        const vol = parseFloat(f[6]) / 10000;
        return { price, pct, vol, source: 'Tencent' };
      }
    }
  } catch {}
  return null;
}

function run() {
  console.log('🧠 MEGA API SCANNER');
  console.log('==================\n');
  
  // Test all APIs
  console.log('📡 Testing APIs:\n');
  const apiStatus = {};
  
  // Test Tencent
  apiStatus['Tencent Realtime'] = testAPI('Tencent', 'https://qt.gtimg.cn/q=sh600519') ? '✅' : '❌';
  apiStatus['Tencent KLine'] = testAPI('TencentK', 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,320,qfq') ? '✅' : '❌';
  apiStatus['EastMoney'] = testAPI('EM', 'https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/PageAjax?code=SH600519') ? '✅' : '❌';
  apiStatus['EM Quotes'] = testAPI('EMQ', 'https://searchapi.eastmoney.com/api/suggest/get?input=600519&type=14') ? '✅' : '❌';
  
  Object.entries(apiStatus).forEach(([k, v]) => console.log('  ' + v + ' ' + k));
  
  console.log('\n📈 Fetching Stocks:\n');
  
  const results = [];
  for (const s of STOCKS) {
    const d = fetchStock(s.code);
    if (d) {
      results.push({ ...s, ...d });
      console.log('✅ ' + s.name + ': ¥' + d.price.toFixed(2) + ' ' + (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + '% [' + d.source + ']');
    } else {
      console.log('❌ ' + s.name + ': Failed');
    }
  }
  
  // Generate HTML Dashboard
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mega Scanner ' + TODAY + '</title><meta http-equiv="refresh" content="60"><style>*{margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#050507;color:#fff;padding:20px}h1{text-align:center;font-size:24px;margin-bottom:10px}.api{text-align:center;margin-bottom:20px}.badge{background:#222;padding:5px 12px;border-radius:8px;font-size:11px;margin:0 3px}.ok{background:#10b981}.bad{background:#ef4444}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.c{background:#101016;padding:14px;border-radius:12px;border:1px solid #222}.nm{color:#00d4ff;font-weight:700}.pr{font-size:24px;background:linear-gradient(90deg,#00d4ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.up{color:#00ff88}.dn{color:#ff4444}.src{font-size:10px;color:#666;margin-top:8px}</style></head><body><h1>🧠 Mega Scanner</h1><p class="api"><span class="badge ' + (apiStatus['Tencent Realtime'] === '✅' ? 'ok' : 'bad') + '">Tencent</span><span class="badge ' + (apiStatus['Tencent KLine'] === '✅' ? 'ok' : 'bad') + '">KLine</span><span class="badge ' + (apiStatus['EastMoney'] === '✅' ? 'ok' : 'bad') + '">EastMoney</span></p><div class="g">';
  
  results.forEach(s => {
    html += '<div class="c"><div class="nm">' + s.name + '</div><div class="pr">¥' + s.price.toFixed(2) + '</div><div class="' + (s.pct >= 0 ? 'up' : 'dn') + '">' + (s.pct >= 0 ? '+' : '') + s.pct.toFixed(2) + '%</div><div class="src">' + s.source + '</div></div>';
  });
  
  html += '</div></body></html>';
  fs.writeFileSync(OUTPUT_DIR + '/mega_scanner_' + TODAY + '.html', html);
  console.log('\n📊 mega_scanner_' + TODAY + '.html');
}

run();
