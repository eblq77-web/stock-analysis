/**
 * LIVE BREAKOUT ALERT SYSTEM
 * Monitors top deep hunter stocks for breakout signals
 */

const http = require('http');
const fs = require('fs');

const WATCH_LIST = [
    { code: '002841', name: '视源股份', sector: '电子', market: 'sz', alertPrice: 39.5 },
    { code: '002812', name: '恩捷股份', sector: '新能源', market: 'sz', alertPrice: 63 },
    { code: '601601', name: '中国太保', sector: '保险', market: 'sh', alertPrice: 41.5 },
    { code: '601888', name: '中国中免', sector: '旅游', market: 'sh', alertPrice: 82 },
    { code: '600760', name: '黑牡丹', sector: '地产', market: 'sh', alertPrice: 56 },
    { code: '300826', name: '华测检测', sector: '检测', market: 'sz', alertPrice: 17.8 },
    { code: '600309', name: '万华化学', sector: '化工', market: 'sh', alertPrice: 95 },
    { code: '600570', name: '恒生电子', sector: '软件', market: 'sh', alertPrice: 30.8 },
    { code: '000333', name: '美的集团', sector: '家电', market: 'sz', alertPrice: 80 },
    { code: '688256', name: '寒锐钴业', sector: '新材料', market: 'sh', alertPrice: 1200 }
];

const STATE_FILE = `${process.env.HOME}/Desktop/Stock_Analysis/breakout_state.json`;

function fetchStockData(code, market) {
    return new Promise((resolve) => {
        const url = `http://qt.gtimg.cn/q=${market}${code}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const match = data.match(/="([^"]+)"/);
                    if (!match) { resolve(null); return; }
                    const p = match[1].split('~');
                    if (p.length < 35) { resolve(null); return; }
                    
                    resolve({
                        code: p[2], name: p[1],
                        price: parseFloat(p[3]) || 0,
                        changePct: parseFloat(p[5]) || 0,
                        volume: parseInt(p[6]) || 0,
                        high: parseFloat(p[33]) || 0,
                        low: parseFloat(p[34]) || 0
                    });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function checkBreakout(stock, data) {
    if (!data || !data.price) return null;
    
    const alerts = [];
    let score = 0;
    
    if (stock.alertPrice && data.price > stock.alertPrice) {
        alerts.push('BREAKOUT');
        score += 40;
    }
    if (data.changePct > 5 && data.changePct < 15) {
        alerts.push('MOMENTUM');
        score += 25;
    }
    if (data.volume > 5000000) {
        alerts.push('VOLUME_SPIKE');
        score += 20;
    }
    if (data.high - data.price < data.price * 0.01) {
        alerts.push('NEAR_BREAKOUT');
        score += 10;
    }
    
    return { alerts, score, price: data.price, change: data.changePct };
}

function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
    catch(e) { return { lastAlert: {}, prices: {} }; }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function runMonitor() {
    console.log('\n🚨 LIVE BREAKOUT MONITOR - ' + new Date().toLocaleString());
    
    const state = loadState();
    const alerts = [];
    
    for (const stock of WATCH_LIST) {
        const data = await fetchStockData(stock.code, stock.market);
        if (!data) continue;
        
        const check = checkBreakout(stock, data);
        const lastPrice = state.prices[stock.code] || 0;
        const priceChanged = lastPrice > 0 && Math.abs(data.price - lastPrice) / lastPrice > 0.02;
        
        if (check && check.score > 20 && (priceChanged || !state.lastAlert[stock.code])) {
            alerts.push({ stock, ...check, time: new Date().toISOString() });
            state.lastAlert[stock.code] = new Date().toISOString();
        }
        
        state.prices[stock.code] = data.price;
        
        const chg = data.changePct > 0 ? '+' : '';
        console.log(`   ${stock.code} ${stock.name}: ¥${data.price} (${chg}${data.changePct.toFixed(1)}%)`);
    }
    
    saveState(state);
    
    if (alerts.length > 0) {
        console.log('\n🚨🚨🚨 BREAKOUT ALERTS 🚨🚨🚨');
        alerts.forEach(a => {
            console.log(`\n🔥 ${a.stock.name} (${a.stock.code})`);
            console.log(`   Price: ¥${a.price} | +${a.change.toFixed(1)}%`);
            console.log(`   Signals: ${a.alerts.join(' | ')}`);
        });
        return alerts;
    }
    
    console.log('\n✅ No breakout signals');
    return [];
}

runMonitor();
