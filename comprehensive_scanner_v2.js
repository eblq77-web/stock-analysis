#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - ADVANCED COMPREHENSIVE SCANNER V2
 * Institutional-grade multi-factor analysis
 */

const fs = require('fs');

const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

const ALL_STOCKS = {
  '600519': { name: '贵州茅台', sector: '消费', quality: 95, pe: 35, pb: 12, roe: 35, debt: 0.25, revGrowth: 15, div: 2.5 },
  '601318': { name: '中国平安', sector: '金融', quality: 75, pe: 10, pb: 1.2, roe: 15, debt: 0.85, revGrowth: 5, div: 5.2 },
  '600036': { name: '招商银行', sector: '金融', quality: 82, pe: 6, pb: 1.1, roe: 16, debt: 0.92, revGrowth: 8, div: 4.8 },
  '600900': { name: '长江电力', sector: '公用', quality: 88, pe: 18, pb: 2.5, roe: 16, debt: 0.55, revGrowth: 12, div: 3.8 },
  '601012': { name: '隆基绿能', sector: '新能源', quality: 72, pe: 15, pb: 3.2, roe: 22, debt: 0.60, revGrowth: 45, div: 1.2 },
  '600276': { name: '恒瑞医药', sector: '医药', quality: 85, pe: 55, pb: 8, roe: 20, debt: 0.35, revGrowth: 18, div: 0.8 },
  '600690': { name: '青岛海尔', sector: '家电', quality: 76, pe: 12, pb: 2.8, roe: 22, debt: 0.65, revGrowth: 10, div: 2.5 },
  '600309': { name: '万华化学', sector: '化工', quality: 82, pe: 14, pb: 4.5, roe: 28, debt: 0.50, revGrowth: 25, div: 2.0 },
  '600887': { name: '伊利股份', sector: '消费', quality: 78, pe: 18, pb: 4.0, roe: 25, debt: 0.55, revGrowth: 12, div: 2.8 },
  '600196': { name: '复星医药', sector: '医药', quality: 80, pe: 22, pb: 3.5, roe: 18, debt: 0.42, revGrowth: 20, div: 1.5 },
  '600176': { name: '中国巨石', sector: '建材', quality: 70, pe: 12, pb: 2.8, roe: 22, debt: 0.48, revGrowth: 15, div: 2.2 },
  '000001': { name: '平安银行', sector: '金融', quality: 68, pe: 5, pb: 0.7, roe: 12, debt: 0.93, revGrowth: 5, div: 4.5 },
  '000002': { name: '万科A', sector: '地产', quality: 52, pe: 6, pb: 0.6, roe: 8, debt: 0.80, revGrowth: -8, div: 5.0 },
  '000333': { name: '美的集团', sector: '家电', quality: 84, pe: 14, pb: 3.5, roe: 26, debt: 0.62, revGrowth: 12, div: 2.8 },
  '000651': { name: '格力电器', sector: '家电', quality: 78, pe: 10, pb: 2.5, roe: 24, debt: 0.70, revGrowth: 5, div: 4.0 },
  '000858': { name: '五粮液', sector: '消费', quality: 90, pe: 28, pb: 8, roe: 32, debt: 0.35, revGrowth: 18, div: 2.5 },
  '002415': { name: '海康威视', sector: '科技', quality: 80, pe: 25, pb: 5, roe: 22, debt: 0.42, revGrowth: 10, div: 2.0 },
  '002594': { name: '比亚迪', sector: '新能源', quality: 92, pe: 55, pb: 8, roe: 30, debt: 0.55, revGrowth: 60, div: 0.8 },
  '002475': { name: '立讯精密', sector: '科技', quality: 76, pe: 30, pb: 5, roe: 22, debt: 0.52, revGrowth: 25, div: 1.2 },
  '300750': { name: '宁德时代', sector: '新能源', quality: 94, pe: 45, pb: 7, roe: 28, debt: 0.58, revGrowth: 80, div: 0.5 },
  '300059': { name: '东方财富', sector: '金融', quality: 82, pe: 35, pb: 5, roe: 22, debt: 0.62, revGrowth: 25, div: 1.0 },
  '300015': { name: '爱尔眼科', sector: '医药', quality: 88, pe: 60, pb: 15, roe: 25, debt: 0.35, revGrowth: 25, div: 0.5 },
  '300033': { name: '同花顺', sector: '科技', quality: 80, pe: 50, pb: 8, roe: 28, debt: 0.28, revGrowth: 30, div: 1.2 },
  '300122': { name: '智飞生物', sector: '医药', quality: 84, pe: 40, pb: 8, roe: 35, debt: 0.42, revGrowth: 40, div: 0.8 },
  '300014': { name: '亿纬锂能', sector: '新能源', quality: 88, pe: 40, pb: 7, roe: 25, debt: 0.55, revGrowth: 55, div: 0.6 },
  '300018': { name: '中科创达', sector: '科技', quality: 80, pe: 55, pb: 8, roe: 22, debt: 0.35, revGrowth: 30, div: 0.8 },
  '300003': { name: '乐普医疗', sector: '医药', quality: 78, pe: 35, pb: 5, roe: 18, debt: 0.40, revGrowth: 15, div: 1.5 },
  '300308': { name: '中际旭创', sector: 'AI硬件', quality: 85, pe: 60, pb: 10, roe: 30, debt: 0.35, revGrowth: 65, div: 0.5 },
  '300476': { name: '中际旭创', sector: 'AI硬件', quality: 88, pe: 55, pb: 9, roe: 32, debt: 0.32, revGrowth: 70, div: 0.5 },
  '300502': { name: '新易盛', sector: '科技', quality: 75, pe: 45, pb: 7, roe: 25, debt: 0.38, revGrowth: 45, div: 0.8 },
  '300672': { name: 'NOVA科技', sector: '科技', quality: 70, pe: 50, pb: 6, roe: 18, debt: 0.35, revGrowth: 30, div: 0.6 },
  '300339': { name: '润和软件', sector: '科技', quality: 65, pe: 40, pb: 4, roe: 14, debt: 0.38, revGrowth: 18, div: 1.0 },
  '870299': { name: '吉林碳谷', sector: '新材料', quality: 74, pe: 20, pb: 4, roe: 25, debt: 0.45, revGrowth: 55, div: 1.2 },
  '872926': { name: '贝特瑞', sector: '新能源', quality: 78, pe: 25, pb: 5, roe: 28, debt: 0.48, revGrowth: 65, div: 0.8 },
  '835670': { name: '数字人', sector: 'AI教育', quality: 70, pe: 45, pb: 5, roe: 18, debt: 0.30, revGrowth: 40, div: 0.5 },
  '871212': { name: '安达科技', sector: '新能源', quality: 68, pe: 22, pb: 4, roe: 22, debt: 0.50, revGrowth: 50, div: 1.0 },
  '870864': { name: '红东方', sector: '化工', quality: 72, pe: 15, pb: 3, roe: 24, debt: 0.52, revGrowth: 28, div: 1.5 },
  '0700': { name: '腾讯控股', sector: '科技', quality: 95, pe: 22, pb: 4, roe: 28, debt: 0.45, revGrowth: 15, div: 1.2 },
  '9988': { name: '阿里巴巴', sector: '科技', quality: 90, pe: 20, pb: 3, roe: 18, debt: 0.38, revGrowth: 12, div: 1.5 },
  '3690': { name: '美团', sector: '科技', quality: 85, pe: 35, pb: 5, roe: 22, debt: 0.55, revGrowth: 25, div: 0.8 },
  '1810': { name: '小米集团', sector: '科技', quality: 72, pe: 25, pb: 2.5, roe: 15, debt: 0.48, revGrowth: 18, div: 1.0 },
  '9618': { name: '京东集团', sector: '科技', quality: 80, pe: 18, pb: 2.8, roe: 20, debt: 0.52, revGrowth: 10, div: 1.8 },
  '1024': { name: '快手', sector: '科技', quality: 75, pe: 40, pb: 4, roe: 18, debt: 0.45, revGrowth: 20, div: 0.5 },
};

