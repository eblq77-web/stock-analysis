#!/usr/bin/env node
/**
 * Super Brain V3 - Level 2 Performance Optimizations
 * 1. Memory cache for getPrice() (TTL: 10s)
 * 2. Memory cache for fetchKLine() (TTL: 1hr - daily data doesn't change)
 * 3. Memory cache for getRealTechIndicators() (TTL: 5min)
 * 4. Batch DOM updates in runHiddenGemsScan() (update progress every 10 stocks, not every 1)
 * 5. Cache for getRealTechIndicators (depends on K-line, compute-heavy)
 */

const fs = require('fs');
const input = 'SUPER_BRAIN_APP_V3.html';
const output = 'SUPER_BRAIN_APP_V3.html';

let html = fs.readFileSync(input, 'utf8');

// ============================================================
// 1. Add cache globals AFTER the existing hgCache declarations
// Find: "let hgCache = {}; let hgCacheTime = 0;"
// Replace with: also add priceCache, klineCache, techCache
// ============================================================
const oldCaches = `let hgCache={};let hgCacheTime=0;const HG_CACHE_TTL=30000;`;
const newCaches = `let hgCache={};let hgCacheTime=0;const HG_CACHE_TTL=30000;
// LEVEL 2 CACHE: Price cache (10s TTL)
let priceCache={};let priceCacheTime=0;const PRICE_CACHE_TTL=10000;
// LEVEL 2 CACHE: K-line cache (1hr TTL - daily data is stable)
let klineCache={};let klineCacheTime=0;const KLINE_CACHE_TTL=3600000;
// LEVEL 2 CACHE: Tech indicators (5min TTL)
let techCache={};let techCacheTime=0;const TECH_CACHE_TTL=300000;`;
html = html.replace(oldCaches, newCaches);

// ============================================================
// 2. Wrap getPrice() with caching
// Find the getPrice function and wrap it
// ============================================================
const oldGetPrice = `async function getPrice(code){if(!code)return{price:0,pct:0,vol:0};let prefix='sh';code=code.toString();if(code.length<=5&&!code.startsWith('6')&&!code.startsWith('9'))prefix='hk';else if(code.startsWith('0')||code.startsWith('3'))prefix='sz';else if(code.startsWith('8'))prefix='bj';if(prefix==='hk'&&code.length===4)code='0'+code;try{const res=await fetch('https://qt.gtimg.cn/q='+prefix+code);const text=await res.text();if(!text||text.length<10||text.includes('none_match'))return{price:0,pct:0,vol:0};const p=text.split('~');return{price:parseFloat(p[3])||0,pct:parseFloat(p[32])||0,vol:parseInt(p[6])||0}}catch(e){return{price:0,pct:0,vol:0}}}`;
const newGetPrice = `async function getPrice(code){if(!code)return{price:0,pct:0,vol:0};const now=Date.now();if(priceCache[code]&&(now-priceCacheTime)<PRICE_CACHE_TTL)return priceCache[code];let prefix='sh';code=code.toString();if(code.length<=5&&!code.startsWith('6')&&!code.startsWith('9'))prefix='hk';else if(code.startsWith('0')||code.startsWith('3'))prefix='sz';else if(code.startsWith('8'))prefix='bj';if(prefix==='hk'&&code.length===4)code='0'+code;try{const res=await fetch('https://qt.gtimg.cn/q='+prefix+code);const text=await res.text();if(!text||text.length<10||text.includes('none_match'))return{price:0,pct:0,vol:0};const p=text.split('~');const result={price:parseFloat(p[3])||0,pct:parseFloat(p[32])||0,vol:parseInt(p[6])||0};priceCache[code]=result;priceCacheTime=now;return result}catch(e){return{price:0,pct:0,vol:0}}}`;
html = html.replace(oldGetPrice, newGetPrice);

// ============================================================
// 3. Wrap fetchKLine() with caching
// ============================================================
const oldFetchKLine = `async function fetchKLine(code,days=60){const prefix=getTencentPrefix(code);const url=\`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=\${prefix}\${code},day,,,\${days},qfq\`;try{const res=await fetch(url);const text=await res.text();const jsonStr=text.replace(/^kline_dayqfq=/,'');const json=JSON.parse(jsonStr);const key=Object.keys(json.data||{})[0];if(!key)return[];return json.data[key].qfqday||json.data[key].day||[]}catch(e){return[]}}`;
const newFetchKLine = `async function fetchKLine(code,days=60){const cacheKey=code+'_'+days;const now=Date.now();if(klineCache[cacheKey]&&(now-klineCacheTime)<KLINE_CACHE_TTL)return klineCache[cacheKey];const prefix=getTencentPrefix(code);const url=\`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=\${prefix}\${code},day,,,\${days},qfq\`;try{const res=await fetch(url);const text=await res.text();const jsonStr=text.replace(/^kline_dayqfq=/,'');const json=JSON.parse(jsonStr);const key=Object.keys(json.data||{})[0];if(!key)return[];const result=json.data[key].qfqday||json.data[key].day||[];klineCache[cacheKey]=result;klineCacheTime=now;return result}catch(e){return[]}}`;
html = html.replace(oldFetchKLine, newFetchKLine);

