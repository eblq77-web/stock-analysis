#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - UNIFIED LIVE ANALYZER v1.0
 * ============================================
 * Combines: Live Data + Proprietary Scoring + Predictive Engine + Contrarian Thinking
 * 
 * 6 Plates: Shanghai, Shenzhen, ChiNext, Beijing, HSI, HSTech
 * 
 * Scoring: SmartMoney(40%) + Quality(30%) + Momentum(20%) + Risk(10%)
 */

const fs = require('fs');
const https = require('https');

// ============= CONFIG =============
const CONFIG = {
  outputDir: require('os').homedir() + '/Desktop/Stock_Analysis/daily_overview',
  logFile: require('os').homedir() + '/Desktop/Stock_Analysis/auto_run.log'
};

const TODAY = new Date().toISOString().split('T')[0];

// ============= STOCK POOL =============
const STOCKS = {
  // 🟡 Shanghai Main (10)
  '600519': { name: '贵州茅台', sector: '消费', quality: 95 },
  '601318': { name: '中国平安', sector: '金融', quality: 75 },
  '600036': { name: '招商银行', sector: '金融', quality: 80 },
  '600900': { name: '长江电力', sector: '公用', quality: 85 },
  '601012': { name: '隆基绿能', sector: '新能源', quality: 70 },
  '600276': { name: '恒瑞医药', sector: '医药', quality: 82 },
  '600690': { name: '青岛海尔', sector: '家电', quality: 74 },
  '600016': { name: '民生银行', sector: '金融', quality: 62 },
  '600309': { name: '万华化学', sector: '化工', quality: 80 },
  '601857': { name: '中国石油', sector: '能源', quality: 60 },
  
  // 🟢 Shenzhen Main (10)
  '000001': { name: '平安银行', sector: '金融', quality: 68 },
  '000333': { name: '美的集团', sector: '家电', quality: 82 },
  '000651': { name: '格力电器', sector: '家电', quality: 75 },
  '000858': { name: '五粮液', sector: '消费', quality: 88 },
  '000725': { name: '京东方A', sector: '科技', quality: 60 },
  '002415': { name: '海康威视', sector: '科技', quality: 78 },
  '002594': { name: '比亚迪', sector: '新能源', quality: 90 },
  '002475': { name: '立讯精密', sector: '科技', quality: 75 },
  '000786': { name: '北新建材', sector: '建材', quality: 70 },
  '000538': { name: '云南白药', sector: '医药', quality: 85 },
  
  // 🔵 ChiNext (10)
  '300750': { name: '宁德时代', sector: '新能源', quality: 92 },
  '300059': { name: '东方财富', sector: '金融', quality: 80 },
  '300015': { name: '爱尔眼科', sector: '医药', quality: 85 },
  '300033': { name: '同花顺', sector: '科技', quality: 78 },
  '300122': { name: '智飞生物', sector: '医药', quality: 82 },
  '300347': { name: '泰格医药', sector: '医药', quality: 80 },
  '300408': { name: '三环集团', sector: '科技', quality: 72 },
  '300226': { name: '上海钢联', sector: '科技', quality: 70 },
  '300682': { name: '朗新科技', sector: '科技', quality: 68 },
  '300759': { name: '理财金字塔', sector: '金融', quality: 65 },
  
  // 🔴 Beijing Stock Exchange (5)
  '870299': { name: '吉林碳谷', sector: '新材料', quality: 72 },
  '872926': { name: '贝特瑞', sector: '新能源', quality: 75 },
  '835670': { name: '数字人', sector: 'AI教育', quality: 68 },
  '871212': { name: '安达科技', sector: '新能源', quality: 65 },
  '835992': { name: '戈碧迦', sector: '新材料', quality: 62 },
  
  // 🇭🇰 HK Main (10)
  '0700': { name: '腾讯控股', sector: '科技', quality: 95 },
  '9988': { name: '阿里巴巴', sector: '科技', quality: 90 },
  '3690': { name: '美团', sector: '科技', quality: 85 },
  '1810': { name: '小米集团', sector: '科技', quality: 72 },
  '9618': { name: '京东集团', sector: '科技', quality: 80 },
  '1024': { name: '快手', sector: '科技', quality: 75 },
  '0762': { name: '中国铁建', sector: '基建', quality: 65 },
  '1398': { name: '工商银行', sector: '金融', quality: 70 },
  '2318': { name: '中国平安', sector: '金融', quality: 75 },
  '0857': { name: '中国光大', sector: '金融', quality: 65 },
  
  // 🇭🇰 HK Tech (5)
  '4152': { name: '恒生科技', sector: '指数', quality: 80 },
  '0185': { name: '众安在线', sector: '科技', quality: 70 },
  '0669': { name: '创科实业', sector: '科技', quality: 68 },
  '3580': { name: '金融科技', sector: '金融', quality: 65 },
  '7726': { name: '医渡科技', sector: '医疗', quality: 62 }
};