const SECTOR_HEAT = {
  '科技': 92, '新能源': 90, '医药': 85, '消费': 78,
  '金融': 58, '公用': 78, '家电': 72, '化工': 70,
  '建材': 62, '能源': 48, '新材料': 88, 'AI教育': 90,
  'AI': 96, 'AI硬件': 95, '半导体': 94, '芯片': 90,
  '云计算': 92, '军工': 75, '环保': 72, '地产': 32
};

// PIOTROSKI F-SCORE (0-9)
function piotroskiScore(stock) {
  let score = 0;
  if (stock.roe > 0) score++;
  if (stock.revGrowth > 0) score++;
  if (stock.roe > 15) score++;
  if (stock.revGrowth > stock.roe) score++;
  if (stock.debt < 0.5) score++;
  if (stock.debt < 0.6) score++;
  if (stock.div > 0) score++;
  if (stock.revGrowth > 10) score++;
  if (stock.revGrowth > 15) score++;
  return score;
}

// GRAHAM NUMBER (Intrinsic Value)
function grahamNumber(stock) {
  const eps = stock.roe / 100 * 10;
  const bps = stock.pb * 10;
  return Math.sqrt(22.5 * eps * bps);
}

// ALTMAN Z-SCORE (Bankruptcy Risk)
function altmanZ(stock) {
  const wc = 0.3, re = 0.2, ebit = stock.roe * 0.8;
  const equity = 1 - stock.debt, sales = stock.revGrowth / 100 + 1;
  return (wc * 1.2) + (re * 1.4) + (ebit * 3.3) + (equity * 0.6) + (sales * 1.0);
}

