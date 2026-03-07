/**
 * QUANTUM INSTITUTIONAL HUNTER V10
 * Find where institutions are HIDDEN at the BOTTOM
 */

const http = require('http');
const fs = require('fs');

const UNIVERSE = [
    { code: '835670', name: '数字人', sector: 'AI教育', market: 'bj' },
    { code: '872926', name: '贝特瑞', sector: '新能源', market: 'bj' },
    { code: '300682', name: '朗新科技', sector: '科技', market: 'sz' },
    { code: '300454', name: '网宿科技', sector: '科技', market: 'sz' },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', market: 'sz' },
    { code: '300122', name: '智飞生物', sector: '医药', market: 'sz' },
    { code: '300502', name: '新易盛', sector: '光模块', market: 'sz' },
    { code: '002475', name: '立讯精密', sector: '科技', market: 'sz' },
    { code: '002371', name: '北方华创', sector: '半导体', market: 'sz' },
    { code: '002460', name: '赣锋锂业', sector: '锂电', market: 'sz' },
    { code: '002594', name: '比亚迪', sector: '新能源车', market: 'sz' },
    { code: '000651', name: '格力电器', sector: '家电', market: 'sz' },
    { code: '000333', name: '美的集团', sector: '家电', market: 'sz' },
    { code: '600703', name: '三安光电', sector: '半导体', market: 'sh' },
    { code: '600276', name: '恒瑞医药', sector: '医药', market: 'sh' },
    { code: '600519', name: '贵州茅台', sector: '白酒', market: 'sh' },
    { code: '601012', name: '隆基绿能', sector: '光伏', market: 'sh' },
    { code: '688185', name: '康希诺', sector: '医药', market: 'sh' },
    { code: '688256', name: '寒锐钴业', sector: '新材料', market: 'sh' },
    { code: '688777', name: '海康威视', sector: 'AI', market: 'sh' },
    { code: '0700', name: '腾讯控股', sector: '科技', market: 'hk' },
    { code: '9988', name: '阿里巴巴', sector: '科技', market: 'hk' },
    { code: '3690', name: '美团', sector: '科技', market: 'hk' }
];

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
                    if (p.length < 30) { resolve(null); return; }
                    
                    // Fixed indices - bids: 10-19, asks: 20-29
                    const bids = [];
                    const asks = [];
                    for (let i = 0; i < 5; i++) {
                        const bp = parseFloat(p[10 + i*2]);
                        const bv = parseInt(p[11 + i*2]);
                        const ap = parseFloat(p[20 + i*2]);
                        const av = parseInt(p[21 + i*2]);
                        if (bp > 0 && bp < 10000) bids.push({ price: bp, vol: bv });
                        if (ap > 0 && ap < 10000) asks.push({ price: ap, vol: av });
                    }
                    
                    resolve({
                        code: p[2], name: p[1], price: parseFloat(p[3]) || 0,
                        changePct: parseFloat(p[5]) || 0, volume: parseInt(p[6]) || 0,
                        high: parseFloat(p[33]) || 0, low: parseFloat(p[34]) || 0,
                        bids, asks
                    });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function detectSecretAccumulation(data) {
    if (!data || !data.bids || data.bids.length < 3) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    const deepBidVol = data.bids.slice(2).reduce((a, b) => a + b.vol, 0);
    const topBidVol = data.bids.slice(0, 2).reduce((a, b) => a + b.vol, 0);
    const deepRatio = deepBidVol / (topBidVol || 1);
    
    if (deepRatio > 2) { score += 40; signals.push(`DEEP:${deepRatio.toFixed(1)}x`); }
    else if (deepRatio > 1.5) { score += 25; signals.push(`MODERATE:${deepRatio.toFixed(1)}x`); }
    
    const totalBid = data.bids.reduce((a, b) => a + b.vol, 0);
    const totalAsk = data.asks.reduce((a, b) => a + b.vol, 0);
    const imbalance = (totalBid - totalAsk) / (totalBid + totalAsk || 1);
    
    if (imbalance > 0.3) { score += 35; signals.push(`ABSORPTION:${(imbalance*100).toFixed(0)}%`); }
    
    return { score: Math.min(100, score), signals };
}

