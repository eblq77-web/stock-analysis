/**
 * LIVE ALERT SYSTEM - Real-time monitoring
 */

const https = require('https');

// Watchlist - add your stocks here
const WATCHLIST = [
  '000999', // 华润三九
  '600570', // 恒生电子
  '601012', // 隆基绿能
  '300750', // 宁德时代
  '002594', // 比亚迪
  '600036', // 招商银行
  '000001', // 平安银行
];

function getStockData(code) {
  return new Promise((resolve, reject) => {
    const prefix = code.startsWith('6') ? 'sh' : 'sz';
    const url = `https://qt.gtimg.cn/q=${prefix}${code}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/"([^"]+)"/);
          if (match) {
            const fields = match[1].split('~');
            resolve({
              code: code,
              name: fields[1],
              price: parseFloat(fields[3]) || 0,
              change: parseFloat(fields[4]) || 0,
              volume: parseInt(fields[5]) || 0
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function checkAlerts() {
  console.log('============================================================');
  console.log('🚨 LIVE ALERT SYSTEM - Real-time');
  console.log('============================================================');
  console.log(`⏰ ${new Date().toLocaleString()}`);
  console.log('');
  
  const results = await Promise.all(WATCHLIST.map(c => getStockData(c)));
  
  const stocks = results.filter(r => r !== null);
  
  console.log('📊 Market Data:');
  stocks.forEach(s => {
    const emoji = s.change > 0 ? '🟢' : '🔴';
    console.log(`   ${emoji} ${s.code} ${s.name}: ¥${s.price.toFixed(2)} (${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%)`);
  });
  
  console.log('');
  console.log('🔔 Alerts:');
  
  let alertCount = 0;
  
  stocks.forEach(s => {
    // Price breakout (>3%)
    if (s.change > 3) {
      console.log(`   🚨 BREAKOUT: ${s.name} +${s.change.toFixed(2)}%!`);
      alertCount++;
    }
    // Big drop (<-3%)
    else if (s.change < -3) {
      console.log(`   🔻 ALERT: ${s.name} ${s.change.toFixed(2)}%`);
      alertCount++;
    }
  });
  
  if (alertCount === 0) {
    console.log('   ✅ No significant alerts');
  }
  
  console.log('');
  console.log('============================================================');
  
  return stocks;
}

// Run immediately
checkAlerts();

// Run every 30 minutes
setInterval(checkAlerts, 30 * 60 * 1000);

module.exports = { checkAlerts, WATCHLIST };