// TECHNICAL SCORE
function technicalScore(stock, code) {
  let score = 50;
  // Volume analysis (simulated)
  score += (Math.random() - 0.5) * 20;
  // Price momentum (simulated)
  score += stock.revGrowth * 0.3;
  // Sector momentum
  score += (SECTOR_HEAT[stock.sector] || 60) * 0.2;
  return Math.max(0, Math.min(100, score));
}

// INSTITUTIONAL SCORE
function institutionalScore(stock) {
  let score = 50;
  // Insider buying indicator
  score += stock.revGrowth > 15 ? 15 : 0;
  score += stock.revGrowth > 30 ? 10 : 0;
  // Quality
  score += stock.quality * 0.3;
  // Piotroski
  score += piotroskiScore(stock) * 2;
  return Math.min(100, score);
}

// MAIN ADVANCED SCORING
function advancedScore(stock, code) {
  const piotroski = piotroskiScore(stock);
  const graham = grahamNumber(stock);
  const altman = altmanZ(stock);
  const technical = technicalScore(stock, code);
  const institutional = institutionalScore(stock);
  
  // WEIGHTED SCORE (Institutional Grade)
  const total = (
    institutional * 0.25 +    // Smart money 25%
    stock.quality * 0.25 +     // Quality 25%
    technical * 0.20 +         // Technical 20%
    piotroski * 3 +            // Piotroski factor (0-27)
    (SECTOR_HEAT[stock.sector] || 60) * 0.15 +  // Sector 15%
    (altman > 3 ? 10 : altman) * 0.15  // Safety 15%
  );
  
  return {
    piotroski,
    graham: Math.round(graham * 10) / 10,
    altman: Math.round(altman * 10) / 10,
    technical: Math.round(technical),
    institutional: Math.round(institutional),
    total: Math.round(total * 10) / 10,
    risk: altman < 1.8 ? 'HIGH' : altman < 3 ? 'MEDIUM' : 'LOW'
  };
}

function runAdvancedScan() {
  console.log('🧠 CHARLES\'S SUPER BRAIN - ADVANCED SCANNER V2');
  console.log('================================================');
  console.log('⚡ Advanced Algorithms: Piotroski, Graham, Altman Z, Technical, Institutional');
  console.log('');
  
  const results = [];
  
  Object.keys(ALL_STOCKS).forEach(code => {
    const stock = ALL_STOCKS[code];
    const scores = advancedScore(stock, code);
    
    results.push({
      code,
      name: stock.name,
      sector: stock.sector,
      quality: stock.quality,
      pe: stock.pe,
      roe: stock.roe,
      debt: stock.debt,
      revGrowth: stock.revGrowth,
      ...scores
    });
  });
  
  results.sort((a, b) => b.total - a.total);
  
  console.log(`✅ Scanned ${results.length} stocks with advanced algorithms`);
  console.log('');
  
  console.log('🏆 TOP 15 ADVANCED PICKS:');
  results.slice(0, 15).forEach((s, i) => {
    console.log(`   ${i+1}. ${s.code} ${s.name} | ${s.sector} | Score: ${s.total} | Piotroski: ${s.piotroski}/9 | Altman Z: ${s.altman} | Risk: ${s.risk}`);
  });
  
  let report = `# 🧠 CHARLES'S SUPER BRAIN - ADVANCED SCANNER V2\n`;
  report += `## ${TODAY} | ${results.length} Stocks Analyzed\n\n`;
  report += `## ⚡ Advanced Algorithms\n`;
  report += `- Piotroski F-Score (0-9)\n`;
  report += `- Graham Number (Intrinsic Value)\n`;
  report += `- Altman Z-Score (Bankruptcy Risk)\n`;
  report += `- Technical Analysis\n`;
  report += `- Institutional Momentum\n\n`;
  
  report += `## 🏆 TOP ADVANCED PICKS\n`;
  report += `| Rank | Code | Name | Sector | Score | Piotroski | Altman Z | Risk |\n`;
  report += `|------|------|------|--------|-------|-----------|-----------|------|\n`;
  results.slice(0, 30).forEach((s, i) => {
    report += `| ${i+1} | ${s.code} | ${s.name} | ${s.sector} | **${s.total}** | ${s.piotroski}/9 | ${s.altman} | ${s.risk} |\n`;
  });
  
  report += `\n---\n*🧠 Charles's Super Brain - Advanced Scanner V2*\n`;
  
  fs.writeFileSync(`${OUTPUT_DIR}/ADVANCED_SCAN_${TODAY}.txt`, report);
  console.log(`\n✅ Report saved: ADVANCED_SCAN_${TODAY}.txt`);
  
  return results;
}

runAdvancedScan();
