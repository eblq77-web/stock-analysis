/**
 * ALERT SYSTEM v1.0
 * Real-time stock alerts
 */

const https = require('https');

// Alert types
const ALERT_TYPES = {
  PRICE_BREAKOUT: 'price_breakout',
  PRICE_DROP: 'price_drop',
  VOLUME_SPIKE: 'volume_spike',
  SECTOR_FLOW: 'sector_flow',
  INSTITUTIONAL_INFLOW: 'institutional_inflow'
};

// Watchlist
let WATCHLIST = [
  { code: '000999', name: '华润三九', type: '医药' },
  { code: '600570', name: '恒生电子', type: '科技' },
  { code: '601012', name: '隆基绿能', type: '新能源' }
];

function checkAlerts(stockData) {
  const alerts = [];
  
  for (const stock of stockData) {
    // Price breakout
    if (stock.change > 3) {
      alerts.push({
        type: ALERT_TYPES.PRICE_BREAKOUT,
        stock: stock.code,
        name: stock.name,
        message: `${stock.name} breakout! +${stock.change}%`,
        time: new Date().toISOString()
      });
    }
    
    // Price drop
    if (stock.change < -3) {
      alerts.push({
        type: ALERT_TYPES.PRICE_DROP,
        stock: stock.code,
        name: stock.name,
        message: `${stock.name} dropped! ${stock.change}%`,
        time: new Date().toISOString()
      });
    }
    
    // Volume spike
    if (stock.volumeRatio > 2) {
      alerts.push({
        type: ALERT_TYPES.VOLUME_SPIKE,
        stock: stock.code,
        name: stock.name,
        message: `${stock.name} volume spike! ${stock.volumeRatio}x avg`,
        time: new Date().toISOString()
      });
    }
  }
  
  return alerts;
}

function sendAlert(alert) {
  console.log('🚨 ALERT:', alert.message);
  // In production: send to Telegram, SMS, email, etc.
}

function addToWatchlist(stock) {
  WATCHLIST.push(stock);
}

function removeFromWatchlist(code) {
  WATCHLIST = WATCHLIST.filter(s => s.code !== code);
}

function runAlertSystem(stockData) {
  console.log('🔔 Checking alerts...');
  
  const alerts = checkAlerts(stockData);
  
  for (const alert of alerts) {
    sendAlert(alert);
  }
  
  return alerts;
}

module.exports = { runAlertSystem, addToWatchlist, removeFromWatchlist, checkAlerts, WATCHLIST };
