/**
 * QUANTUM INSTITUTIONAL THINK TANK V5
 * ===================================
 * Using EastMoney API for reliable data
 * Institutional-grade analysis
 */

const http = require('http');
const fs = require('fs');

// Config
const PORTFOLIO = [
    { code: '688185', name: '康希诺', sector: '医药', market: 1 }
];

const HIDDEN_UNIVERSE = [
    { code: '835670', name: '数字人', sector: 'AI教育', market: 0 }, // BSE
    { code: '872926', name: '贝特瑞', sector: '新能源', market: 0 },
    { code: '870299', name: '吉林碳谷', sector: '新材料', market: 0 },
    { code: '300682', name: '朗新科技', sector: '科技', market: 0 },
    { code: '300454', name: '网宿科技', sector: '科技', market: 0 },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', market: 0 },
    { code: '300122', name: '智飞生物', sector: '医药', market: 0 },
    { code: '300502', name: '新易盛', sector: '光模块', market: 0 },
    { code: '0700', name: '腾讯控股', sector: '科技', market: 116 },
    { code: '9988', name: '阿里巴巴', sector: '科技', market: 116 },
    { code: '002475', name: '立讯精密', sector: '科技', market: 0 },
    { code: '000651', name: '格力电器', sector: '家电', market: 0 },
    { code: '600703', name: '三安光电', sector: '半导体', market: 1 }
];