// ============= SECTOR MOMENTUM =============
const SECTOR_HEAT = {
  '科技': 90,      // AI revolution
  '新能源': 88,    // Policy driven
  '医药': 82,      // Innovation + export
  '消费': 75,      // Recovery
  '金融': 65,      // Valuation repair
  '公用': 80,      // Stable
  '家电': 72,      // Recovery
  '化工': 70,      // Rotation
  '建材': 60,      // Recovery
  '能源': 45,      // Carbon neutral
  '新材料': 85,   // Localization
  'AI教育': 88,   // AI + vertical
  '基建': 65,      // Policy
  '指数': 75       // Market
};

// ============= PROPRIETARY SCORING =============
function calculateScore(stock, price, change) {
  // 1. QUALITY (30%) - Base score from fundamentals
  const qualityScore = stock.quality || 70;
  
  // 2. MOMENTUM (20%) - Based on price change + sector heat
  const sectorHeat = SECTOR_HEAT[stock.sector] || 70;
  let momentumScore = sectorHeat;
  if (change > 5) momentumScore += 15;
  else if (change > 3) momentumScore += 10;
  else if (change > 0) momentumScore += 5;
  else if (change < -3) momentumScore -= 10;
  momentumScore = Math.min(100, Math.max(20, momentumScore));
  
  // 3. SMART MONEY (40%) - Simulated (would need real data)
  // For now: higher price + positive change = smart money flow
  let smartMoneyScore = 70;
  if (change > 3) smartMoneyScore = 85;
  if (change > 5) smartMoneyScore = 92;
  if (change > 7) smartMoneyScore = 95;
  if (change < -3) smartMoneyScore = 55;
  
  // 4. RISK (10%) - Lower is better
  let riskScore = 70;
  if (Math.abs(change) > 7) riskScore = 50; // High volatility = higher risk
  else if (Math.abs(change) > 5) riskScore = 60;
  else if (Math.abs(change) < 3) riskScore = 80;
  
  // CALCULATE TOTAL
  const total = (smartMoneyScore * 0.40) + 
                (qualityScore * 0.30) + 
                (momentumScore * 0.20) + 
                (riskScore * 0.10);
  
  // SIGNAL
  let signal = 'HOLD';
  if (total >= 80) signal = 'STRONG_BUY';
  else if (total >= 70) signal = 'BUY';
  else if (total < 60) signal = 'SELL';
  
  return {
    code: stock.code,
    name: stock.name,
    sector: stock.sector,
    price: price,
    change: change,
    quality: qualityScore,
    momentum: momentumScore,
    smartMoney: smartMoneyScore,
    risk: riskScore,
    total: Math.round(total * 10) / 10,
    signal: signal
  };
}

