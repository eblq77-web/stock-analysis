#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - LIVE DATA EXPORTER
 * Exports JSON for dashboard consumption
 */

const fs = require('fs');
const https = require('https');

const CONFIG = {
  outputDir: require('os').homedir() + '/Desktop/Stock_Analysis',
  jsonFile: require('os').homedir() + '/Desktop/Stock_Analysis/dashboard_data.json'
};

const TODAY = new Date().toISOString().split('T')[0];

// Stock pool - 50 key stocks
const STOCKS = {
  // A-shares
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
  '300750': { name: '宁德时代', sector: '新能源', quality: 92 },
  '300059': { name: '东方财富', sector: '金融', quality: 80 },
  '300015': { name: '爱尔眼科', sector: '医药', quality: 85 },
  '300033': { name: '同花顺', sector: '科技', quality: 78 },
  '300122': { name: '智飞生物', sector: '医药', quality: 82 },
  '300347': { name: '泰格医药', sector: '医药', quality: 80 },
  '300408': { name: '三环集团', sector: '科技', quality: 72 },
  '870299': { name: '吉林碳谷', sector: '新材料', quality: 72 },
  '872926': { name: '贝特瑞', sector: '新能源', quality: 75 },
  '835670': { name: '数字人', sector: 'AI教育', quality: 68 },
  // HK stocks
  '0700': { name: '腾讯控股', sector: '科技', quality: 95 },
  '9988': { name: '阿里巴巴', sector: '科技', quality: 90 },
  '3690': { name: '美团', sector: '科技', quality: 85 },
  '1810': { name: '小米集团', sector: '科技', quality: 72 },
  '1024': { name: '快手', sector: '科技', quality: 75 },
  '2318': { name: '中国平安', sector: '金融', quality: 75 },
  '1398': { name: '工商银行', sector: '金融', quality: 70 },
};

const SECTOR_HEAT = {
  '科技': 90, '新能源': 88, '医药': 82, '消费': 75,
  '金融': 65, '公用': 80, '家电': 72, '化工': 70,
  '建材': 60, '能源': 45, '新材料': 85, 'AI教育': 88
};

function fetchStock(code) {
  return new Promise((resolve) => {
    const isHK = ['0700','9988','3690','1810','1024','2318','1398'].includes(code);
    const secid = isHK ? `0.${code}` : `1.${code}`;
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f57,f58,f169,f170,f171,f173`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            const price = (json.data.f43 / 100).toFixed(2);
            const change = parseFloat(((json.data.f170 / 100) - 100).toFixed(2));
            resolve({ code, price: parseFloat(price), change });
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function calculateScore(stock, change) {
  const qualityScore = stock.quality || 70;
  const sectorHeat = SECTOR_HEAT[stock.sector] || 70;
  
  let momentumScore = sectorHeat + (change > 3 ? 10 : change > 0 ? 5 : change < -3 ? -10 : 0);
  momentumScore = Math.min(100, Math.max(20, momentumScore));
  
  let smartMoneyScore = change > 5 ? 95 : change > 3 ? 85 : change > 0 ? 75 : 55;
  
  let riskScore = Math.abs(change) > 7 ? 50 : Math.abs(change) > 5 ? 60 : 80;
  
  const total = (smartMoneyScore * 0.40) + (qualityScore * 0.30) + (momentumScore * 0.20) + (riskScore * 0.10);
  
  let signal = 'HOLD';
  if (total >= 80) signal = 'STRONG';
  else if (total >= 70) signal = 'BUY';
  
  return {
    smart: Math.round(smartMoneyScore),
    quality: qualityScore,
    momentum: Math.round(momentumScore),
    risk: 100 - riskScore,
    total: Math.round(total * 10) / 10,
    signal
  };
}

async function main() {
  console.log('📡 Fetching live stock data...');
  
  const results = { indices: [], stocks: [], updated: new Date().toISOString() };
  const codes = Object.keys(STOCKS);
  
  // Fetch in batches
  for (const code of codes) {
    const data = await fetchStock(code);
    if (data) {
      const stock = STOCKS[code];
      const score = calculateScore(stock, data.change);
      results.stocks.push({
        code,
        name: stock.name,
        sector: stock.sector,
        price: data.price,
        change: data.change,
        ...score
      });
    }
  }
  
  // Sort by total score
  results.stocks.sort((a, b) => b.total - a.total);
  
  // Save JSON
  fs.writeFileSync(CONFIG.jsonFile, JSON.stringify(results, null, 2));
  console.log(`✅ Saved ${results.stocks.length} stocks to ${CONFIG.jsonFile}`);
}

main().catch(console.error);
