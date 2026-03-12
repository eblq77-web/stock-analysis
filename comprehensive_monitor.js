#!/usr/bin/env node
/**
 * SUPER BRAIN V3 - COMPREHENSIVE SCANNER
 * Monitors ALL 6 exchanges continuously
 * Applies full eligibility criteria
 * Run: node comprehensive_monitor.js
 */

const https = require('https');
const fs = require('fs');

const LOG_FILE = './live_trading/comprehensive_monitor.log';

// ALL 6 Exchanges - Full Coverage
const WATCHLIST = {
  // Shanghai Main
  SH: ['600036','601012','600887','600009','600030','600089','600276','600519','600016','600028'],
  // Shenzhen Main
  SZ: ['000001','000333','000651','000333','000999','000002','000100','000858','000725','000538'],
  // ChiNext
  CN: ['300015','300033','300122','300750','300476','300014','300502','300018','300308','300142'],
  // BSE (Beijing)
  BSE: ['835670','870299','872926','871047','871049','870523','870599','870358','870790'],
  // HK Main
  HK: ['0700','3690','1024','3638','9988','0941','1398','2318','2628','0669'],
  // Hang Seng Tech
  HS: ['1810','0185','6690','6100','6669','6028']
};

function getPrice(code, exchange) {
  return new Promise((resolve) => {
    let prefix = 'sz';
    if (exchange === 'SH' || exchange === 'HS') prefix = 'sh';
    if (exchange === 'HK') prefix = 'hk';
    
    const url = 'https://qt.gtimg.cn/q=' + prefix + code;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/\"([^\"]+)\"/);
          if (match) {
            const parts = match[1].split('~');
            resolve({ code, exchange, name: parts[1], price: parseFloat(parts[3]), change: parseFloat(parts[5]), vol: parseInt(parts[6]) });
          } else resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function log(msg) {
  const timestamp = new Date().toLocaleTimeString();
  console.log('[' + timestamp + '] ' + msg);
}

async function scan() {
  log('🧠 COMPREHENSIVE 6-EXCHANGE SCAN');
  log('================================');
  
  let allPrices = [];
  
  // Fetch all prices
  for (const [exchange, codes] of Object.entries(WATCHLIST)) {
    for (const code of codes) {
      const result = await getPrice(code, exchange);
      if (result && result.price > 0) {
        allPrices.push(result);
      }
    }
  }
  
  // Filter by RULES
  const eligible = allPrices.filter(s => 
    s.price >= 25 && s.price <= 45 &&    // ¥25-45 range
    s.change > 0 &&                       // Positive momentum
    s.vol > 500000                        // Volume > 500K
  ).sort((a,b) => b.change - a.change);
  
  log('📊 Scanned: ' + allPrices.length + ' stocks');
  log('✅ Eligible: ' + eligible.length + ' stocks');
  log('');
  
  if (eligible.length > 0) {
    log('🎯 TOP QUALIFYING STOCKS:');
    eligible.slice(0,10).forEach((s, i) => {
      log((i+1) + '. ' + s.code + ' ' + s.name + ' ¥' + s.price + ' ' + s.change + '% [' + s.exchange + ']');
    });
  }
  
  // Check current positions
  const currentPositions = [
    { code: '601012', entry: 28.46, target: 31.31, stop: 27.04 },
    { code: '835670', entry: 29.14, target: 32.05, stop: 27.68 },
    { code: '870299', entry: 45.11, target: 49.62, stop: 42.85 }
  ];
  
  log('');
  log('📈 CURRENT POSITIONS:');
  
  for (const pos of currentPositions) {
    const live = allPrices.find(s => s.code === pos.code);
    if (live) {
      const pnl = ((live.price - pos.entry) / pos.entry * 100).toFixed(2);
      let status = 'HOLD';
      if (live.price >= pos.target) status = '🎯 SELL';
      else if (live.price <= pos.stop) status = '🛑 SELL';
      
      const e = pnl >= 0 ? '🟢' : '🔴';
      log(e + ' ' + pos.code + ': ' + pnl + '% -> ' + status);
    }
  }
  
  log('================================');
}

scan();