function detectBottomFormation(data) {
    if (!data || data.price === 0) return { score: 0, phase: 'UNKNOWN', nearLow: '0' };
    
    const nearLow = (data.price - data.low) / (data.low || 1) * 100;
    const nearHigh = (data.high - data.price) / (data.high || 1) * 100;
    
    let score = 0;
    let phase = 'NEUTRAL';
    
    if (nearLow < 5 && nearLow > 0) {
        const bidVol = data.bids.reduce((a, b) => a + b.vol, 0);
        if (bidVol > 50) { score += 50; phase = 'BOTTOM_LOADING'; }
        else if (bidVol > 30) { score += 30; phase = 'SUPPORT'; }
    }
    
    if (nearHigh < 5 && nearHigh > 0) {
        const bidVol = data.bids.reduce((a, b) => a + b.vol, 0);
        if (bidVol > 50) { score += 40; phase = 'BREAKOUT'; }
    }
    
    const range = (data.high - data.low) / (data.low || 1) * 100;
    if (range < 3) { score += 20; phase = 'SQUEEZE'; }
    
    return { score: Math.min(100, score), phase, nearLow: nearLow.toFixed(2), range: range.toFixed(2) };
}

function detectDistributionEnd(data) {
    if (!data || !data.asks || data.asks.length < 3) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    const topAskVol = data.asks[0].vol;
    const deepAskVol = data.asks.slice(2).reduce((a, b) => a + b.vol, 0);
    
    if (deepAskVol > topAskVol * 2) {
        score += 35;
        signals.push('DEEP_SELL_EXHAUSTED');
    }
    
    const retailSell = data.asks.slice(0, 2).reduce((a, b) => a + b.vol, 0);
    const totalAsk = data.asks.reduce((a, b) => a + b.vol, 0);
    if (retailSell / (totalAsk || 1) > 0.7) {
        score += 30;
        signals.push('RETAIL_PANIC');
    }
    
    return { score: Math.min(100, score), signals };
}

function calcSmartMoney(secret, bottom, distEnd) {
    let score = 0;
    score += secret.score * 0.4;
    score += bottom.score * 0.35;
    score += distEnd.score * 0.25;
    score = Math.round(score);
    
    let action = 'WATCH';
    let sentiment = '🟡 NEUTRAL';
    if (score > 55) { action = 'ACCUMULATE'; sentiment = '🔥 STRONG BUY'; }
    else if (score > 35) { action = 'BUY'; sentiment = '🟢 BUY'; }
    else if (score < 15) { action = 'AVOID'; sentiment = '🔴 AVOID'; }
    
    return { score, action, sentiment };
}

async function analyze(stock) {
    const data = await fetchStockData(stock.code, stock.market);
    if (!data || data.price === 0) return null;
    
    const secret = detectSecretAccumulation(data);
    const bottom = detectBottomFormation(data);
    const distEnd = detectDistributionEnd(data);
    const smartMoney = calcSmartMoney(secret, bottom, distEnd);
    
    return { stock, data, secret, bottom, distEnd, smartMoney };
}

async function runHunter() {
    console.log('\n🎯 QUANTUM INSTITUTIONAL HUNTER V10');
    console.log('='.repeat(50));
    
    const results = [];
    for (const s of UNIVERSE) {
        const r = await analyze(s);
        if (r) results.push(r);
        process.stdout.write('.');
        await new Promise(x => setTimeout(x, 150));
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 INSTITUTIONAL HUNTER RESULTS');
    console.log('='.repeat(60));
    
    results.sort((a, b) => b.smartMoney.score - a.smartMoney.score);
    
    // Top accumulation
    console.log('\n🏆 SMART MONEY ACCUMULATING (Buy These):');
    const buys = results.filter(r => r.smartMoney.score > 25);
    buys.slice(0, 8).forEach((r, i) => {
        console.log(`\n${i+1}. ${r.data.name} (${r.stock.code}) - ${r.stock.sector}`);
        console.log(`   Price: ¥${r.data.price} | Change: ${r.data.changePct > 0 ? '+' : ''}${r.data.changePct}%`);
        console.log(`   📊 SCORE: ${r.smartMoney.score} | ${r.smartMoney.sentiment}`);
        console.log(`   📈 Phase: ${r.bottom.phase} | Near Low: ${r.bottom.nearLow}%`);
        if (r.secret.signals.length) console.log(`   🔍 ${r.secret.signals.join(' | ')}`);
    });
    
    // Bottom formation
    console.log('\n\n💎 BOTTOM FORMATION (Ready to Break):');
    const bottoms = results.filter(r => r.bottom.score > 25);
    bottoms.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i+1}. ${r.data.name} (${r.stock.code}) - ${r.bottom.phase}`);
    });
    
    // Avoid
    console.log('\n\n⚠️ DISTRIBUTION/AVOID:');
    const avoid = results.filter(r => r.smartMoney.score < 15);
    avoid.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i+1}. ${r.data.name} (${r.stock.code}) - Institutions selling`);
    });
    
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/quantum_hunter_report.json`, 
        JSON.stringify({time:new Date().toISOString(), buys:buys.slice(0,8), bottoms:bottoms.slice(0,5)}, null, 2));
    console.log('\n\n💾 Saved: quantum_hunter_report.json');
}

runHunter().catch(console.error);
