#!/usr/bin/env node
/**
 * Super Brain V3 - Level 2 Optimizations (for FORMATTED source)
 */

const fs = require('fs');
const input = 'SUPER_BRAIN_APP_V3.html';
const output = 'SUPER_BRAIN_APP_V3.html';

let html = fs.readFileSync(input, 'utf8');
const originalSize = Buffer.byteLength(html, 'utf8');

console.log(`📦 Applying Level 2 optimizations to: ${input}`);
console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);

// ============================================================
// 1. Add cache globals BEFORE getPrice function
// ============================================================
const cacheGlobals = `
// LEVEL 2 CACHE: Price cache (10s TTL)
let priceCache = {};
let priceCacheTime = 0;
const PRICE_CACHE_TTL = 10000;

// LEVEL 2 CACHE: K-line cache (1hr TTL - daily data is stable)
let klineCache = {};
let klineCacheTime = 0;
const KLINE_CACHE_TTL = 3600000;

// LEVEL 2 CACHE: Tech indicators (5min TTL)
let techCache = {};
let techCacheTime = 0;
const TECH_CACHE_TTL = 300000;
`;

const oldGetPriceStart = `// Get live price from Tencent API (handles SH/SZ/CY/BSE/HK)
async function getPrice(code) {`;

if (html.includes('PRICE_CACHE_TTL')) {
    console.log('⚠️  Cache already applied, skipping');
} else if (html.includes(oldGetPriceStart)) {
    html = html.replace(oldGetPriceStart, cacheGlobals + oldGetPriceStart);
    console.log('✅ Added cache globals');
} else {
    console.log('⚠️  Could not find getPrice start marker');
}

// ============================================================
// 2. Wrap getPrice() with caching
// ============================================================
const oldGetPriceBody = `async function getPrice(code) {
  if(!code) return {price:0,pct:0,vol:0};
  
  let prefix = 'sh';
  code = code.toString();
  
  if(code.length <= 5 && !code.startsWith('6') && !code.startsWith('9')) prefix = 'hk'; // HK stocks (0700, 9988, etc)
  else if(code.startsWith('0') || code.startsWith('3')) prefix = 'sz'; // SZ or CY
  else if(code.startsWith('8')) prefix = 'bj'; // BSE Beijing
  
  // HK stocks need 5-digit padding: 0700 -> 00700
  if(prefix === 'hk' && code.length === 4) code = '0' + code;
  
  try {
    const res = await fetch('https://qt.gtimg.cn/q=' + prefix + code);
    const text = await res.text();
    if(!text || text.length < 10 || text.includes('none_match')) return {price:0,pct:0,vol:0};
    const p = text.split('~');
    return {
      price: parseFloat(p[3]) || 0,
      pct: parseFloat(p[32]) || 0,
      vol: parseInt(p[6]) || 0  // Volume at field 6
    };
  } catch(e) { 
    return {price:0,pct:0,vol:0}; 
  }
}`;

const newGetPriceBody = `async function getPrice(code) {
  if(!code) return {price:0,pct:0,vol:0};
  const now = Date.now();
  if(priceCache[code] && (now - priceCacheTime) < PRICE_CACHE_TTL) return priceCache[code];
  
  let prefix = 'sh';
  code = code.toString();
  
  if(code.length <= 5 && !code.startsWith('6') && !code.startsWith('9')) prefix = 'hk'; // HK stocks (0700, 9988, etc)
  else if(code.startsWith('0') || code.startsWith('3')) prefix = 'sz'; // SZ or CY
  else if(code.startsWith('8')) prefix = 'bj'; // BSE Beijing
  
  // HK stocks need 5-digit padding: 0700 -> 00700
  if(prefix === 'hk' && code.length === 4) code = '0' + code;
  
  try {
    const res = await fetch('https://qt.gtimg.cn/q=' + prefix + code);
    const text = await res.text();
    if(!text || text.length < 10 || text.includes('none_match')) return {price:0,pct:0,vol:0};
    const p = text.split('~');
    const result = {
      price: parseFloat(p[3]) || 0,
      pct: parseFloat(p[32]) || 0,
      vol: parseInt(p[6]) || 0
    };
    priceCache[code] = result;
    priceCacheTime = now;
    return result;
  } catch(e) { 
    return {price:0,pct:0,vol:0}; 
  }
}`;

if (html.includes(oldGetPriceBody)) {
    html = html.replace(oldGetPriceBody, newGetPriceBody);
    console.log('✅ getPrice() caching applied');
} else {
    console.log('⚠️  getPrice body not found (may already be cached or different format)');
}

// ============================================================
// 3. Wrap refreshPnL with parallel fetch
// ============================================================
const oldRefreshPnL = `async function refreshPnL() {
  // Get portfolio data
  const allStocks = [...portfolio.daily, ...portfolio.mid, ...portfolio.long];
  
  let totalPnL = 0;
  let winners = 0;
  let losers = 0;
  let details = [];
  
  for(let s of allStocks) {
    try {
      const d = await getPrice(s.code || s.c);
      const entry = s.entry || s.buyPrice || 0;
      const current = d.price || 0;
      const shares = s.shares || 1000;
      const pnl = (current - entry) * shares;
      const pct = entry > 0 ? ((current - entry) / entry * 100) : 0;
      totalPnL += pnl;
      if(pnl > 0) winners++;
      else if(pnl < 0) losers++;
      details.push({code: s.code || s.c, name: s.name || s.n || '', entry: entry, current: current, pnl: pnl, pct: pct, status: pnl > 0 ? 'profit' : (pnl < 0 ? 'loss' : 'flat')});
    } catch(e) { console.log('Error getting P&L for', s.code); }
  }`;

const newRefreshPnL = `// PARALLEL: fetch all prices at once
async function refreshPnL() {
  const allStocks = [...portfolio.daily, ...portfolio.mid, ...portfolio.long];
  const priceResults = await Promise.all(allStocks.map(s => getPrice(s.code || s.c)));
  
  let totalPnL = 0;
  let winners = 0;
  let losers = 0;
  let details = [];
  
  allStocks.forEach((s, i) => {
    const d = priceResults[i];
    const entry = s.entry || s.buyPrice || 0;
    const current = d.price || 0;
    const shares = s.shares || 1000;
    const pnl = (current - entry) * shares;
    const pct = entry > 0 ? ((current - entry) / entry * 100) : 0;
    totalPnL += pnl;
    if(pnl > 0) winners++;
    else if(pnl < 0) losers++;
    details.push({code: s.code || s.c, name: s.name || s.n || '', entry: entry, current: current, pnl: pnl, pct: pct, status: pnl > 0 ? 'profit' : (pnl < 0 ? 'loss' : 'flat')});
  });`;

if (html.includes(oldRefreshPnL)) {
    html = html.replace(oldRefreshPnL, newRefreshPnL);
    console.log('✅ refreshPnL parallel fetch applied');
} else {
    console.log('⚠️  refreshPnL body not found');
}

fs.writeFileSync(output, html);
const newSize = Buffer.byteLength(html, 'utf8');
console.log(`\n✅ Done!`);
console.log(`   New size: ${(newSize / 1024).toFixed(1)} KB`);
console.log(`   Change: ${((newSize - originalSize) / 1024).toFixed(1)} KB`);