// API Functions
function fetchLiveData(code, market) {
    return new Promise((resolve) => {
        const secid = market === 1 ? `1.${code}` : (market === 0 ? `0.${code}` : `116.${code}`);
        const url = `http://push2.eastmoney.com/api/qt/ul/ul/np/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6,fl1,fl2&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65,f66,f67,f68,f69,f70`;
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data) {
                        resolve({
                            code, market,
                            price: json.data.ul_np?.p || 0,
                            change: json.data.ul_np?.d || 0,
                            changePct: json.data.ul_np?.dr || 0,
                            volume: json.data.ul_np?.v || 0,
                            amount: json.data.ul_np?.a || 0
                        });
                    } else resolve(null);
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function fetchKLine(code, market, days = 60) {
    return new Promise((resolve) => {
        const secid = market === 1 ? `1.${code}` : (market === 0 ? `0.${code}` : `116.${code}`);
        const url = `http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=20260227&lmt=${days}`;
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const klines = json.data?.klines || [];
                    const formatted = klines.map(k => {
                        const parts = k.split(',');
                        return {
                            date: parts[0],
                            open: parseFloat(parts[1]),
                            high: parseFloat(parts[2]),
                            low: parseFloat(parts[3]),
                            close: parseFloat(parts[4]),
                            volume: parseInt(parts[5]) || 0,
                            amount: parseFloat(parts[6]) || 0
                        };
                    });
                    resolve(formatted);
                } catch(e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

// Institutional Metrics
function calcOrderFlow(data) {
    if (!data || data.length < 10) return { score: 0, signal: 'NEUTRAL' };
    const recent = data.slice(-15);
    let buyP = 0, sellP = 0;
    for (let i = 1; i < recent.length; i++) {
        const chg = recent[i].close - recent[i-1].close;
        const vol = recent[i].volume || 1;
        if (chg > 0) buyP += vol * chg;
        else sellP += vol * Math.abs(chg);
    }
    const total = buyP + sellP;
    const score = total > 0 ? Math.round((buyP - sellP) / total * 100) : 0;
    let signal = 'NEUTRAL';
    if (score > 20) signal = 'STRONG_BUY';
    else if (score > 10) signal = 'BUYING';
    else if (score < -20) signal = 'STRONG_SELL';
    else if (score < -10) signal = 'SELLING';
    return { score, signal };
}

function detectAccumulation(data) {
    if (!data || data.length < 20) return { score: 50, pattern: 'UNKNOWN' };
    const prices = data.map(p => p.close);
    const vols = data.map(p => p.volume);
    const priceChg = (prices[prices.length-1] - prices[0]) / prices[0] * 100;
    const volChg = (vols.slice(-10).reduce((a,b)=>a+b,0) / 10) / (vols.slice(0,10).reduce((a,b)=>a+b,0) / 10) * 100 - 100;
    
    let score = 50, pattern = 'NEUTRAL';
    if (priceChg > 0 && volChg > 20) { score = 80; pattern = 'ACCUMULATION'; }
    else if (priceChg > 0 && volChg > 0) { score = 65; pattern = 'HEALTHY_RALLY'; }
    else if (priceChg < -5 && volChg > 30) { score = 90; pattern = 'SMART_MONEY_BUYING'; }
    else if (priceChg > 5 && volChg < -20) { score = 30; pattern = 'WEAK_RALLY'; }
    else if (priceChg < -10 && volChg < 0) { score = 20; pattern = 'SELLOFF'; }
    return { score, pattern, priceChg, volChg };
}

function findHiddenZones(data) {
    if (!data || data.length < 20) return [];
    const priceVol = {};
    data.forEach(bar => {
        const lvl = Math.round(bar.close * 100) / 100;
        priceVol[lvl] = (priceVol[lvl] || 0) + bar.volume;
    });
    const sorted = Object.entries(priceVol).sort((a,b) => b[1]-a[1]).slice(0,5);
    const curr = data[data.length-1].close;
    return sorted.map(([p,v]) => {
        const price = parseFloat(p);
        const dist = ((price - curr) / curr * 100);
        return { price, volume: v, distance: dist.toFixed(2)+'%', type: dist > 0 ? 'RESIST' : 'SUPPORT' };
    });
}

function calcDarkPool(data) {
    if (!data || data.length < 20) return { estimated: 0, ratio: 0 };
    const recent = data.slice(-5).reduce((a,b)=>a+b.volume,0)/5;
    const older = data.slice(-20,-5).reduce((a,b)=>a+b.volume,0)/15;
    const spike = recent / (older || 1);
    let ratio = 0;
    if (spike > 1.3) ratio = Math.round((spike - 1) * 50);
    return { ratio, spike: spike.toFixed(2) };
}

function detectPatterns(data) {
    if (!data || data.length < 30) return [];
    const patterns = [];
    const closes = data.map(p => p.close);
    const highs = data.map(p => p.high);
    const lows = data.map(p => p.low);
    const vols = data.map(p => p.volume);
    
    // Double bottom
    const min1 = Math.min(...lows.slice(-15,-5));
    const min2 = Math.min(...lows.slice(-5));
    if (Math.abs(min1 - min2) / min1 < 0.04) patterns.push({name:'DOUBLE_BOTTOM',conf:75,type:'BULLISH'});
    
    // Ascending channel
    if (closes[closes.length-1] > closes[0] && vols.slice(-10).reduce((a,b)=>a+b,0) > vols.slice(0,10).reduce((a,b)=>a+b,0)*1.2) {
        patterns.push({name:'ASC_CHANNEL',conf:70,type:'BULLISH'});
    }
    
    // Volume spike
    const avgV = vols.slice(-10).reduce((a,b)=>a+b,0)/10;
    const oldV = vols.slice(0,10).reduce((a,b)=>a+b,0)/10;
    if (avgV > oldV * 2) patterns.push({name:'VOL_SPIKE',conf:80,type:'NOTABLE'});
    
    // Hidden divergence
    const priceTr = closes[closes.length-1] - closes[closes.length-10];
    const volTr = vols.slice(-10).reduce((a,b)=>a+b,0) - vols.slice(-20,-10).reduce((a,b)=>a+b,0);
    if (priceTr < 0 && volTr > 0) patterns.push({name:'HIDDEN_DIV',conf:85,type:'BULLISH'});
    
    // Volatility squeeze
    const volat = highs.map((h,i) => h - lows[i]).slice(-15);
    const avgVolat = volat.reduce((a,b)=>a+b,0)/15;
    if (volat[volat.length-1] < avgVolat * 0.5) patterns.push({name:'SQEEZE',conf:90,type:'EXPLOSIVE'});
    
    return patterns;
}

function calcInstScore(flow, accum, darkPool, priceChg) {
    let score = 0;
    score += flow.score * 0.3;
    score += (accum.score - 50) * 0.6;
    score += Math.min(20, darkPool.ratio);
    score += Math.max(-20, Math.min(20, priceChg));
    score = Math.round(score);
    
    let sentiment = 'NEUTRAL';
    if (score > 30) sentiment = 'STRONG INST BUY';
    else if (score > 10) sentiment = 'MODERATE BUY';
    else if (score < -30) sentiment = 'STRONG INST SELL';
    else if (score < -10) sentiment = 'MODERATE SELL';
    
    return { score, sentiment };
}

async function analyzeStock(stock) {
    console.log(`\n${'='.repeat(55)}`);
    console.log(`ANALYZING: ${stock.name} (${stock.code}) - ${stock.sector}`);
    console.log('='.repeat(55));
    
    const [live, kline] = await Promise.all([
        fetchLiveData(stock.code, stock.market),
        fetchKLine(stock.code, stock.market, 60)
    ]);
    
    if (!live || kline.length < 20) {
        console.log(`❌ Insufficient data for ${stock.code}`);
        return null;
    }
    
    console.log(`💰 ${live.price} | ${live.changePct > 0 ? '+' : ''}${live.changePct}% | Vol: ${(live.volume/10000).toFixed(0)}w`);
    
    const flow = calcOrderFlow(kline);
    const accum = detectAccumulation(kline);
    const zones = findHiddenZones(kline);
    const dark = calcDarkPool(kline);
    const patterns = detectPatterns(kline);
    const priceChg = (kline[kline.length-1].close - kline[0].close) / kline[0].close * 100;
    const instScore = calcInstScore(flow, accum, dark, priceChg);
    
    console.log(`\n📊 Order Flow: ${flow.signal} (${flow.score})`);
    console.log(`📊 Accumulation: ${accum.pattern} (${accum.score})`);
    console.log(`📊 Dark Pool: ${dark.ratio}% (spike ${dark.spike}x)`);
    console.log(`📊 Hidden Zones: ${zones.slice(0,3).map(z => `${z.type}¥${z.price}`).join(', ')}`);
    
    if (patterns.length) {
        console.log(`\n🔮 Patterns: ${patterns.map(p => p.name).join(', ')}`);
    }
    
    console.log(`\n🔥 INST SCORE: ${instScore.score} | ${instScore.sentiment}`);
    
    let rec = 'HOLD';
    if (instScore.score > 30 && flow.score > 10) rec = 'BUY';
    else if (instScore.score < -20) rec = 'SELL';
    else if (instScore.score > 15 && accum.pattern === 'SMART_MONEY_BUYING') rec = 'BUY';
    
    console.log(`\n${'-'.repeat(55)}`);
    console.log(`🎯 RECOMMENDATION: ${rec}`);
    console.log('-'.repeat(55));
    
    return { stock, live, flow, accum, zones, dark, patterns, instScore, priceChg, rec };
}

async function main() {
    console.log('\n🏛️ QUANTUM INSTITUTIONAL THINK TANK V5');
    console.log('='.repeat(50));
    
    // Portfolio
    console.log('\n📋 YOUR PORTFOLIO');
    const portResults = [];
    for (const s of PORTFOLIO) {
        const r = await analyzeStock(s);
        if (r) portResults.push(r);
        await new Promise(r => setTimeout(r, 300));
    }
    
    // Hidden gems
    console.log('\n\n💎 HIDDEN GEMS');
    const hiddenResults = [];
    for (const s of HIDDEN_UNIVERSE.slice(0,8)) {
        const r = await analyzeStock(s);
        if (r) hiddenResults.push(r);
        await new Promise(r => setTimeout(r, 300));
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL RANKING - INSTITUTIONAL VIEW');
    console.log('='.repeat(60));
    
    const all = [...portResults, ...hiddenResults].sort((a,b) => b.instScore.score - a.instScore.score);
    
    console.log('\n🏆 TOP PICKS:');
    all.slice(0,5).forEach((r,i) => {
        const tag = r.rec === 'BUY' ? '🟢' : r.rec === 'SELL' ? '🔴' : '🟡';
        console.log(`   ${i+1}. ${r.stock.name} (${r.stock.code}) | Score: ${r.instScore.score} ${tag} ${r.rec}`);
    });
    
    // Save
    const report = { time: new Date().toISOString(), portfolio: portResults, hidden: hiddenResults, top: all.slice(0,5) };
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/quantum_inst_report.json`, JSON.stringify(report, null, 2));
    console.log('\n💾 Saved: quantum_inst_report.json');
}

main().catch(console.error);
