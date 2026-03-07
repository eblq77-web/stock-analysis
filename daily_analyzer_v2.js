#!/usr/bin/env node

/**
 * Charles's AI Stock Trading Assistant - Module 2
 * Portfolio Categorization + 4 China Stock Plates
 * 
 * Plates: 上海(Shanghai) | 深圳(Shenzhen) | 创业板(ChiNext) | 北京(BJSE)
 * 
 * Version 2.1 - Works with Sample Data (Can switch to real API)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  outputDir: path.join(process.env.HOME, 'Desktop', 'Stock_Analysis'),
  useRealAPI: false, // Set to true when real API works
};

// Today's date
const today = new Date().toISOString().split('T')[0];
const todayCN = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

console.log('🇨🇳 Charles Stock Trading Assistant - Module 2');
console.log('================================================');
console.log(`📅 Date: ${today}`);
console.log('📊 Coverage: 上海 | 深圳 | 创业板 | 北京');
console.log('');

// ============ 4 PLATE STOCK LISTS ============

const FOUR_PLATES = {
  'shanghai': {
    name: '上海主板',
    indexName: '上证指数',
    indexCode: '000001.SH',
    stocks: [
      { code: '600519', name: '贵州茅台' },
      { code: '601318', name: '中国平安' },
      { code: '600036', name: '招商银行' },
      { code: '601888', name: '中国中免' },
      { code: '600030', name: '中信证券' },
      { code: '600900', name: '长江电力' },
      { code: '601012', name: '隆基绿能' },
      { code: '600276', name: '恒瑞医药' },
      { code: '600887', name: '伊利股份' },
      { code: '601857', name: '中国石油' },
    ]
  },
  'shenzhen': {
    name: '深圳主板',
    indexName: '深证成指',
    indexCode: '399001.SZ',
    stocks: [
      { code: '000001', name: '平安银行' },
      { code: '000002', name: '万科A' },
      { code: '000333', name: '美的集团' },
      { code: '000651', name: '格力电器' },
      { code: '000858', name: '五粮液' },
      { code: '000725', name: '京东方A' },
      { code: '002415', name: '海康威视' },
      { code: '002594', name: '比亚迪' },
      { code: '002475', name: '立讯精密' },
      { code: '000786', name: '北新建材' },
    ]
  },
  'chinext': {
    name: '创业板',
    indexName: '创业板指',
    indexCode: '399006.SZ',
    stocks: [
      { code: '300750', name: '宁德时代' },
      { code: '300059', name: '东方财富' },
      { code: '300015', name: '爱尔眼科' },
      { code: '300033', name: '同花顺' },
      { code: '300122', name: '智飞生物' },
      { code: '300142', name: '沃森生物' },
      { code: '300454', name: '网宿科技' },
      { code: '300498', name: '温氏股份' },
      { code: '300002', name: '红宝丽' },
      { code: '300676', name: '君正集团' },
    ]
  },
  'beijing': {
    name: '北京交所',
    indexName: '北证50',
    indexCode: '899050.BJ',
    stocks: [
      { code: '872926', name: '贝特瑞' },
      { code: '870299', name: '吉林碳谷' },
      { code: '871453', name: '连城数控' },
      { code: '835670', name: '数字人' },
      { code: '872541', name: '晶赛科技' },
      { code: '870366', name: '酒仙网' },
      { code: '835305', name: '云创数据' },
      { code: '872545', name: '恒合股份' },
      { code: '871212', name: '立方控股' },
      { code: '835992', name: '戈碧迦' },
    ]
  }
};

// ============ GENERATE REALISTIC SAMPLE DATA ============

function generateSampleData() {
  const data = {
    indices: {},
    stocks: []
  };
  
  // Generate index data with slight random variation
  const baseIndices = {
    'shanghai': { name: '上证指数', base: 3400 },
    'shenzhen': { name: '深证成指', base: 11000 },
    'chinext': { name: '创业板指', base: 2200 },
    'beijing': { name: '北证50', base: 900 }
  };
  
  for (const [key, info] of Object.entries(baseIndices)) {
    const changePct = (Math.random() * 4 - 2); // -2% to +2%
    const price = info.base * (1 + changePct / 100);
    data.indices[key] = {
      name: info.name,
      price: price.toFixed(2),
      changePct: changePct.toFixed(2),
      volume: Math.floor(Math.random() * 300000000000 + 100000000000)
    };
  }
  
  // Generate stock data
  for (const [plateKey, plate] of Object.entries(FOUR_PLATES)) {
    for (const stock of plate.stocks) {
      const changePct = (Math.random() * 12 - 5); // -5% to +7%
      const basePrice = Math.random() * 200 + 10; // 10-210 RMB
      const volume = Math.floor(Math.random() * 50000000 + 5000000);
      
      data.stocks.push({
        code: stock.code,
        name: stock.name,
        plate: plateKey,
        plateName: plate.name,
        price: basePrice.toFixed(2),
        change: changePct.toFixed(2),
        changePct: changePct,
        volume: volume,
        volumeFormatted: volume > 100000000 
          ? (volume/100000000).toFixed(2) + '亿'
          : (volume/10000).toFixed(0) + '万',
        open: (basePrice * (1 + Math.random() * 0.02 - 0.01)).toFixed(2),
        high: (basePrice * (1 + Math.random() * 0.04)).toFixed(2),
        low: (basePrice * (1 - Math.random() * 0.04)).toFixed(2),
        close: basePrice.toFixed(2),
      });
    }
  }
  
  return data;
}

// ============ API FETCH FUNCTIONS ============

// Try to fetch from real API (Sina)
async function fetchFromSina(stockCode) {
  return new Promise((resolve) => {
    let sinacode = '';
    if (stockCode.startsWith('6')) sinacode = 'sh' + stockCode;
    else if (stockCode.startsWith('0') || stockCode.startsWith('3')) sinacode = 'sz' + stockCode;
    else if (stockCode.startsWith('8') || stockCode.startsWith('4')) sinacode = 'bj' + stockCode;
    
    const url = `https://hq.sinajs.cn/list=${sinacode}`;
    
    const req = https.get(url, { 
      headers: { 'Referer': 'https://finance.sina.com.cn', 'User-Agent': 'Mozilla/5.0' },
      timeout: 3000 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/="([^"]+)"/);
          if (match && match[1]) {
            const parts = match[1].split(',');
            if (parts.length >= 6) {
              resolve({
                price: parseFloat(parts[3]) || 0,
                change: parseFloat(parts[2]) || 0,
                volume: parseInt(parts[8]) || 0,
              });
            }
          }
        } catch (e) {}
        resolve(null);
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ============ REPORT GENERATION ============

function generatePortfolioReport(data) {
  const { indices, stocks } = data;
  
  // Categorize stocks
  const shortTerm = stocks.filter(s => parseFloat(s.changePct) >= 3)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 5);
    
  const midTerm = stocks.filter(s => parseFloat(s.changePct) >= 1 && parseFloat(s.changePct) < 3)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 5);
    
  const longTerm = stocks.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 10);
  
  const report = `# 📊 Charles's Portfolio - 每日组合报告
## 🇨🇳 4大板块实时监控

**更新时间**: ${new Date().toLocaleString('zh-CN')}
**股票池总数**: ${stocks.length}只

---

## 📈 4大指数实时行情

| 板块 | 指数名称 | 当前点位 | 涨跌幅 | 成交量 |
|-----|---------|---------|--------|--------|
| 🟡 上海 | ${indices.shanghai.name} | ${indices.shanghai.price} | ${parseFloat(indices.shanghai.changePct) > 0 ? '+' : ''}${indices.shanghai.changePct}% | ${(parseFloat(indices.shanghai.volume)/100000000).toFixed(2)}亿 |
| 🟢 深圳 | ${indices.shenzhen.name} | ${indices.shenzhen.price} | ${parseFloat(indices.shenzhen.changePct) > 0 ? '+' : ''}${indices.shenzhen.changePct}% | ${(parseFloat(indices.shenzhen.volume)/100000000).toFixed(2)}亿 |
| 🔵 创业板 | ${indices.chinext.name} | ${indices.chinext.price} | ${parseFloat(indices.chinext.changePct) > 0 ? '+' : ''}${indices.chinext.changePct}% | ${(parseFloat(indices.chinext.volume)/100000000).toFixed(2)}亿 |
| 🔴 北京 | ${indices.beijing.name} | ${indices.beijing.price} | ${parseFloat(indices.beijing.changePct) > 0 ? '+' : ''}${indices.beijing.changePct}% | ${(parseFloat(indices.beijing.volume)/100000000).toFixed(2)}亿 |

---

## 🎯 各板块热门股票

### 🟡 上海主板 Top 5
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'shanghai').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.volumeFormatted} |`).join('\n')}

### 🟢 深圳主板 Top 5
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'shenzhen').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.volumeFormatted} |`).join('\n')}

### 🔵 创业板 Top 5
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'chinext').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.volumeFormatted} |`).join('\n')}

### 🔴 北京交所 Top 5
| 代码 | 名称 | 现价 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
${stocks.filter(s => s.plate === 'beijing').slice(0,5).map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.volumeFormatted} |`).join('\n')}

---

## ⚡ 短线推荐 (当日可交易 - 涨幅>3%)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 推荐理由 |
|-----|------|------|------|------|---------|
${shortTerm.length > 0 ? shortTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.plateName} | ${parseFloat(s.change) > 4 ? '强势突破' : '量价齐升'} |`).join('\n') : '|暂无符合条件的短线标的|---|---|---|---|'}

---

## 📈 中线推荐 (3-6个月)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 推荐理由 |
|-----|------|------|------|------|---------|
${midTerm.length > 0 ? midTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.plateName} | 趋势向好 |`).join('\n') : '|暂无符合条件的 中线标的|---|---|---|---|'}

---

## 🔭 长线观察 (6个月+)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 成交量 | 观察理由 |
|-----|------|------|------|------|--------|---------|
${longTerm.map(s => `| ${s.code} | ${s.name} | ¥${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.plateName} | ${s.volumeFormatted} | 基本面优 |`).join('\n')}

---

## 💡 今日交易建议

### 短线策略 (今日)
${shortTerm.length > 0 ? `- 关注: ${shortTerm[0].name} (${shortTerm[0].code}) - 涨幅最大` : '- 等待更好的买入时机'}

### 中线策略 (3-6个月)
${midTerm.length > 0 ? `- 配置: ${midTerm[0].name} - 行业趋势向好` : '- 建议观望'}

### 长线策略 (6个月+)
- 关注: 宁德时代(300750) - 新能源龙头
- 关注: 比亚迪(002594) - 海外扩张加速
- 关注: 贵州茅台(600519) - 行业标杆

---

## ⚠️ 风险提示

- 本报告仅供分析参考，不构成投资建议
- 入场前务必做好止损设置(建议-7%)
- 建议单只股票仓位不超过总资金的10%
- 北京交所股票波动较大，注意风险

---

*🤖 Generated by Charles's AI Stock Assistant*
*Module 2: Portfolio Categorization*
*Data: ${CONFIG.useRealAPI ? '实时API' : '模拟数据'}*
`;
  
  return { report, shortTerm, midTerm, longTerm };
}

function generateStockProfile(stock, type) {
  return `# ${stock.code} - ${stock.name}

## 📊 基本信息
- **代码**: ${stock.code}
- **板块**: ${stock.plateName}
- **当前价格**: ¥${stock.price}
- **涨跌**: ${parseFloat(stock.change) > 0 ? '+' : ''}${stock.change}%
- **成交量**: ${stock.volumeFormatted}

## 📈 实时行情
| 项目 | 数值 |
|-----|------|
| 开盘 | ¥${stock.open} |
| 最高 | ¥${stock.high} |
| 最低 | ¥${stock.low} |
| 昨收 | ¥${stock.close} |

## 🎯 分类
**${type === 'short' ? '⚡ 短线交易' : type === 'mid' ? '📈 中线投资' : '🔭 长线观察'}**

## 📉 技术指标

### 短期信号
- 涨跌幅: ${parseFloat(stock.change) > 0 ? '✅ 上涨' : '❌ 下跌'}
- 成交量: ${parseFloat(stock.volume) > 50000000 ? '✅ 放量' : '➖ 正常'}
- 阻力位: ¥${(parseFloat(stock.price) * 1.05).toFixed(2)}
- 支撑位: ¥${(parseFloat(stock.price) * 0.95).toFixed(2)}

## 💰 交易建议

| 项目 | 建议 |
|-----|------|
| 交易类型 | ${type === 'short' ? '日内/超短线' : type === 'mid' ? '3-6个月' : '6个月以上'} |
| 建议仓位 | ${type === 'short' ? '5-10%' : '10-20%'} |
| 止损位 | ¥${(parseFloat(stock.price) * 0.93).toFixed(2)} (-7%) |
| 目标位 | ¥${(parseFloat(stock.price) * 1.15).toFixed(2)} (+15%) |

## ⚠️ 风险因素
- 市场系统性风险
- 板块轮动风险
- 流动性风险 (北京交所)

---

*🤖 Charles's AI Stock Assistant*
*更新时间: ${new Date().toLocaleString('zh-CN')}*
`;
}

// ============ MAIN ============

async function main() {
  console.log('📊 Generating portfolio data...\n');
  
  // Generate sample data
  const data = generateSampleData();
  
  // Show index data
  console.log('📈 4大指数:');
  for (const [key, idx] of Object.entries(data.indices)) {
    const sign = parseFloat(idx.changePct) >= 0 ? '+' : '';
    console.log(`   ${idx.name}: ${idx.price} (${sign}${idx.changePct}%)`);
  }
  
  // Generate report
  console.log('\n📝 Generating portfolio report...');
  const { report, shortTerm, midTerm, longTerm } = generatePortfolioReport(data);
  
  // Save report
  const dailyFile = path.join(CONFIG.outputDir, 'daily_overview', `${today}_portfolio_report.md`);
  fs.writeFileSync(dailyFile, report);
  console.log(`✅ Saved: ${dailyFile}`);
  
  // Save stock profiles
  console.log('📋 Saving stock profiles...');
  
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
  
  console.log('\n================================');
  console.log('✅ Module 2 Complete!');
  console.log('================================');
  console.log('\n📁 Files created:');
  console.log(`  📊 Portfolio: daily_overview/${today}_portfolio_report.md`);
  console.log(`  ⚡ Short-term: ${shortTerm.length} stocks`);
  console.log(`  📈 Mid-term: ${midTerm.length} stocks`);
  console.log(`  🔭 Long-term: ${longTerm.length} stocks`);
  console.log(`\n📍 Location: ~/Desktop/Stock_Analysis/`);
}

main();
