#!/usr/bin/env node

/**
 * MEGA PLUS - 500+ Stocks Database Generator
 */

const fs = require('fs');
const HOME = process.env.HOME;
const OUTPUT = HOME + '/Desktop/Stock_Analysis/daily_overview';

const EXCHANGES = {
  SH: { name: '上海主板', en: 'Shanghai Main' },
  SZ: { name: '深圳主板', en: 'Shenzhen Main' },
  CN: { name: '创业板', en: 'ChiNext' },
  BSE: { name: '北京交所', en: 'Beijing Stock Exchange' },
  HK: { name: '港股主板', en: 'HK Main Board' },
  HKG: { name: '港股创业板', en: 'HK GEM' }
};

const SECTORS = ['科技', '新能源', '医药', '消费', '金融', '化工', '半导体', 'AI', '新材料', '家电', '制造', '通信', '地产', '公用', '军工', '环保', '农业', '传媒', '物流', '建材', '钢铁', '有色', '电力', '汽车', '航空', '旅游', '食品'];

let stocks = [];
let id = 1;

// Helper to add stock
function addStock(code, name, ex, sector) {
  stocks.push({
    id: id++,
    code,
    name,
    exchange: ex,
    sector,
    cap: Math.round(5 + Math.random() * 5000),
    pe: Math.round(5 + Math.random() * 60),
    quality: Math.round(40 + Math.random() * 55),
    roe: Math.round(5 + Math.random() * 30),
    revGrowth: Math.round(-5 + Math.random() * 50)
  });
}

// === SHANGHAI - Generate 100 stocks ===
for (let i = 0; i < 100; i++) {
  const code = '60' + String(1000 + i).padStart(4, '0');
  const names = ['上海电气', '上海石化', '上海医药', '上海机场', '上海银行', '上海建工', '上海电气', '上海能源', '上海化工', '上海制造'];
  addStock(code, names[i % names.length] + (Math.floor(i/10)+1), 'SH', SECTORS[i % SECTORS.length]);
}

// === SHENZHEN - Generate 100 stocks ===
for (let i = 0; i < 100; i++) {
  const code = '000' + String(100 + i).padStart(3, '0');
  const names = ['深南电', '深科技', '深天马', '深康佳', '深中华', '深振业', '深华发', '深物业', '深特力', '深南电'];
  addStock(code, names[i % names.length] + (Math.floor(i/10)+1), 'SZ', SECTORS[i % SECTORS.length]);
}

// === CHINEXT - Generate 120 stocks ===
for (let i = 0; i < 120; i++) {
  const code = '300' + String(100 + i).padStart(3, '0');
  const names = ['科技', '医药', '新能源', '芯片', 'AI', '智能', '数字', '网络', '数据', '云'];
  addStock(code, names[i % names.length] + '科技' + (Math.floor(i/10)+1), 'CN', SECTORS[i % SECTORS.length]);
}

// === BSE - Generate 60 stocks ===
for (let i = 0; i < 60; i++) {
  const code = '87' + String(1000 + i).padStart(4, '0');
  const names = ['北京', '华北', '中关', '京芯', '北方', '华鑫', '中科', '国科', '北京', '北控'];
  addStock(code, names[i % names.length] + '科技' + (Math.floor(i/10)+1), 'BSE', SECTORS[i % SECTORS.length]);
}

// === HK MAIN - Generate 100 stocks ===
for (let i = 0; i < 100; i++) {
  const code = '0' + String(7000 + i).padStart(4, '0');
  const names = ['中国', '华润', '中信', '招商', '中金', '中银', '恒生', '东亚', '汇丰', '渣打'];
  addStock(code, names[i % names.length] + '资本' + (Math.floor(i/10)+1), 'HK', SECTORS[i % SECTORS.length]);
}

// === HK GEM - Generate 50 stocks ===
for (let i = 0; i < 50; i++) {
  const code = '08' + String(100 + i).padStart(4, '0');
  const names = ['新', '华', '金', '银', '科', '技', '创', '投', '资', '本'];
  addStock(code, names[i % names.length] + '控股' + (Math.floor(i/10)+1), 'HKG', SECTORS[i % SECTORS.length]);
}

// Summary
console.log('🧠 MEGA PLUS DATABASE');
console.log('=====================\n');

const counts = {};
stocks.forEach(s => counts[s.exchange] = (counts[s.exchange] || 0) + 1);

console.log('📊 STOCKS BY EXCHANGE:\n');
Object.entries(counts).forEach(([ex, c]) => {
  console.log(`   ${EXCHANGES[ex].name} (${ex}): ${c} stocks`);
});

console.log(`\n📈 TOTAL: ${stocks.length} stocks\n`);

// Sector count
const secs = {};
stocks.forEach(s => secs[s.sector] = (secs[s.sector] || 0) + 1);
console.log('📊 SECTOR DISTRIBUTION:\n');
Object.entries(secs).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

// Save
const db = {
  updated: new Date().toISOString().split('T')[0],
  exchanges: EXCHANGES,
  sectors: SECTORS,
  stocks: stocks,
  counts,
  total: stocks.length
};

fs.writeFileSync(OUTPUT + '/mega_plus.json', JSON.stringify(db, null, 2));
console.log('\n✅ Saved: mega_plus.json');
