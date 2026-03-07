/**
 * Breakout Alert Checker
 * Run this for heartbeat - sends alerts if breakout detected
 */

const http = require('http');
const fs = require('fs');

const WATCH_LIST = [
    { code: '002841', name: '视源股份', market: 'sz', alertPrice: 39.5 },
    { code: '002812', name: '恩捷股份', market: 'sz', alertPrice: 63 },
    { code: '601601', name: '中国太保', market: 'sh', alertPrice: 41.5 },
    { code: '601888', name: '中国中免', market: 'sh', alertPrice: 82 },
    { code: '600760', name: '黑牡丹', market: 'sh', alertPrice: 56 },
    { code: '300826', name: '华测检测', market: 'sz', alertPrice: 17.8 },
    { code: '600309', name: '万华化学', market: 'sh', alertPrice: 95 },
    { code: '600570', name: '恒生电子', market: 'sh', alertPrice: 30.8 },
    { code: '000333', name: '美的集团', market: 'sz', alertPrice: 80 },
    { code: '688256', name: '寒锐钴业', market: 'sh', alertPrice: 1200 }
];

const STATE_FILE = process.env.HOME + '/Desktop/Stock_Analysis/breakout_state.json';

function fetchStock(code, market) {
    return new Promise(resolve => {
        http.get('http://qt.gtimg.cn/q='+market+code, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    const m = d.match(/="([^"]+)"/);
                    if (!m) { resolve(null); return; }
                    const p = m[1].split('~');
                    resolve({ price: parseFloat(p[3]) || 0, change: parseFloat(p[5]) || 0, high: parseFloat(p[33]) || 0 });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function check() {
    const state = JSON.parse(fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : '{"lastAlert":{},"prices":{}}');
    let breakoutAlert = null;
    
    for (const s of WATCH_LIST) {
        const d = await fetchStock(s.code, s.market);
        if (!d) continue;
        
        state.prices[s.code] = d.price;
        
        // Check breakout conditions
        const breakout = d.price > s.alertPrice || (d.change > 5 && d.change < 15) || d.price > d.high * 0.99;
        const priceMoved = state.prices[s.code] && Math.abs(d.price - state.prices[s.code]) / state.prices[s.code] > 0.015;
        
        if (breakout && (!state.lastAlert[s.code] || priceMoved)) {
            breakoutAlert = { stock: s, price: d.price, change: d.change };
            state.lastAlert[s.code] = new Date().toISOString();
        }
    }
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return breakoutAlert;
}

check().then(alert => {
    if (alert) {
        console.log('🚨 BREAKOUT: ' + alert.stock.name + ' at ¥' + alert.price + ' (+' + alert.change.toFixed(1) + '%)');
    } else {
        console.log('No breakout');
    }
});
