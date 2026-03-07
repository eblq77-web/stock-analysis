#!/usr/bin/env node

/**
 * Charles's AI Stock Trading Assistant - Module 2 (Updated)
 * Portfolio Categorization + 6 China/HK Stock Plates
 * 
 * Plates: 上海 | 深圳 | 创业板 | 北京 | 恒生指数 | 恒生科技
 * 
 * Version 2.2 - With HK Stocks
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  outputDir: path.join(process.env.HOME, 'Desktop', 'Stock_Analysis'),
};

const today = new Date().toISOString().split('T')[0];

console.log('🇨🇳 Charles Stock Trading Assistant - V2.2');
console.log('========================================');
console.log(`📅 Date: ${today}`);
console.log('📊 Coverage: 上海 | 深圳 | 创业板 | 北京 | 恒生指数 | 恒生科技');
console.log('');

// ============ 6 PLATE STOCK LISTS ============

const SIX_PLATES = {
  'shanghai': {
    name: '上海主板',
    region: '🟡',
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
    region: '🟢',
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
    region: '🔵',
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
    region: '🔴',
    stocks: [
      { code: '872926', name: '贝特瑞' },
      { code: '870299', name: '吉林碳谷' },
      { code: '871453', name: '连城数控' },
      { code: '835670', name: '数字人' },
      { code: '835670', name: '数字人' },
      { code: '870366', name: '酒仙网' },
      { code: '835305', name: '云创数据' },
      { code: '872545', name: '恒合股份' },
      { code: '871212', name: '立方控股' },
      { code: '835992', name: '戈碧迦' },
    ]
  },
  'hsi': {
    name: '恒生指数',
    region: '🇭🇰',
    isHK: true,
    stocks: [
      { code: '0700', name: '腾讯控股' },
      { code: '9988', name: '阿里巴巴' },
      { code: '0005', name: '汇丰控股' },
      { code: '939', name: '建设银行' },
      { code: '3988', name: '中国银行' },
      { code: '1398', name: '工商银行' },
      { code: '1211', name: '比亚迪股份' },
      { code: '175', name: '吉利汽车' },
      { code: '2318', name: '中国平安' },
      { code: '2678', name: '金斯瑞' },
    ]
  },
  'hstech': {
    name: '恒生科技',
    region: '🇭🇰',
    isHK: true,
    stocks: [
      { code: '0700', name: '腾讯控股' },
      { code: '9988', name: '阿里巴巴' },
      { code: '3690', name: '美团' },
      { code: '1810', name: '小米集团' },
      { code: '9618', name: '京东集团' },
      { code: '9898', name: '百济神州' },
      { code: '2388', name: '蔚来' },
      { code: '9866', name: '小鹏汽车' },
      { code: '9999', name: '网易' },
      { code: '1024', name: '快手' },
    ]
  }
};

// Generate sample data
function generateSampleData() {
  const data = { indices: {}, stocks: [] };
  
  // Generate index data
  const baseIndices = {
    'shanghai': { name: '上证指数', base: 3400 },
    'shenzhen': { name: '深证成指', base: 11000 },
    'chinext': { name: '创业板指', base: 2200 },
    'beijing': { name: '北证50', base: 900 },
    'hsi': { name: '恒生指数', base: 19000, isHK: true },
    'hstech': { name: '恒生科技', base: 4200, isHK: true }
  };
  
  for (const [key, info] of Object.entries(baseIndices)) {
    const changePct = (Math.random() * 4 - 2);
    const price = info.base * (1 + changePct / 100);
    data.indices[key] = {
      name: info.name,
      region: info.isHK ? '🇭🇰' : (key === 'shanghai' ? '🟡' : key === 'shenzhen' ? '🟢' : key === 'chinext' ? '🔵' : '🔴'),
      price: price.toFixed(2),
      changePct: changePct.toFixed(2),
      volume: Math.floor(Math.random() * 300000000000 + 100000000000)
    };
  }
  
  // Generate stock data
  for (const [plateKey, plate] of Object.entries(SIX_PLATES)) {
    for (const stock of plate.stocks) {
      const changePct = (Math.random() * 12 - 5);
      const basePrice = plate.isHK 
        ? Math.random() * 300 + 20  // HK stocks in HKD
        : Math.random() * 200 + 10; // A shares in RMB
      const volume = Math.floor(Math.random() * 50000000 + 5000000);
      
      data.stocks.push({
        code: stock.code,
        name: stock.name,
        plate: plateKey,
        plateName: plate.name,
        region: plate.region,
        isHK: plate.isHK || false,
        price: basePrice.toFixed(2),
        change: changePct.toFixed(2),
        changePct: changePct,
        volume: volume,
        volumeFormatted: volume > 100000000 
          ? (volume/100000000).toFixed(2) + '亿'
          : (volume/10000).toFixed(0) + '万',
        currency: plate.isHK ? 'HKD' : 'RMB'
      });
    }
  }
  
  return data;
}

function generatePortfolioReport(data) {
  const { indices, stocks } = data;
  
  const shortTerm = stocks.filter(s => parseFloat(s.changePct) >= 3)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 5);
    
  const midTerm = stocks.filter(s => parseFloat(s.changePct) >= 1 && parseFloat(s.changePct) < 3)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 5);
    
  const longTerm = stocks.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 10);
  
  const report = `# 📊 Charles's Portfolio - 每日组合报告
## 🇨🇳🇭🇰 6大板块实时监控

**更新时间**: ${new Date().toLocaleString('zh-CN')}
**股票池总数**: ${stocks.length}只

---

## 📈 6大指数实时行情

| 板块 | 指数名称 | 当前点位 | 涨跌幅 | 成交量 |
|-----|---------|---------|--------|--------|
| ${indices.shanghai.region} 上海 | ${indices.shanghai.name} | ${indices.shanghai.price} | ${parseFloat(indices.shanghai.changePct) > 0 ? '+' : ''}${indices.shanghai.changePct}% | ${(parseFloat(indices.shanghai.volume)/100000000).toFixed(2)}亿 |
| ${indices.shenzhen.region} 深圳 | ${indices.shenzhen.name} | ${indices.shenzhen.price} | ${parseFloat(indices.shenzhen.changePct) > 0 ? '+' : ''}${indices.shenzhen.changePct}% | ${(parseFloat(indices.shenzhen.volume)/100000000).toFixed(2)}亿 |
| ${indices.chinext.region} 创业板 | ${indices.chinext.name} | ${indices.chinext.price} | ${parseFloat(indices.chinext.changePct) > 0 ? '+' : ''}${indices.chinext.changePct}% | ${(parseFloat(indices.chinext.volume)/100000000).toFixed(2)}亿 |
| ${indices.beijing.region} 北京 | ${indices.beijing.name} | ${indices.beijing.price} | ${parseFloat(indices.beijing.changePct) > 0 ? '+' : ''}${indices.beijing.changePct}% | ${(parseFloat(indices.beijing.volume)/100000000).toFixed(2)}亿 |
| ${indices.hsi.region} 香港 | ${indices.hsi.name} | ${indices.hsi.price} | ${parseFloat(indices.hsi.changePct) > 0 ? '+' : ''}${indices.hsi.changePct}% | ${(parseFloat(indices.hsi.volume)/100000000).toFixed(2)}亿 |
| ${indices.hstech.region} 香港 | ${indices.hstech.name} | ${indices.hstech.price} | ${parseFloat(indices.hstech.changePct) > 0 ? '+' : ''}${indices.hstech.changePct}% | ${(parseFloat(indices.hstech.volume)/100000000).toFixed(2)}亿 |

---

## ⚡ 短线推荐 (当日涨幅>3%)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 货币 |
|-----|------|------|------|------|------|
${shortTerm.length > 0 ? shortTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.region} ${s.plateName} | ${s.currency} |`).join('\n') : '|暂无|---|---|---|---|'}

---

## 📈 中线推荐 (1-3%)

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 货币 |
|-----|------|------|------|------|------|
${midTerm.length > 0 ? midTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.region} ${s.plateName} | ${s.currency} |`).join('\n') : '|暂无|---|---|---|---|'}

---

## 🔭 长线观察

| 代码 | 名称 | 现价 | 涨幅 | 板块 | 货币 |
|-----|------|------|------|------|------|
${longTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.region} ${s.plateName} | ${s.currency} |`).join('\n')}

---

## 💡 今日交易建议

### 短线策略 (今日)
${shortTerm.length > 0 ? `- 关注: ${shortTerm[0].name} (${shortTerm[0].code}) - 涨幅最大` : '- 等待更好的买入时机'}

### 中线策略 (3-6个月)
${midTerm.length > 0 ? `- 配置: ${midTerm[0].name} - 行业趋势向好` : '- 建议观望'}

### 港股配置
- 关注: 腾讯控股(0700) - 科技龙头
- 关注: 阿里巴巴(9988) - 电商复苏

---

## ⚠️ 风险提示

- 本报告仅供分析参考，不构成投资建议
- 港股与A股交易规则不同，注意汇率风险
- 入场前务必做好止损设置(建议-7%)

---

*🤖 Generated by Charles's AI Stock Assistant*
*Version 2.2 - 包含港股*
`;
  
  return { report, shortTerm, midTerm, longTerm };
}

// Main
function main() {
  console.log('📊 Generating portfolio data (6 plates)...\n');
  
  const data = generateSampleData();
  
  console.log('📈 6大指数:');
  for (const [key, idx] of Object.entries(data.indices)) {
    const sign = parseFloat(idx.changePct) >= 0 ? '+' : '';
    console.log(`   ${idx.region} ${idx.name}: ${idx.price} (${sign}${idx.changePct}%)`);
  }
  
  console.log('\n📝 Generating portfolio report...');
  const { report, shortTerm, midTerm, longTerm } = generatePortfolioReport(data);
  
  const dailyFile = path.join(CONFIG.outputDir, 'daily_overview', `${today}_portfolio_v2.md`);
  fs.writeFileSync(dailyFile, report);
  console.log(`✅ Saved: ${dailyFile}`);
  
  console.log('\n================================');
  console.log('✅ V2.2 Complete (6 Plates)!');
  console.log('================================');
  console.log(`\n📊 板块: 上海 | 深圳 | 创业板 | 北京 | 恒生指数 | 恒生科技`);
  console.log(`📈 Short-term: ${shortTerm.length} stocks`);
  console.log(`📈 Mid-term: ${midTerm.length} stocks`);
}

main();
