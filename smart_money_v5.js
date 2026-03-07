#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CONFIG = { outputDir: path.join(process.env.HOME, 'Desktop', 'Stock_Analysis') };
const today = new Date().toISOString().split('T')[0];

console.log("Smart Money Tracking");
console.log("=====================");

// Sample data
const stocks = [
  { code: '600519', name: '贵州茅台', price: 1680, change: 2.5, mainFlow: 1500000, retailFlow: -800000, signal: 'buy' },
  { code: '601318', name: '中国平安', price: 52, change: -1.2, mainFlow: -1200000, retailFlow: 900000, signal: 'sell' },
  { code: '002594', name: '比亚迪', price: 268, change: 2.1, mainFlow: 1100000, retailFlow: -600000, signal: 'buy' },
  { code: '300750', name: '宁德时代', price: 215, change: 3.8, mainFlow: 2000000, retailFlow: -1000000, signal: 'buy' },
  { code: '0700', name: '腾讯控股', price: 380, change: 3.2, mainFlow: 2800000, retailFlow: -1200000, signal: 'buy' },
];

const buy = stocks.filter(s => s.signal === 'buy');
const sell = stocks.filter(s => s.signal === 'sell');

console.log("Buy signals:", buy.length);
console.log("Sell signals:", sell.length);

const report = `# Smart Money Tracking - ${today}

## Buy Signals (Follow)
| Code | Name | Price | Change | Main Flow |
|------|------|-------|--------|-----------|
${buy.map(s => `| ${s.code} | ${s.name} | $${s.price} | +${s.change}% | +$${(s.mainFlow/10000).toFixed(0)}万 |`).join('\n')}

## Sell Signals (Avoid)
| Code | Name | Price | Change | Main Flow |
|------|------|-------|--------|-----------|
${sell.map(s => `| ${s.code} | ${s.name} | $${s.price} | ${s.change}% | $${(s.mainFlow/10000).toFixed(0)}万 |`).join('\n')}

## Rules
- Main Flow + Retail Flow - = BUY
- Main Flow - Retail Flow + = SELL
`;

fs.writeFileSync(path.join(CONFIG.outputDir, 'daily_overview', `${today}_smart_money.md`), report);
console.log("Done!");
