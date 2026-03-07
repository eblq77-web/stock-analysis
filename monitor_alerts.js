// 📊 AUTOMATED STOCK ALERT MONITOR
// Monitors institutional picks for buy signals

const https = require('https');
const fs = require('fs');

// Watchlist - stocks to monitor
const WATCHLIST = {
  '601012': { name: '隆基绿能', sector: '新能源', minChange: 0, minVolume: 500000 },
  '1024': { name: '快手', sector: '科技', minChange: 0, minVolume: 500000 },
  '300015': { name: '爱尔眼科', sector: '医药', minChange: 0, minVolume: 500000 },
  '300033': { name: '同花顺', sector: '科技', minChange: 0, minVolume: 500000 },
  '300122': { name: '智飞生物', sector: '医药', minChange: 0, minVolume: 500000 },
  '000001': { name: '平安银行', sector: '金融', minChange: 0, minVolume: 500000 },
  '000333': { name: '美的集团', sector: '家电', minChange: 0, minVolume: 500000 },
  '0700': { name: '腾讯控股', sector: '科技', minChange: 0, minVolume: 500000 }
};

// Our 5 filters
const FILTERS = {
  goodSectors: ['科技', '医药', '新能源', '消费', '汽车', '军工'],
  minMomentum: 0, // change > 0
  minVolume: 500000,
  priceRange: { min: 25, max: 40 }
};

function fetchPrices() {
  return new Promise((resolve, reject) => {
    const codes = Object.keys(WATCHLIST);
    const url = 'https://qt.gtimg.cn/q=sh' + codes.join(',sh');
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkSignals() {
  console.log('🔔 CHECKING ALERTS - ' + new Date().toLocaleTimeString('zh-CN'));
  console.log('='.repeat(50));
  
  const data = await fetchPrices();
  const results = [];
  
  Object.keys(WATCHLIST).forEach(code => {
    const stock = WATCHLIST[code];
    const match = data.match(new RegExp('sh' + code + '="([^"]+)"'));
    
    if (!match) return;
    
    const parts = match[1].split('~');
    if (parts.length < 8) return;
    
    const price = parseFloat(parts[4]);
    const prev = parseFloat(parts[5]);
    const volume = parseInt(parts[7]);
    const change = ((price - prev) / prev) * 100;
    
    // Apply filters
    const sectorOk = FILTERS.goodSectors.includes(stock.sector);
    const momentumOk = change > FILTERS.minMomentum;
    const volumeOk = volume > FILTERS.minVolume;
    const priceOk = price >= FILTERS.priceRange.min && price <= FILTERS.priceRange.max;
    const noFinance = stock.sector !== '金融';
    
    const pass = sectorOk && momentumOk && volumeOk && noFinance;
    
    const status = pass ? '✅ BUY' : '❌ WAIT';
    console.log(`${status} ${code} ${stock.name} | ¥${price.toFixed(2)} | ${change.toFixed(2)}% | Vol:${(volume/10000).toFixed(0)}万`);
    
    if (pass) {
      results.push({ code, name: stock.name, price, change, volume, sector: stock.sector });
    }
  });
  
  console.log('='.repeat(50));
  
  if (results.length > 0) {
    console.log('🚨 ALERT: ' + results.length + ' STOCKS MEET CRITERIA!');
    results.forEach(r => console.log(`   ${r.code} ${r.name} @ ¥${r.price}`));
  } else {
    console.log('ℹ️ No signals triggered');
  }
  
  return results;
}

// Run check
checkSignals().catch(console.error);
