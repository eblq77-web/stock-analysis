/**
 * DEMO: Alert System Running
 */

const alertSystem = require('./alert_system');

// Sample stock data (simulating real data)
const sampleData = [
  { code: '000999', name: '华润三九', price: 29.55, change: 1.5, volume: 250000, volumeRatio: 1.2 },
  { code: '600570', name: '恒生电子', price: 28.58, change: 2.8, volume: 800000, volumeRatio: 2.5 },
  { code: '601012', name: '隆基绿能', price: 18.06, change: -2.5, volume: 2000000, volumeRatio: 3.0 },
  { code: '300750', name: '宁德时代', price: 345.00, change: 4.5, volume: 500000, volumeRatio: 1.8 },
  { code: '600036', name: '招商银行', price: 39.18, change: -1.2, volume: 1200000, volumeRatio: 1.1 }
];

console.log('============================================================');
console.log('🚨 ALERT SYSTEM DEMO - Running...');
console.log('============================================================');
console.log('');
console.log('📊 Monitoring stocks:');
alertSystem.WATCHLIST.forEach(s => {
  console.log(`   - ${s.code} ${s.name} (${s.type})`);
});
console.log('');
console.log('📈 Sample market data:');
sampleData.forEach(s => {
  console.log(`   ${s.code} ${s.name}: ¥${s.price} (${s.change > 0 ? '+' : ''}${s.change}%) Vol: ${s.volume}`);
});
console.log('');
console.log('🔔 Checking alerts...');
console.log('');

// Run alert check
const alerts = alertSystem.runAlertSystem(sampleData);

console.log('');
console.log('============================================================');
console.log(`📊 Total alerts: ${alerts.length}`);
console.log('============================================================');

if (alerts.length === 0) {
  console.log('No alerts triggered (all normal)');
} else {
  alerts.forEach(a => {
    console.log(`🚨 ${a.type}: ${a.message}`);
  });
}
