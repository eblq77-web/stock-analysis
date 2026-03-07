/**
 * QUANTUM INSTITUTIONAL THINK TANK V8 - FIXED
 * Order Book Analysis - What Institutions Watch
 */

const http = require('http');
const fs = require('fs');

const PORTFOLIO = [{ code: '688185', name: '康希诺', sector: '医药', market: 'sh' }];

const HIDDEN_UNIVERSE = [
    { code: '835670', name: '数字人', sector: 'AI教育', market: 'bj' },
    { code: '300122', name: '智飞生物', sector: '医药', market: 'sz' },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', market: 'sz' },
    { code: '300682', name: '朗新科技', sector: '科技', market: 'sz' },
    { code: '300454', name: '网宿科技', sector: '科技', market: 'sz' },
    { code: '002475', name: '立讯精密', sector: '科技', market: 'sz' },
    { code: '000651', name: '格力电器', sector: '家电', market: 'sz' }
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
                    
                    // Parse order book - positions 10-29 (10 bids: price,vol alternating)
                    const bids = [];
                    const asks = [];
                    for (let i = 0; i < 10; i++) {
                        bids.push({ price: parseFloat(p[10 + i*2]) || 0, vol: parseInt(p[11 + i*2]) || 0 });
                        asks.push({ price: parseFloat(p[20 + i*2]) || 0, vol: parseInt(p[21 + i*2]) || 0 });
                    }
                    
                    resolve({
                        code: p[2], name: p[1], price: parseFloat(p[3]) || 0,
                        change: parseFloat(p[4]) || 0, changePct: parseFloat(p[5]) || 0,
                        volume: parseInt(p[6]) || 0, amount: parseInt(p[7]) || 0,
                        open: parseFloat(p[5]) || 0, high: parseFloat(p[33]) || 0, low: parseFloat(p[34]) || 0,
                        pe: parseFloat(p[39]) || 0, turnover: parseFloat(p[37]) || 0,
                        high52: parseFloat(p[33]) || 0, low52: parseFloat(p[34]) || 0,
                        bids, asks
                    });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function analyzeOrderBook(data) {
    if (!data || !data.bids) return null;
    
    // Order imbalance
    const bidVol = data.bids.reduce((a, b) => a + b.vol, 0);
    const askVol = data.asks.reduce((a, b) => a + b.vol, 0);
    const total = bidVol + askVol;
    const imbalance = total > 0 ? Math.round((bidVol - askVol) / total * 100) : 0;
    
    // Signal
    let signal = 'NEUTRAL';
    if (imbalance > 30) signal = 'STRONG_BUY';
    else if (imbalance > 15) signal = 'BUYING';
    else if (imbalance > 5) signal = 'SLIGHT_BUY';
    else if (imbalance < -30) signal = 'STRONG_SELL';
    else if (imbalance < -15) signal = 'SELLING';
    else if (imbalance < -5) signal = 'SLIGHT_SELL';
    
    // Spread
    const spread = data.asks[0].price - data.bids[0].price;
    const spreadPct = (spread / data.price) * 100;
    
    // Liquidity score
    let liqScore = 50;
    let liqAnalysis = 'NORMAL';
    if (spreadPct < 0.1) { liqScore = 90; liqAnalysis = 'HIGH INSTITUTIONAL'; }
    else if (spreadPct < 0.2) { liqScore = 75; liqAnalysis = 'GOOD'; }
    else if (spreadPct < 0.5) { liqScore = 50; liqAnalysis = 'AVERAGE'; }
    else { liqScore = 25; liqAnalysis = 'LOW - RETAIL'; }
    
    // Book concentration
    const firstBid = data.bids[0].vol || 1;
    const avgBid = bidVol / 10;
    const concentration = firstBid / avgBid;
    let pattern = 'DISTRIBUTED';
    if (concentration > 3) pattern = 'STRONG_ACCUM';
    else if (concentration > 2) pattern = 'ACCUMULATION';
    else if (concentration < 0.5) pattern = 'DISTRIBUTION';
    
    // Hidden orders (large orders deeper in book)
    const hiddenBuys = data.bids.filter((b, i) => i > 2 && b.vol > firstBid * 0.5);
    const hiddenSells = data.asks.filter((a, i) => i > 2 && a.vol > data.asks[0].vol * 0.5);
    
    return {
        imbalance, signal, bidVol, askVol,
        spread: spread.toFixed(3), spreadPct: spreadPct.toFixed(3),
        liqScore, liqAnalysis, concentration: concentration.toFixed(2), pattern,
        hiddenBuys: hiddenBuys.length, hiddenSells: hiddenSells.length,
        topBid: data.bids[0], topAsk: data.asks[0]
    };
}

function calcInstScore(analysis, changePct) {
    if (!analysis) return { score: 0, sentiment: 'NO DATA' };
    
    let score = 0;
    score += (analysis.imbalance / 100) * 35;
    score += (analysis.liqScore - 50) * 0.4;
    if (analysis.pattern.includes('ACCUM')) score += 15;
    else if (analysis.pattern.includes('DISTRIB')) score -= 10;
    score += Math.max(-15, Math.min(15, changePct));
    score = Math.round(score);
    
    let sentiment = 'NEUTRAL';
    if (score > 30) sentiment = '🔥 STRONG BUY';
    else if (score > 15) sentiment = '🟢 BUY';
    else if (score < -30) sentiment = '🔴 STRONG SELL';
    else if (score < -15) sentiment = '🟡 SELL';
    
    return { score, sentiment };
}

async function analyze(stock) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${stock.name} (${stock.code}) - ${stock.sector}`);
    console.log('='.repeat(50));
    
    const data = await fetchStockData(stock.code, stock.market);
    if (!data) { console.log('No data'); return null; }
    
    console.log(`¥${data.price} | ${data.changePct > 0 ? '+' : ''}${data.changePct}% | Vol: ${(data.volume/1e4).toFixed(0)}w`);
    
    const ab = analyzeOrderBook(data);
    if (!ab) { console.log('No order book'); return null; }
    
    console.log(`\n📊 ORDER BOOK:`);
    console.log(`   Imbalance: ${ab.signal} (${ab.imbalance}%)`);
    console.log(`   Bids: ${(ab.bidVol/100).toFixed(0)}手 | Asks: ${(ab.askVol/100).toFixed(0)}手`);
    console.log(`   Spread: ¥${ab.spread} (${ab.spreadPct}%) - ${ab.liqAnalysis}`);
    console.log(`   Pattern: ${ab.pattern} (conc: ${ab.concentration}x)`);
    console.log(`   Hidden: ${ab.hiddenBuys} buy orders, ${ab.hiddenSells} sell orders deeper`);
    
    const inst = calcInstScore(ab, data.changePct);
    console.log(`\n🔥 INST SCORE: ${inst.score} | ${inst.sentiment}`);
    
    let rec = 'HOLD';
    if (inst.score > 20 && ab.imbalance > 10) rec = 'STRONG BUY';
    else if (inst.score > 10) rec = 'BUY';
    else if (inst.score < -20) rec = 'SELL';
    else if (inst.score < -10) rec = 'WEAK';
    
    const tag = rec.includes('BUY') ? '🟢' : rec.includes('SELL') ? '🔴' : '🟡';
    console.log(`🎯 ${tag} ${rec}`);
    
    return { stock, data, ab, inst, rec };
}

async function main() {
    console.log('\n🏛️ QUANTUM INSTITUTIONAL V8 - ORDER BOOK');
    console.log('='.repeat(50));
    
    const pr = [];
    for (const s of PORTFOLIO) {
        const r = await analyze(s);
        if (r) pr.push(r);
    }
    
    const hr = [];
    for (const s of HIDDEN_UNIVERSE) {
        const r = await analyze(s);
        if (r) hr.push(r);
        await new Promise(x => setTimeout(x, 200));
    }
    
    console.log('\n\n' + '='.repeat(55));
    console.log('📊 RANKING - INSTITUTIONAL VIEW');
    console.log('='.repeat(55));
    
    const all = [...pr, ...hr].sort((a, b) => b.inst.score - a.inst.score);
    
    console.log('\n🏆 TOP PICKS:');
    all.slice(0,5).forEach((r, i) => {
        const t = r.rec.includes('BUY') ? '🟢' : r.rec.includes('SELL') ? '🔴' : '🟡';
        console.log(`   ${i+1}. ${r.stock.name} (${r.stock.code}) | ${r.inst.score} | ${t} ${r.rec}`);
        console.log(`      Imbalance: ${r.ab.imbalance}% | Pattern: ${r.ab.pattern}`);
    });
    
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/quantum_inst_report.json`, 
        JSON.stringify({time:new Date().toISOString(),portfolio:pr,hidden:hr,top:all.slice(0,5)}, null, 2));
    console.log('\n💾 Saved: quantum_inst_report.json');
}

main().catch(console.error);