// ============================================================
// 4. Wrap getRealTechIndicators() with caching
// ============================================================
const oldTechInd = `async function getRealTechIndicators(code){const kline=await fetchKLine(code,60);if(kline.length<10)return null;const closes=kline.map(k=>parseFloat(k[2]));const highs=kline.map(k=>parseFloat(k[3]));const lows=kline.map(k=>parseFloat(k[4]));const ma5=calcSMA(closes,5);const ma10=calcSMA(closes,10);const ma20=calcSMA(closes,20);const ma60=calcSMA(closes,60);const macd=calcMACD(closes);const rsi=calcRSI(closes);const current=closes[closes.length-1];return{current,ma5,ma10,ma20,ma60,macd:macd?macd.macd.toFixed(3):null,macdSignal:macd?macd.signal.toFixed(3):null,macdHist:macd?macd.histogram.toFixed(3):null,rsi:rsi?rsi.toFixed(1):null,trend:ma5>ma20?'🟢 BULL':'🔴 BEAR',date:kline[kline.length-1][0]}}`;
const newTechInd = `async function getRealTechIndicators(code){const now=Date.now();if(techCache[code]&&(now-techCacheTime)<TECH_CACHE_TTL)return techCache[code];const kline=await fetchKLine(code,60);if(kline.length<10)return null;const closes=kline.map(k=>parseFloat(k[2]));const highs=kline.map(k=>parseFloat(k[3]));const lows=kline.map(k=>parseFloat(k[4]));const ma5=calcSMA(closes,5);const ma10=calcSMA(closes,10);const ma20=calcSMA(closes,20);const ma60=calcSMA(closes,60);const macd=calcMACD(closes);const rsi=calcRSI(closes);const current=closes[closes.length-1];const result={current,ma5,ma10,ma20,ma60,macd:macd?macd.macd.toFixed(3):null,macdSignal:macd?macd.signal.toFixed(3):null,macdHist:macd?macd.histogram.toFixed(3):null,rsi:rsi?rsi.toFixed(1):null,trend:ma5>ma20?'🟢 BULL':'🔴 BEAR',date:kline[kline.length-1][0]};techCache[code]=result;techCacheTime=now;return result}`;
html = html.replace(oldTechInd, newTechInd);

// ============================================================
// 5. Batch DOM updates in runHiddenGemsScan - update every 10 stocks
// ============================================================
const oldScanLoop = `for(let i=0;i<HIDDEN_GEMS_STOCKS.length;i++){const stock=HIDDEN_GEMS_STOCKS[i];const progress=Math.round((i/HIDDEN_GEMS_STOCKS.length)* 100);const progEl=document.getElementById('hg-progress');if(progEl)progEl.innerText=progress+'%';try{const data=await fetchStockData(stock);if(data){const analysis=calculateHiddenGemScore(stock,data);const rec=getHGRecommendation(analysis.score);results.push({...analysis,...rec,price:data.price,change:data.change,volume:data.volume})}}catch(e){console.log(\`Error scanning \${stock}:\`,e.message)}}`;
const newScanLoop = `// BATCH DOM: update progress every 10 stocks (not every 1)
for(let i=0;i<HIDDEN_GEMS_STOCKS.length;i++){const stock=HIDDEN_GEMS_STOCKS[i];if(i%10===0||i===HIDDEN_GEMS_STOCKS.length-1){const progress=Math.round((i/HIDDEN_GEMS_STOCKS.length)* 100);const progEl=document.getElementById('hg-progress');if(progEl)progEl.innerText=progress+'%'}try{const data=await fetchStockData(stock);if(data){const analysis=calculateHiddenGemScore(stock,data);const rec=getHGRecommendation(analysis.score);results.push({...analysis,...rec,price:data.price,change:data.change,volume:data.volume})}}catch(e){console.log(\`Error scanning \${stock}:\`,e.message)}}`;
html = html.replace(oldScanLoop, newScanLoop);

// ============================================================
// 6. Batch DOM updates in refreshPnL
// ============================================================
const oldRefreshPnL = `async function refreshPnL(){const allStocks=[...portfolio.daily,...portfolio.mid,...portfolio.long];let totalPnL=0;let winners=0;let losers=0;let details=[];for(let s of allStocks){try{const d=await getPrice(s.code||s.c);const entry=s.entry||s.buyPrice||0;const current=d.price||0;const shares=s.shares||1000;const pnl=(current-entry)* shares;const pct=entry>0?((current-entry)/entry * 100):0;totalPnL+=pnl;if(pnl>0)winners++;else if(pnl<0)losers++;details.push({code:s.code||s.c,name:s.name||s.n||'',entry:entry,current:current,pnl:pnl,pct:pct,status:pnl>0?'profit':(pnl<0?'loss':'flat')})}catch(e){console.log('Error getting P&L for',s.code)}}`;
const newRefreshPnL = `// BATCH: parallel price fetch + batch DOM
async function refreshPnL(){const allStocks=[...portfolio.daily,...portfolio.mid,...portfolio.long];const priceResults=await Promise.all(allStocks.map(s=>getPrice(s.code||s.c)));let totalPnL=0;let winners=0;let losers=0;let details=[];allStocks.forEach((s,i){const d=priceResults[i];const entry=s.entry||s.buyPrice||0;const current=d.price||0;const shares=s.shares||1000;const pnl=(current-entry)* shares;const pct=entry>0?((current-entry)/entry * 100):0;totalPnL+=pnl;if(pnl>0)winners++;else if(pnl<0)losers++;details.push({code:s.code||s.c,name:s.name||s.n||'',entry:entry,current:current,pnl:pnl,pct:pct,status:pnl>0?'profit':(pnl<0?'loss':'flat')})}`;
html = html.replace(oldRefreshPnL, newRefreshPnL);

// ============================================================
// 7. Add cache stats to dashboard (optional debug info)
// ============================================================

fs.writeFileSync(output, html);
console.log('✅ Level 2 optimizations applied:');
console.log('   • getPrice() cache (10s TTL)');
console.log('   • fetchKLine() cache (1hr TTL)');
console.log('   • getRealTechIndicators() cache (5min TTL)');
console.log('   • runHiddenGemsScan DOM batching (every 10 stocks)');
console.log('   • refreshPnL parallel price fetch');
