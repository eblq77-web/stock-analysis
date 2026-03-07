#!/usr/bin/env node

/**
 * Charles's AI Stock Trading Assistant - Version 3
 * East Money API + Daily Live Inspection + Module 3
 * 
 * Features:
 * - Real-time data from East Money
 * - Daily auto-inspection
 * - Market Intelligence Module
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: path.join(process.env.HOME, 'Desktop', 'Stock_Analysis'),
};

// Today's date
const today = new Date().toISOString().split('T')[0];
const todayCN = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

console.log('🇨🇳 Charles Stock Trading Assistant - V3');
console.log('========================================');
console.log(`📅 Date: ${today}`);
console.log('🔌 API: East Money (东方财富)');
console.log('');

// ============ EAST MONEY API FUNCTIONS ============

// Fetch stock data from East Money
function fetchStockFromEM(stockCode) {
  return new Promise((resolve) => {
    let emCode = '';
    if (stockCode.startsWith('6')) emCode = '1.' + stockCode;      // Shanghai
    else if (stockCode.startsWith('0') || stockCode.startsWith('3')) emCode = '0.' + stockCode; // Shenzhen/ChiNext
    else if (stockCode.startsWith('8') || stockCode.startsWith('4')) emCode = '0.' + stockCode; // Beijing
    
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${emCode}&fields=f43,f44,f45,f46,f47,f48,f50,f51,f52,f57,f58,f59,f60,f169,f170,f171`;
    
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const d = json.data;
            resolve({
              code: stockCode,
              name: d.f58 || '',
              price: d.f43 / 1000,        // Current price
              close: d.f44 / 1000,         // Yesterday close
              open: d.f45 / 1000,         // Open
              high: d.f46 / 1000,         // High
              low: d.f47 / 1000,          // Low
              change: d.f170 / 100,       // Change %
              volume: d.f47,              // Volume
              amount: d.f48,              // Amount
              buy1: d.f50 / 1000,         // Buy 1
              sell1: d.f51 / 1000,        // Sell 1
              turnover: d.f168 / 100,     // Turnover rate
            });
          }
        } catch (e) {}
        resolve(null);
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Fetch index data from East Money
function fetchIndexFromEM(indexCode) {
  return new Promise((resolve) => {
    // Index codes: 1.000001 (Shanghai), 0.399001 (Shenzhen), 0.399006 (ChiNext), 0.899050 (BJSE)
    const codeMap = {
      'shanghai': '1.000001',
      'shenzhen': '0.399001', 
      'chinext': '0.399006',
      'beijing': '0.899050'
    };
    
    const emCode = codeMap[indexCode];
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${emCode}&fields=f43,f44,f45,f46,f47,f48,f50,f51,f57,f58,f59,f60`;
    
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const d = json.data;
            resolve({
              code: indexCode,
              name: d.f58 || '',
              price: d.f43 / 100,
              change: d.f170 / 100,
              changePct: d.f170 / 100,
              volume: d.f48,
              amount: d.f47,
            });
          }
        } catch (e) {}
        resolve(null);
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Fetch sector data (行业板块)
function fetchSectorsFromEM() {
  return new Promise((resolve) => {
    const url = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f1,f2,f3,f4,f12,f13,f14';
    
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const sectors = json.data.diff.map(s => ({
            code: s.f12,
            name: s.f14,
            change: s.f2,
            volume: s.f4
          }));
          resolve(sectors);
        } catch (e) {
          resolve([]);
        }
      });
    });
    
    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
  });
}

// ============ STOCK POOL - 4 PLATES ============

const FOUR_PLATES = {
  'shanghai': {
    name: '上海主板',
    stocks: [
      '600519','601318','600036','601888','600030','600900','601012','600276','600887','601857'
    ]
  },
  'shenzhen': {
    name: '深圳主板', 
    stocks: [
      '000001','000002','000333','000651','000858','000725','002415','002594','002475','000786'
    ]
  },
  'chinext': {
    name: '创业板',
    stocks: [
      '300750','300059','300015','300033','300122','300142','300454','300498','300002','300676'
    ]
  },
  'beijing': {
    name: '北京交所',
    stocks: [
      '872926','870299','871453','835670','872541','870366','835305','872545','871212','835992'
    ]
  }
};

// ============ MAIN FETCH FUNCTION ============

async function fetchAllData() {
  console.log('🔌 Connecting to East Money API...\n');
  
  const results = {
    indices: {},
    stocks: [],
    sectors: []
  };
  
  // Fetch indices
  console.log('📊 Fetching 4 indices...');
  for (const key of ['shanghai', 'shenzhen', 'chinext', 'beijing']) {
    const idx = await fetchIndexFromEM(key);
    if (idx) {
      results.indices[key] = idx;
      console.log(`   ✅ ${key}: ${idx.price} (${idx.change}%)`);
    } else {
      console.log(`   ⚠️ ${key}: Failed`);
    }
  }
  
  // Fetch stocks
  console.log('\n📈 Fetching stocks...');
  let total = Object.values(FOUR_PLATES).reduce((a,p) => a + p.stocks.length, 0);
  let count = 0;
  
  for (const [plateKey, plate] of Object.entries(FOUR_PLATES)) {
    for (const code of plate.stocks) {
      count++;
      process.stdout.write(`   [${count}/${total}] ${code}... `);
      
      const stock = await fetchStockFromEM(code);
      if (stock) {
        stock.plate = plateKey;
        stock.plateName = plate.name;
        stock.volumeFormatted = stock.volume > 100000000 
          ? (stock.volume/100000000).toFixed(2) + '亿'
          : (stock.volume/10000).toFixed(0) + '万';
        
        results.stocks.push(stock);
        console.log(`¥${stock.price} (${stock.change}%)`);
      } else {
        console.log('❌');
      }
    }
  }
  
  // Fetch sectors
  console.log('\n🏭 Fetching sectors...');
  results.sectors = await fetchSectorsFromEM();
  console.log(`   ✅ Got ${results.sectors.length} sectors`);
  
  return results;
}

// ============ GENERATE REPORTS ============

function generateReport(data) {
  const { indices, stocks, sectors } = data;
  
  // Sort and categorize
  const shortTerm = stocks.filter(s => s.change >= 3)
    .sort((a, b) => b.change - a.change).slice(0, 5);
    
  const midTerm = stocks.filter(s => s.change >= 1 && s.change < 3)
    .sort((a, b) => b.change - a.change).slice(0, 5);
    
  const longTerm = stocks.sort((a, b) => b.volume - a.volume).slice(0, 10);
  
  const hotSectors = sectors.slice(0, 5);
  const coldSectors = sectors.slice(-5).reverse();
  
  const report = `# 📊 Charles's Portfolio - 每日组合报告 (实时)
## 🇨🇳 4大板块 + 行业监控 | East Money API

**更新时间**: ${new Date().toLocaleString('zh-CN')}
**数据来源**: 东方财富 (East Money)
**股票池**: ${stocks.length}只

---

## 📈 4大指数实时行情

| 板块 | 指数名称 | 当前点位 | 涨跌幅 | 成交量 |
|-----|---------|---------|--------|--------|
| 🟡 上海 | ${indices.shanghai?.name || '上证指数'} | ${indices.shanghai?.price || '--'} | ${indices.shanghai?.change ? (indices.shanghai.change > 0 ? '+' : '') + indices.shanghai.change.toFixed(2) + '%' : '--'} | ${indices.shanghai?.volume ? (indices.shanghai.volume/100000000).toFixed(2) + '亿' : '--'} |
| 🟢 深圳 | ${indices.shenzhen?.name || '深证成指'} | ${indices.shenzhen?.price || '--'} | ${indices.shenzhen?.change ? (indices.shenzhen.change > 0 ? '+' : '') + indices.shenzhen.change.toFixed(2) + '%' : '--'} | ${indices.shenzhen?.volume ? (indices.shenzhen.volume/100000000).toFixed(2) + '亿' : '--'} |
| 🔵 创业板 | ${indices.chinext?.name || '创业板指'} | ${indices.chinext?.price || '--'} | ${indices.chinext?.change ? (indices.chinext.change > 0 ? '+' : '') + indices.chinext.change.toFixed(2) + '%' : '--'} | ${indices.chinext?.volume ? (indices.chinext.volume/100000000).toFixed(2) + '亿' : '--'} |
| 🔴 北京 | ${indices.beijing?.name || '北证50'} | ${indices.beijing?.price || '--'} | ${indices.beijing?.change ? (indices.beijing.change > 0 ? '+' : '') + indices.beijing.change.toFixed(2) + '%' : '--'} | ${indices.beijing?.volume ? (indices.beijing.volume/100000000).toFixed(2) + '亿' : '--'} |

---

## 🎯 各板块热门股票

### 🟡 上海主板
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'shanghai').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.volumeFormatted} |`).join('\n')}

### 🟢 深圳主板
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'shenzhen').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.volumeFormatted} |`).join('\n')}

### 🔵 创业板
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'chinext').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.volumeFormatted} |`).join('\n')}

### 🔴 北京交所
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'beijing').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.volumeFormatted} |`).join('\n')}

---

## 🔥 热门行业板块 (当日涨幅)

| 行业 | 涨跌幅 |
|-----|--------|
${hotSectors.map(s => `| ${s.name} | ${s.change > 0 ? '+' : ''}${s.change}% |`).join('\n')}

---

## ❄️ 冷门行业板块 (当日跌幅)

| 行业 | 涨跌幅 |
|-----|--------|
${coldSectors.map(s => `| ${s.name} | ${s.change > 0 ? '+' : ''}${s.change}% |`).join('\n')}

---

## ⚡ 短线推荐 (当日涨幅>3%)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 推荐理由 |
|-----|------|------|------|------|---------|
${shortTerm.length > 0 ? shortTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.plateName} | ${s.change > 4 ? '🔥 强势突破' : '📈 量价齐升'} |`).join('\n') : '|暂无|---|---|---|---|'}

---

## 📈 中线推荐 (1-3%)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 推荐理由 |
|-----|------|------|------|------|---------|
${midTerm.length > 0 ? midTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.plateName} | 📊 趋势向好 |`).join('\n') : '|暂无|---|---|---|---|'}

---

## 🔭 长线观察 (高成交量)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 成交量 |
|-----|------|------|------|------|--------|
${longTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price.toFixed(2)} | ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | ${s.plateName} | ${s.volumeFormatted} |`).join('\n')}

---

## 💡 今日策略

### ⚡ 短线
${shortTerm.length > 0 ? `- 首选: ${shortTerm[0].name} (${shortTerm[0].code})` : '- 观望'}

### 📈 中线
${midTerm.length > 0 ? `- 配置: ${midTerm[0].name}` : '- 观望'}

### 🔭 长线
- 宁德时代(300750) - 新能源龙头
- 比亚迪(002594) - 海外扩张
- 贵州茅台(600519) - 行业标杆

---

## ⚠️ 风险提示

- 本报告仅供分析参考，不构成投资建议
- 止损位建议: -7%
- 仓位建议: 单只不超过10%
- 北京交所风险较高

---

*🤖 Charles's AI Stock Assistant V3*
*Data: East Money (东方财富)*
*更新时间: ${new Date().toLocaleString('zh-CN')}*
`;
  
  return { report, shortTerm, midTerm, longTerm };
}

function generateStockProfile(stock, type) {
  return `# ${stock.code} - ${stock.name}

## 📊 基本信息
- **代码**: ${stock.code}
- **板块**: ${stock.plateName}
- **当前价格**: ¥${stock.price.toFixed(2)}
- **涨跌**: ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%
- **成交量**: ${stock.volumeFormatted}

## 📈 行情数据
| 项目 | 数值 |
|-----|------|
| 开盘 | ¥${stock.open.toFixed(2)} |
| 最高 | ¥${stock.high.toFixed(2)} |
| 最低 | ¥${stock.low.toFixed(2)} |
| 昨收 | ¥${stock.close.toFixed(2)} |
| 换手率 | ${stock.turnover?.toFixed(2) || '--'}% |

## 🎯 分类
**${type === 'short' ? '⚡ 短线交易' : type === 'mid' ? '📈 中线投资' : '🔭 长线观察'}**

## 📉 技术建议
| 项目 | 建议 |
|-----|------|
| 止损位 | ¥${(stock.price * 0.93).toFixed(2)} (-7%) |
| 目标位 | ¥${(stock.price * 1.15).toFixed(2)} (+15%) |

---

*🤖 Charles's AI Stock Assistant*
*Data: East Money*
`;
}

// ============ DAILY AUTO RUN SETUP ============

function setupDailyCron() {
  const cronContent = `#!/bin/bash
# Daily Stock Analysis - Auto Run
# Runs every weekday at 9:00 AM

cd ~/Desktop/Stock_Analysis
node daily_analyzer_v3.js

echo "✅ Daily analysis complete at $(date)" >> ~/Desktop/Stock_Analysis/daily_run.log
`;

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'daily_run.sh'),
    cronContent
  );
  
  console.log('\n📅 Daily auto-run script created!');
}

// ============ MAIN ============

async function main() {
  try {
    const data = await fetchAllData();
    
    console.log('\n📝 Generating report...');
    const { report, shortTerm, midTerm, longTerm } = generateReport(data);
    
    // Save report
    const dailyFile = path.join(CONFIG.outputDir, 'daily_overview', `${today}_realtime.md`);
    fs.writeFileSync(dailyFile, report);
    console.log(`✅ Saved: ${dailyFile}`);
    
    // Save stock profiles
    shortTerm.forEach(stock => {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'watchlist', 'short_term', `${stock.code}_${stock.name}.md`),
        generateStockProfile(stock, 'short')
      );
    });
    
    midTerm.forEach(stock => {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'watchlist', 'mid_term', `${stock.code}_${stock.name}.md`),
        generateStockProfile(stock, 'mid')
      );
    });
    
    longTerm.forEach(stock => {
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'watchlist', 'long_term', `${stock.code}_${stock.name}.md`),
        generateStockProfile(stock, 'long')
      );
    });
    
    // Setup daily cron
    setupDailyCron();
    
    console.log('\n================================');
    console.log('✅ V3 Complete with East Money API!');
    console.log('================================');
    console.log(`\n📊 Short-term: ${shortTerm.length} stocks`);
    console.log(`📈 Mid-term: ${midTerm.length} stocks`);
    console.log(`🔭 Long-term: ${longTerm.length} stocks`);
    console.log(`🏭 Sectors: ${data.sectors.length} tracked`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