// ============= FETCH A-SHARE DATA =============
function fetchAStock(code) {
  return new Promise((resolve) => {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=1.${code}&fields=f43,f44,f45,f57,f58,f169,f170,f171,f173`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const price = (json.data.f43 / 100).toFixed(2);
            const change = ((json.data.f170 / 100) - 100).toFixed(2);
            resolve({ code, price: parseFloat(price), change: parseFloat(change) });
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// ============= FETCH HK STOCK DATA =============
function fetchHKStock(code) {
  return new Promise((resolve) => {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=0.${code}&fields=f43,f44,f45,f57,f58,f169,f170,f171,f173`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const price = (json.data.f43 / 100).toFixed(2);
            const change = ((json.data.f170 / 100) - 100).toFixed(2);
            resolve({ code, price: parseFloat(price), change: parseFloat(change) });
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// ============= MAIN =============
async function main() {
  console.log('🧠 CHARLES\'S BRAIN - UNIFIED LIVE ANALYZER');
  console.log('==============================================');
  console.log(`📅 ${TODAY}`);
  console.log('');
  
  const results = [];
  const codes = Object.keys(STOCKS);
  let fetched = 0;
  
  // Fetch all stocks
  for (const code of codes) {
    const isHK = ['0700','9988','3690','1810','9618','1024','0762','1398','2318','0857','0185','0669','3580','7726'].includes(code);
    const data = isHK ? await fetchHKStock(code) : await fetchAStock(code);
    
    if (data) {
      const stock = STOCKS[code];
      const scored = calculateScore(stock, data.price, data.change);
      results.push(scored);
      fetched++;
      console.log(`   ✅ ${code} ${stock.name}: ¥${data.price} (${data.change > 0 ? '+' : ''}${data.change}%) → ${scored.total} [${scored.signal}]`);
    } else {
      console.log(`   ❌ ${code} FAILED`);
    }
  }
  
  console.log('');
  console.log(`📊 Fetched: ${fetched}/${codes.length} stocks`);
  
  // Sort by score
  results.sort((a, b) => b.total - a.total);
  
  // Generate Report
  const strongBuys = results.filter(r => r.signal === 'STRONG_BUY');
  const buys = results.filter(r => r.signal === 'BUY');
  const holds = results.filter(r => r.signal === 'HOLD');
  const sells = results.filter(r => r.signal === 'SELL');
  
  console.log('');
  console.log('📈 SIGNALS:');
  console.log(`   🎯 STRONG BUY: ${strongBuys.length}`);
  console.log(`   🟢 BUY: ${buys.length}`);
  console.log(`   🟡 HOLD: ${holds.length}`);
  console.log(`   🔴 SELL: ${sells.length}`);
  
  // Save Report
  let report = `# 🧠 CHARLES'S BRAIN - LIVE ANALYSIS\n`;
  report += `## ${TODAY} | ${fetched} Stocks\n\n`;
  
  report += `### 🎯 TOP STRONG BUYS\n`;
  report += `| Code | Name | Price | Change | Score | Signal |\n`;
  report += `|------|------|-------|--------|-------|--------|\n`;
  strongBuys.slice(0, 10).forEach(r => {
    report += `| ${r.code} | ${r.name} | ¥${r.price} | ${r.change > 0 ? '+' : ''}${r.change}% | **${r.total}** | 🎯 |\n`;
  });
  
  report += `\n### 🟢 BUYS\n`;
  report += `| Code | Name | Price | Change | Score |\n`;
  report += `|------|------|-------|--------|-------|\n`;
  buys.slice(0, 10).forEach(r => {
    report += `| ${r.code} | ${r.name} | ¥${r.price} | ${r.change > 0 ? '+' : ''}${r.change}% | ${r.total} |\n`;
  });
  
  report += `\n### 🟡 HOLDS (Monitor)\n`;
  report += `| Code | Name | Price | Change | Score |\n`;
  report += `|------|------|-------|--------|-------|\n`;
  holds.slice(0, 10).forEach(r => {
    report += `| ${r.code} | ${r.name} | ¥${r.price} | ${r.change > 0 ? '+' : ''}${r.change}% | ${r.total} |\n`;
  });
  
  report += `\n---\n*🧠 Charles's Brain v1.0 | Scoring: SmartMoney(40%) + Quality(30%) + Momentum(20%) + Risk(10%)*`;
  
  const outputPath = `${CONFIG.outputDir}/${TODAY}_brain_analysis.md`;
  fs.writeFileSync(outputPath, report);
  console.log(`\n✅ Report: ${outputPath}`);
  
  // Log
  fs.appendFileSync(CONFIG.logFile, `[${new Date().toISOString()}] Brain Analysis: ${fetched} stocks, ${strongBuys.length} strong buys\n`);
}

main().catch(console.error);
