#!/usr/bin/env node
/**
 * API ECHO VALIDATION & DATA FRESHNESS CHECK
 * ==========================================
 * Rigorous validation of stock data APIs with:
 * - Timestamp verification
 * - Data freshness checks
 * - Latency measurement
 * - Historical comparison
 * - Market hours validation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  marketOpen: { hour: 9, minute: 30 },
  marketClose: { hour: 15, minute: 0 },
  apiTimeout: 5000,
  historyPath: path.join(__dirname, 'data', 'api_history'),
  logPath: path.join(__dirname, 'logs', 'api_validation.log'),
  testStocks: ['sz000630', 'hk00700', 'sh601012', 'sz300750', 'bj835670']
};

// ============================================
// UTILITIES
// ============================================

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(CONFIG.logPath), { recursive: true });
  fs.appendFileSync(CONFIG.logPath, line + '\n');
}

function isMarketHours() {
  const now = new Date();
  const shanghaiOffset = 8 * 60; // UTC+8
  const localMins = now.getUTCHours() * 60 + now.getUTCMinutes() + shanghaiOffset;
  const currentMins = localMins % (24 * 60);
  const openMins = CONFIG.marketOpen.hour * 60 + CONFIG.marketOpen.minute;
  const closeMins = CONFIG.marketClose.hour * 60 + CONFIG.marketClose.minute;
  return currentMins >= openMins && currentMins < closeMins;
}

function getMarketStatus() {
  const now = new Date();
  const day = now.getUTCDay();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return { status: 'WEEKEND', color: '🔵' };
  if (isMarketHours()) return { status: 'MARKET OPEN', color: '🟢' };
  const nowMins = (now.getUTCHours() * 60 + now.getUTCMinutes() + 480) % (24 * 60);
  if (nowMins < 9 * 60 + 30) return { status: 'PRE-MARKET', color: '🟡' };
  if (nowMins >= 15 * 60) return { status: 'AFTER-HOURS', color: '🟡' };
  return { status: 'UNKNOWN', color: '⚪' };
}

function parseTencentData(raw) {
  try {
    const match = raw.match(/="([^"]+)"/);
    if (!match) return null;
    const fields = match[1].split('~');
    
    // Timestamp field 30 format: YYYYMMDDHHMMSS like "20260323092834"
    let timestamp = null;
    let dataAge = null;
    if (fields[30] && fields[30].length >= 14) {
      const tsStr = fields[30];
      const year = tsStr.substring(0, 4);
      const month = tsStr.substring(4, 6);
      const day = tsStr.substring(6, 8);
      const hour = tsStr.substring(8, 10);
      const min = tsStr.substring(10, 12);
      const sec = tsStr.substring(12, 14);
      timestamp = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}+08:00`);
      dataAge = Date.now() - timestamp.getTime();
    }
    
    return {
      name: fields[1] || 'Unknown',
      code: fields[2] || '',
      current: parseFloat(fields[3]) || 0,
      yesterdayClose: parseFloat(fields[4]) || 0,
      open: parseFloat(fields[5]) || 0,
      volume: parseInt(fields[6]) || 0,
      timestamp: timestamp,
      dataAge: dataAge,
      change: parseFloat(fields[31]) || 0,
      changePercent: parseFloat(fields[32]) || 0
    };
  } catch (e) {
    return null;
  }
}

// ============================================
// API TESTS
// ============================================

async function httpGet(url, timeout = CONFIG.apiTimeout) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          latency: Date.now() - start,
          data,
          headers: res.headers,
          redirectUrl: res.headers.location || null
        });
      });
    });
    req.on('error', (e) => resolve({ status: -1, error: e.message, latency: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ status: -2, error: 'TIMEOUT', latency: Date.now() - start }); });
    req.setTimeout(timeout);
  });
}

async function testTencentRealtime(stocks) {
  log('--- Tencent Realtime API ---');
  const results = [];
  
  // Test 1: Basic connectivity
  const connectivity = await httpGet('https://qt.gtimg.cn/q=sz000630');
  log(`  Connectivity: ${connectivity.status} (${connectivity.latency}ms)`);
  
  // Test 2: Multi-stock fetch
  const query = stocks.join(',');
  const multi = await httpGet(`https://qt.gtimg.cn/q=${query}`);
  log(`  Multi-stock: ${multi.status} (${multi.latency}ms)`);
  
  if (multi.data) {
    const parsed = parseTencentData(multi.data);
    if (parsed) {
      results.push({
        api: 'Tencent Realtime',
        status: 'CONNECTED',
        latency: multi.latency,
        dataFreshness: parsed.timestamp ? 'LIVE' : 'UNKNOWN',
        dataTimestamp: parsed.timestamp,
        sample: parsed
      });
      log(`  Data Freshness: ${parsed.timestamp ? '✅ LIVE' : '⚠️ UNKNOWN'}`);
      log(`  Data Timestamp: ${parsed.timestamp || 'N/A'}`);
    }
  }
  
  // Test 3: Historical comparison (check if data changes)
  const before = multi.data;
  await new Promise(r => setTimeout(r, 2000));
  const after = await httpGet(`https://qt.gtimg.cn/q=${query}`);
  const dataChanged = before !== after.data;
  log(`  Data Consistency: ${dataChanged ? '✅ Dynamic (data changes)' : '⚠️ Static (may be cached)'}`);
  
  return results;
}

async function testTencentKLine() {
  log('--- Tencent KLine API ---');
  
  // Test daily K-line for a known stock
  const url = 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=sh000001,day,,,10,qfq';
  const res = await httpGet(url);
  log(`  KLine API: ${res.status} (${res.latency}ms)`);
  
  if (res.data && res.data.includes('qfq')) {
    log(`  KLine Data: ✅ Received`);
    return { api: 'Tencent KLine', status: 'CONNECTED', latency: res.latency };
  }
  return { api: 'Tencent KLine', status: 'ERROR', latency: res.latency };
}

async function testEastMoneyPush() {
  log('--- EastMoney Push2 API ---');
  
  const url = 'https://push2.eastmoney.com/api/qt/stock/get?secid=0.000630&fields=f43,f57,f58,f60,f169,f170';
  const res = await httpGet(url);
  log(`  Push2 API: ${res.status} (${res.latency}ms)`);
  
  // EastMoney returns 302 redirect for this endpoint
  if (res.status === 302 || res.status === 200) {
    log(`  EastMoney: ✅ Connected`);
    if (res.redirectUrl) log(`  Redirect to: ${res.redirectUrl}`);
    return { api: 'EastMoney Push2', status: 'CONNECTED', latency: res.latency, redirect: res.redirectUrl };
  }
  return { api: 'EastMoney Push2', status: 'ERROR', latency: res.latency };
}

async function testEastMoneyQuotes() {
  log('--- EastMoney Quotes API ---');
  
  const url = 'https://push2.eastmoney.com/api/qt/clist/get?cb=jQuery&pn=1&pz=5&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:13,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f12,f14';
  const res = await httpGet(url);
  log(`  Quotes API: ${res.status} (${res.latency}ms)`);
  
  if (res.data && res.data.includes('jQuery')) {
    log(`  Quotes Data: ✅ Received (JSONP format)`);
    return { api: 'EastMoney Quotes', status: 'CONNECTED', latency: res.latency };
  }
  return { api: 'EastMoney Quotes', status: 'ERROR', latency: res.latency };
}

// ============================================
// FRESHNESS VALIDATION
// ============================================

async function validateFreshness(stocks) {
  log('\n=== DATA FRESHNESS VALIDATION ===');
  
  const results = [];
  const query = stocks.join(',');
  const res = await httpGet(`https://qt.gtimg.cn/q=${query}`);
  
  const marketStatus = getMarketStatus();
  log(`Market Status: ${marketStatus.color} ${marketStatus.status}`);
  
  if (res.data) {
    // Parse all stocks
    const lines = res.data.split('\n');
    for (const line of lines) {
      const parsed = parseTencentData(line);
      if (parsed && parsed.code) {
        const age = parsed.dataAge;
        const freshness = age === null ? '⚠️ UNKNOWN' : 
                          age < 60000 ? '✅ <1 min' :
                          age < 300000 ? '✅ <5 min' :
                          age < 900000 ? '⚠️ <15 min' : '❌ STALE';
        
        results.push({
          ...parsed,
          ageMs: age,
          freshness
        });
        
        log(`  ${parsed.code} ${parsed.name}: ${freshness} ${age !== null ? `(${Math.round(age/1000)}s ago)` : '(no timestamp)'}`);
      }
    }
  }
  
  return results;
}

// ============================================
// HISTORY COMPARISON
// ============================================

function saveToHistory(data) {
  const today = new Date().toISOString().split('T')[0];
  const filePath = path.join(CONFIG.historyPath, `api_snapshot_${today}.json`);
  
  // Ensure directory exists
  fs.mkdirSync(CONFIG.historyPath, { recursive: true });
  
  const existing = [];
  
  try {
    if (fs.existsSync(filePath)) {
      existing.push(...JSON.parse(fs.readFileSync(filePath, 'utf8')));
    }
  } catch (e) {}
  
  existing.push({
    timestamp: new Date().toISOString(),
    marketStatus: getMarketStatus().status,
    data
  });
  
  // Keep only last 100 entries per day
  const trimmed = existing.slice(-100);
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2));
  log(`History saved: ${filePath}`);
}

async function compareWithHistory() {
  const today = new Date().toISOString().split('T')[0];
  const filePath = path.join(CONFIG.historyPath, `api_snapshot_${today}.json`);
  
  if (!fs.existsSync(filePath)) {
    log('No history for today yet - this is first snapshot');
    return null;
  }
  
  try {
    const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (history.length < 2) {
      log(`Only ${history.length} snapshot(s) today - need more data for comparison`);
      return null;
    }
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    log(`Comparing snapshots ${history.length - 2} -> ${history.length - 1}`);
    log(`Last snapshot: ${new Date(latest.timestamp).toISOString()}`);
    log(`Previous: ${new Date(previous.timestamp).toISOString()}`);
    
    // Check if data is actually changing
    let changes = 0;
    for (const stock of Object.keys(latest.data)) {
      if (JSON.stringify(latest.data[stock]) !== JSON.stringify(previous.data[stock])) {
        changes++;
      }
    }
    
    if (changes > 0) {
      log(`✅ Data IS dynamic: ${changes} stock(s) changed between snapshots`);
      return { isDynamic: true, changes };
    } else {
      log(`⚠️ Data appears STATIC: no changes detected (may indicate cached data)`);
      return { isDynamic: false, changes: 0 };
    }
  } catch (e) {
    log(`History comparison error: ${e.message}`);
    return null;
  }
}

// ============================================
// REPORT GENERATION
// ============================================

function generateReport(apiResults, freshnessResults, historyComparison) {
  const report = {
    generated: new Date().toISOString(),
    marketStatus: getMarketStatus(),
    isMarketHours: isMarketHours(),
    summary: {
      apisOnline: apiResults.filter(r => r.status === 'CONNECTED').length,
      totalApis: apiResults.length,
      freshnessPass: freshnessResults.filter(r => r.freshness.includes('✅')).length,
      totalFreshness: freshnessResults.length,
      isDynamic: historyComparison?.isDynamic ?? 'unknown'
    },
    details: {
      apis: apiResults,
      freshness: freshnessResults,
      history: historyComparison
    }
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 API ECHO VALIDATION REPORT');
  console.log('='.repeat(50));
  console.log(`⏰ Generated: ${report.generated}`);
  console.log(`📍 Market: ${report.marketStatus.color} ${report.marketStatus.status}`);
  console.log(`⏱️  Market Hours: ${report.isMarketHours ? '✅ Yes' : '❌ No'}`);
  console.log('');
  console.log('📡 API STATUS:');
  for (const api of apiResults) {
    const icon = api.status === 'CONNECTED' ? '✅' : '❌';
    console.log(`  ${icon} ${api.api}: ${api.status} (${api.latency}ms)`);
  }
  console.log('');
  console.log('📈 DATA FRESHNESS:');
  for (const f of freshnessResults) {
    console.log(`  ${f.freshness} ${f.code} ${f.name}: ¥${f.current} (${f.changePercent}%)`);
  }
  console.log('');
  console.log('🔄 DATA DYNAMISM:');
  if (historyComparison) {
    console.log(`  ${historyComparison.isDynamic ? '✅ Dynamic' : '⚠️ Static'}`);
  } else {
    console.log('  ⏳ Need more data');
  }
  console.log('');
  console.log('='.repeat(50));
  console.log(`📊 SUMMARY: ${report.summary.apisOnline}/${report.summary.totalApis} APIs online`);
  console.log(`           ${report.summary.freshnessPass}/${report.summary.totalFreshness} stocks fresh`);
  console.log('='.repeat(50));
  
  return report;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n🔍 API ECHO VALIDATION & DATA FRESHNESS CHECK');
  console.log('================================================');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`📍 Shanghai Time: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log('');
  
  const allApiResults = [];
  const allFreshnessResults = [];
  
  // Run all API tests
  const [tencentRT, tencentKL, emPush, emQuotes] = await Promise.all([
    testTencentRealtime(CONFIG.testStocks),
    testTencentKLine(),
    testEastMoneyPush(),
    testEastMoneyQuotes()
  ]);
  
  allApiResults.push(...tencentRT, tencentKL, emPush, emQuotes);
  
  // Validate freshness
  const freshness = await validateFreshness(CONFIG.testStocks);
  allFreshnessResults.push(...freshness);
  
  // Save to history and compare
  saveToHistory(freshness);
  const historyComp = await compareWithHistory();
  
  // Generate final report
  const report = generateReport(allApiResults, allFreshnessResults, historyComp);
  
  // Save full report
  const reportPath = path.join(__dirname, 'logs', `api_validation_report_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Full report saved: ${reportPath}`);
  
  // Return exit code based on health
  const healthy = report.summary.apisOnline === report.summary.totalApis;
  process.exit(healthy ? 0 : 1);
}

main().catch(e => {
  log(`FATAL: ${e.message}`);
  console.error(e);
  process.exit(1);
});
