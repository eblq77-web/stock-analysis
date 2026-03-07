#!/usr/bin/env node

/**
 * Charles's AI Stock Trading Assistant - V3 (Expanded)
 * 6 Plates x 20 Stocks = 120 Total Stocks
 * 
 * Version 3.0 - Extended Coverage
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  outputDir: path.join(process.env.HOME, 'Desktop', 'Stock_Analysis'),
};

const today = new Date().toISOString().split('T')[0];

console.log('🇨🇳 Charles Stock Assistant - V3 Extended');
console.log('========================================');
console.log(`📅 Date: ${today}`);
console.log('📊 6 Plates x 20 Stocks = 120 Total');
console.log('');

// ============ 6 PLATES x 20 STOCKS ============

const SIX_PLATES = {
  'shanghai': {
    name: '上海主板',
    region: '🟡',
    isHK: false,
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
      { code: '601166', name: '兴业银行' },
      { code: '600585', name: '海螺水泥' },
      { code: '600690', name: '青岛海尔' },
      { code: '600028', name: '中国石化' },
      { code: '600016', name: '民生银行' },
      { code: '600309', name: '万华化学' },
      { code: '600104', name: '上汽集团' },
      { code: '600050', name: '中国联通' },
      { code: '601668', name: '中国建筑' },
      { code: '601888', name: '中国中铁' },
    ]
  },
  'shenzhen': {
    name: '深圳主板',
    region: '🟢',
    isHK: false,
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
      { code: '000425', name: '建投能源' },
      { code: '000538', name: '云南白药' },
      { code: '000596', name: '古井贡酒' },
      { code: '000568', name: '泸州老窖' },
      { code: '000876', name: '新希望' },
      { code: '000338', name: '潍柴动力' },
      { code: '000100', name: 'TCL科技' },
      { code: '000063', name: '中兴通讯' },
      { code: '000009', name: '中国宝安' },
      { code: '000060', name: '中金岭南' },
    ]
  },
  'chinext': {
    name: '创业板',
    region: '🔵',
    isHK: false,
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
      { code: '300347', name: '泰格医药' },
      { code: '300759', name: '理财金字塔' },
      { code: '300682', name: '朗新科技' },
      { code: '300212', name: '易瑞生物' },
      { code: '300146', name: '中科创达' },
      { code: '300663', name: '朗科智能' },
      { code: '300226', name: '上海钢联' },
      { code: '300124', name: '长盈精密' },
      { code: '300408', name: '三环集团' },
      { code: '300433', name: '蓝思科技' },
    ]
  },
  'beijing': {
    name: '北京交所',
    region: '🔴',
    isHK: false,
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
      { code: '873169', name: '七丰精工' },
      { code: '870163', name: '荣程新材' },
      { code: '872527', name: '华曦科技' },
      { code: '871445', name: '海泰发展' },
      { code: '835184', name: '美天旋' },
      { code: '870786', name: '武进硅谷' },
      { code: '836892', name: '广信新材' },
      { code: '872374', name: '科强股份' },
      { code: '870864', name: '红东方' },
      { code: '872951', name: '华韵股份' },
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
      { code: '0939', name: '建设银行' },
      { code: '3988', name: '中国银行' },
      { code: '1398', name: '工商银行' },
      { code: '1211', name: '比亚迪股份' },
      { code: '0175', name: '吉利汽车' },
      { code: '2318', name: '中国平安' },
      { code: '2678', name: '金斯瑞' },
      { code: '0941', name: '中国移动' },
      { code: '0762', name: '中国铁建' },
      { code: '1800', name: '中国交建' },
      { code: '0386', name: '中国石油' },
      { code: '0857', name: '中国光大' },
      { code: '2628', name: '中国人寿' },
      { code: '2328', name: '中国财险' },
      { code: '3969', name: '中国民航' },
      { code: '1109', name: '华润置地' },
      { code: '0019', name: '中国太保' },
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
      { code: '0241', name: '阿里健康' },
      { code: '0669', name: '创科实业' },
      { code: '0608', name: '阳光油服' },
      { code: '0268', name: '金蝶国际' },
      { code: '0992', name: '联想集团' },
      { code: '0358', name: '彩虹新能源' },
      { code: '0185', name: '众安在线' },
      { code: '2269', name: '药明生物' },
      { code: '6631', name: '思爱普' },
      { code: '2048', name: '携程集团' },
    ]
  }
};

// Generate sample data
function generateSampleData() {
  const data = { indices: {}, stocks: [] };
  
  // Index data
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
  
  // Stock data
  for (const [plateKey, plate] of Object.entries(SIX_PLATES)) {
    for (const stock of plate.stocks) {
      const changePct = (Math.random() * 14 - 6);
      const basePrice = plate.isHK 
        ? Math.random() * 300 + 10
        : Math.random() * 500 + 5;
      const volume = Math.floor(Math.random() * 100000000 + 5000000);
      
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

function generateReport(data) {
  const { indices, stocks } = data;
  
  // Categorize
  const shortTerm = stocks.filter(s => parseFloat(s.changePct) >= 4)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 10);
    
  const midTerm = stocks.filter(s => parseFloat(s.changePct) >= 1.5 && parseFloat(s.changePct) < 4)
    .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct)).slice(0, 10);
    
  const longTerm = stocks.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 20);
  
  // By plate
  const byPlate = {};
  for (const [key, plate] of Object.entries(SIX_PLATES)) {
    byPlate[key] = stocks.filter(s => s.plate === key)
      .sort((a, b) => parseFloat(b.changePct) - parseFloat(a.changePct))
      .slice(0, 10);
  }
  
  const report = `# 📊 Charles's Portfolio - Extended Edition
## 🇨🇳🇭🇰 6大板块 x 20只股票 = 120只

**更新时间**: ${new Date().toLocaleString('zh-CN')}
**股票池总数**: ${stocks.length}只

---

## 📈 6大指数

| 板块 | 指数 | 点位 | 涨跌 | 成交量 |
|-----|------|------|------|--------|
| ${indices.shanghai.region} 上海 | ${indices.shanghai.name} | ${indices.shanghai.price} | ${parseFloat(indices.shanghai.changePct) > 0 ? '+' : ''}${indices.shanghai.changePct}% | ${(parseFloat(indices.shanghai.volume)/100000000).toFixed(2)}亿 |
| ${indices.shenzhen.region} 深圳 | ${indices.shenzhen.name} | ${indices.shenzhen.price} | ${parseFloat(indices.shenzhen.changePct) > 0 ? '+' : ''}${indices.shenzhen.changePct}% | ${(parseFloat(indices.shenzhen.volume)/100000000).toFixed(2)}亿 |
| ${indices.chinext.region} 创业板 | ${indices.chinext.name} | ${indices.chinext.price} | ${parseFloat(indices.chinext.changePct) > 0 ? '+' : ''}${indices.chinext.changePct}% | ${(parseFloat(indices.chinext.volume)/100000000).toFixed(2)}亿 |
| ${indices.beijing.region} 北京 | ${indices.beijing.name} | ${indices.beijing.price} | ${parseFloat(indices.beijing.changePct) > 0 ? '+' : ''}${indices.beijing.changePct}% | ${(parseFloat(indices.beijing.volume)/100000000).toFixed(2)}亿 |
| ${indices.hsi.region} 港股 | ${indices.hsi.name} | ${indices.hsi.price} | ${parseFloat(indices.hsi.changePct) > 0 ? '+' : ''}${indices.hsi.changePct}% | ${(parseFloat(indices.hsi.volume)/100000000).toFixed(2)}亿 |
| ${indices.hstech.region} 恒生科技 | ${indices.hstech.name} | ${indices.hstech.price} | ${parseFloat(indices.hstech.changePct) > 0 ? '+' : ''}${indices.hstech.changePct}% | ${(parseFloat(indices.hstech.volume)/100000000).toFixed(2)}亿 |

---

## ⚡ 短线推荐 (涨幅>4%)

| 代码 | 名称 | 价格 | 涨幅 | 板块 | 货币 |
|-----|------|------|------|------|------|
${shortTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.region} ${s.plateName} | ${s.currency} |`).join('\n')}

---

## 📈 中线推荐 (1.5-4%)

| 代码 | 名称 | 价格 | 涨幅 | 板块 | 货币 |
|-----|------|------|------|------|------|
${midTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.region} ${s.plateName} | ${s.currency} |`).join('\n')}

---

## 🔭 长线观察 (高成交量)

| 代码 | 名称 | 价格 | 涨幅 | 板块 | 成交量 |
|-----|------|------|------|------|--------|
${longTerm.map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% | ${s.plateName} | ${s.volumeFormatted} |`).join('\n')}

---

## 📊 各板块Top 5

${Object.entries(byPlate).map(([key, stocks]) => `
### ${SIX_PLATES[key].region} ${SIX_PLATES[key].name}
| 代码 | 名称 | 现价 | 涨跌 |
|-----|------|------|------|
${stocks.slice(0,5).map(s => `| ${s.code} | ${s.name} | ${s.currency === 'HKD' ? 'HK$' : '¥'}${s.price} | ${parseFloat(s.change) > 0 ? '+' : ''}${s.change}% |`).join('\n')}
`).join('\n')}

---

*🤖 Charles's AI Stock Assistant V3 Extended*
*120 Stocks Coverage*
`;
  
  return { report, shortTerm, midTerm, longTerm, byPlate };
}

function main() {
  console.log('📊 Generating extended portfolio data...\n');
  
  const data = generateSampleData();
  
  console.log('📈 6大指数:');
  for (const [key, idx] of Object.entries(data.indices)) {
    const sign = parseFloat(idx.changePct) >= 0 ? '+' : '';
    console.log(`   ${idx.region} ${idx.name}: ${idx.price} (${sign}${idx.changePct}%)`);
  }
  
  console.log(`\n📈 股票总数: ${data.stocks.length}只`);
  
  console.log('\n📝 Generating report...');
  const { report, shortTerm, midTerm, longTerm } = generateReport(data);
  
  const dailyFile = path.join(CONFIG.outputDir, 'daily_overview', `${today}_extended.md`);
  fs.writeFileSync(dailyFile, report);
  console.log(`✅ Saved: ${dailyFile}`);
  
  console.log('\n================================');
  console.log('✅ V3 Extended Complete!');
  console.log('================================');
  console.log(`\n📊 6 plates x 20 stocks = ${data.stocks.length} total`);
  console.log(`📈 Short-term: ${shortTerm.length} stocks`);
  console.log(`📈 Mid-term: ${midTerm.length} stocks`);
  console.log(`📈 Long-term: ${longTerm.length} stocks`);
}

main();
