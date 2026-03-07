/**
 * QUANTUM INSTITUTIONAL THINK TANK V7
 * Using Order Book Analysis - What Institutions Actually Watch
 * 10-level bid/ask reveals hidden institutional activity
 */

const http = require('http');
const fs = require('fs');

const PORTFOLIO = [
    { code: '688185', name: '康希诺', sector: '医药', market: 'sh' }
];

const HIDDEN_UNIVERSE = [
    { code: '835670', name: '数字人', sector: 'AI教育', market: 'bj' },
    { code: '872926', name: '贝特瑞', sector: '新能源', market: 'bj' },
    { code: '300122', name: '智飞生物', sector: '医药', market: 'sz' },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', market: 'sz' },
    { code: '300682', name: '朗新科技', sector: '科技', market: 'sz' },
    { code: '300454', name: '网宿科技', sector: '科技', market: 'sz' },
    { code: '0700', name: '腾讯控股', sector: '科技', market: 'hk' },
    { code: '9988', name: '阿里巴巴', sector: '科技', market: 'hk' },
    { code: '002475', name: '立讯精密', sector: '科技', market: 'sz' },
    { code: '000651', name: '格力电器', sector: '家电', market: 'sz' }
];

// Fetch with 10-level order book
function fetchFullData(code, market) {
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
                    if (p.length < 50) { resolve(null); return; }
                    
                    // Parse 10-level order book (fields 9-28: bid prices, volumes)
                    const bids = [];
                    const asks = [];
                    for (let i = 0; i < 10; i++) {
                        bids.push({ price: parseFloat(p[9 + i*2]) || 0, vol: parseInt(p[10 + i*2]) || 0 });
                        asks.push({ price: parseFloat(p[19 + i*2]) || 0, vol: parseInt(p[20 + i*2]) || 0 });
                    }
                    
                    resolve({
                        code: p[0], name: p[1], price: parseFloat(p[3]) || 0,
                        change: parseFloat(p[4]) || 0, changePct: parseFloat(p[5]) || 0,
                        volume: parseInt(p[6]) || 0, amount: parseInt(p[7]) || 0,
                        open: parseFloat(p[13]) || 0, high: parseFloat(p[14]) || 0, low: parseFloat(p[15]) || 0,
                        bid1: parseFloat(p[9]) || 0, ask1: parseFloat(p[19]) || 0,
                        bids, asks,
                        turnover: parseFloat(p[37]) || 0,
                        pe: parseFloat(p[39]) || 0,
                        high52: parseFloat(p[33]) || 0, low52: parseFloat(p[34]) || 0
                    });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

// INSTITUTIONAL ANALYSIS FUNCTIONS

/**
 * Order Book Imbalance - Key Institutional Signal
 * Institutions accumulate by placing large bids just below price
 */
function calcOrderImbalance(data) {
    if (!data || !data.bids || !data.asks) return { ratio: 0, signal: 'NEUTRAL' };
    
    const bidVol = data.bids.reduce((a, b) => a + b.vol, 0);
    const askVol = data.asks.reduce((a, b) => a + b.vol, 0);
    const total = bidVol + askVol;
    
    if (total === 0) return { ratio: 0, signal: 'NEUTRAL' };
    
    // Positive = more buying pressure (institutions accumulating)
    const ratio = (bidVol - askVol) / total * 100;
    
    let signal = 'NEUTRAL';
    if (ratio > 30) signal = 'STRONG_BUY_ORDERS';
    else if (ratio > 15) signal = 'BUYING_PRESSURE';
    else if (ratio > 5) signal = 'SLIGHT_BUY';
    else if (ratio < -30) signal = 'STRONG_SELL_ORDERS';
    else if (ratio < -15) signal = 'SELLING_PRESSURE';
    else if (ratio < -5) signal = 'SLIGHT_SELL';
    
    return { ratio: Math.round(ratio), signal, bidVol, askVol };
}

/**
 * Hidden Liquidity Detection
 * Large orders hidden in the depth
 */
function findHiddenLiquidity(data) {
    if (!data || !data.bids) return [];
    
    const hidden = [];
    // Look for large orders (institutions) hidden in deeper levels
    data.bids.forEach((b, i) => {
        if (b.vol > data.bids[0].vol * 0.5 && i > 2) {
            hidden.push({ type: 'BUY_HIDDEN', level: i+1, price: b.price, volume: b.vol });
        }
    });
    data.asks.forEach((a, i) => {
        if (a.vol > data.asks[0].vol * 0.5 && i > 2) {
            hidden.push({ type: 'SELL_HIDDEN', level: i+1, price: a.price, volume: a.vol });
        }
    });
    
    return hidden;
}

/**
 * Spread Analysis
 * Tight spread = high liquidity (institutional)
 * Wide spread = low liquidity (retail trap)
 */
function calcSpreadScore(data) {
    if (!data || !data.bids || !data.asks || data.bids.length === 0) return { score: 50, analysis: 'UNKNOWN' };
    
    const spread = data.ask1 - data.bid1;
    const spreadPct = spread / data.price * 100;
    
    let score = 50;
    let analysis = 'NORMAL';
    
    if (spreadPct < 0.1) { score = 90; analysis = 'HIGH LIQUIDITY - INSTITUTIONAL'; }
    else if (spreadPct < 0.2) { score = 75; analysis = 'GOOD LIQUIDITY'; }
    else if (spreadPct < 0.5) { score = 50; analysis = 'AVERAGE'; }
    else if (spreadPct < 1.0) { score = 30; analysis = 'LOW LIQUIDITY'; }
    else { score = 15; analysis = 'VERY LOW - RETAIL TRAP'; }
    
    return { score, spread, spreadPct: spreadPct.toFixed(3), analysis };
}

/**
 * Volume Weighted Price (VWAP) approximation
 * Institutions track VWAP to see if they're being filled at fair price
 */
function calcVWAP(data) {
    if (!data || !data.bids || !data.asks) return { vwap: 0, premium: 0 };
    
    let totalVol = 0;
    let totalVal = 0;
    
    [...data.bids, ...data.asks].forEach(o => {
        totalVol += o.vol;
        totalVal += o.price * o.vol;
    });
    
    const vwap = totalVol > 0 ? totalVal / totalVol : data.price;
    const premium = ((data.price - vwap) / vwap * 100);
    
    return { vwap: vwap.toFixed(2), premium: premium.toFixed(2) };
}

/**
 * Order Book Slope - Detects Accumulation vs Distribution
 * Steep slope = strong support/resistance
 */
function calcBookSlope(data) {
    if (!data || !data.bids || data.bids.length < 3) return { slope: 0, pattern: 'UNKNOWN' };
    
    // Calculate how fast volume decreases from best bid
    const bidVols = data.bids.map(b => b.vol);
    const avgVol = bidVols.reduce((a,b) => a+b, 0) / bidVols.length;
    const firstVol = bidVols[0] || 1;
    
    // If first level has much more volume = strong support
    const concentration = firstVol / avgVol;
    
    let pattern = 'DISTRIBUTED';
    if (concentration > 3) pattern = 'STRONG_ACCUMULATION';
    else if (concentration > 2) pattern = 'ACCUMULATION';
    else if (concentration < 0.5) pattern = 'DISTRIBUTION';
    
    return { slope: concentration.toFixed(2), pattern };
}

/**
 * Institutional Score Composite
 */
function calcInstitutionalScore(imb, spread, vwap, slope, changePct) {
    let score = 0;
    
    // Order imbalance (35%)
    score += (imb.ratio / 100) * 35;
    
    // Spread/Liquidity (20%)
    score += (spread.score - 50) * 0.4;
    
    // VWAP Premium (15%)
    score += Math.max(-15, Math.min(15, -parseFloat(vwap.premium))) * 1;
    
    // Book slope (15%)
    if (slope.pattern.includes('ACCUM')) score += 15;
    else if (slope.pattern.includes('DISTRIB')) score -= 10;
    
    // Price momentum (15%)
    score += Math.max(-15, Math.min(15, changePct));
    
    score = Math.round(score);
    
    let sentiment = 'NEUTRAL';
    if (score > 35) sentiment = '🔥 STRONG INST BUY';
    else if (score > 15) sentiment = '🟢 MODERATE BUY';
    else if (score < -35) sentiment = '🔴 STRONG INST SELL';
    else if (score < -15) sentiment = '🟡 MODERATE SELL';
    
    return { score, sentiment };
}

// MAIN ANALYSIS
async function analyzeStock(stock) {
    console.log(`\n${'='.repeat(55)}`);
    console.log(`🏛️ INSTITUTIONAL DEEP DIVE: ${stock.name} (${stock.code})`);
    console.log(`   Sector: ${stock.sector}`);
    console.log('='.repeat(55));
    
    const data = await fetchFullData(stock.code, stock.market);
    
    if (!data) {
        console.log(`❌ No data: ${stock.code}`);
        return null;
    }
    
    console.log(`💰 Price: ¥${data.price} | Change: ${data.changePct > 0 ? '+' : ''}${data.changePct}%`);
    console.log(`📊 Volume: ${(data.volume/1e6).toFixed(2)}M | Turnover: ¥${(data.amount/1e8).toFixed(2)}B`);
    console.log(`📈 High: ¥${data.high} | Low: ¥${data.low}`);
    
    // Institutional Analysis
    const imb = calcOrderImbalance(data);
    const liquidity = calcSpreadScore(data);
    const vwap = calcVWAP(data);
    const slope = calcBookSlope(data);
    const hidden = findHiddenLiquidity(data);
    const instScore = calcInstitutionalScore(imb, liquidity, vwap, slope, data.changePct);
    
    console.log(`\n🎯 ORDER BOOK ANALYSIS:`);
    console.log(`   Imbalance: ${imb.signal} (${imb.ratio}%)`);
    console.log(`   Bid Volume: ${(imb.bidVol/10000).toFixed(0)}w | Ask Volume: ${(imb.askVol/10000).toFixed(0)}w`);
    
    console.log(`\n💧 LIQUIDITY:`);
    console.log(`   Spread: ¥${liquidity.spread} (${liquidity.spreadPct}%)`);
    console.log(`   Analysis: ${liquidity.analysis}`);
    
    console.log(`\n📐 VWAP:`);
    console.log(`   VWAP: ¥${vwap.vwap} | Premium: ${vwap.premium}%`);
    
    console.log(`\n📊 ORDER BOOK SLOPE:`);
    console.log(`   Pattern: ${slope.pattern} (concentration: ${slope.slope}x)`);
    
    if (hidden.length > 0) {
        console.log(`\n🔮 HIDDEN LIQUIDITY:`);
        hidden.slice(0,3).forEach(h => {
            console.log(`   ${h.type} @ Level ${h.level}: ¥${h.price} (${(h.vol/100).toFixed(0)}手)`);
        });
    }
    
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`🔥 INSTITUTIONAL SCORE: ${instScore.score} | ${instScore.sentiment}`);
    console.log('─'.repeat(55));
    
    // Recommendation
    let rec = 'HOLD';
    if (instScore.score > 25 && imb.ratio > 15) rec = 'STRONG BUY';
    else if (instScore.score > 15) rec = 'BUY';
    else if (instScore.score < -25) rec = 'SELL';
    else if (instScore.score < -15) rec = 'WEAK';
    
    const tag = rec.includes('BUY') ? '🟢' : rec.includes('SELL') ? '🔴' : '🟡';
    console.log(`\n🎯 RECOMMENDATION: ${tag} ${rec}`);
    
    return { stock, data, imb, liquidity, vwap, slope, hidden, instScore, rec };
}

async function main() {
    console.log('\n' + '🏛️'.repeat(15));
    console.log('   QUANTUM INSTITUTIONAL THINK TANK V7');
    console.log('   Order Book Analysis - Institutional Grade');
    console.log('🏛️'.repeat(15));
    
    // Portfolio
    console.log('\n📋 YOUR PORTFOLIO');
    const portResults = [];
    for (const s of PORTFOLIO) {
        const r = await analyzeStock(s);
        if (r) portResults.push(r);
        await new Promise(x => setTimeout(x, 300));
    }
    
    // Hidden Gems
    console.log('\n\n💎 HIDDEN GEMS - INSTITUTIONAL VIEW');
    const hiddenResults = [];
    for (const s of HIDDEN_UNIVERSE) {
        const r = await analyzeStock(s);
        if (r) hiddenResults.push(r);
        await new Promise(x => setTimeout(x, 300));
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL RANKING - INSTITUTIONAL PERSPECTIVE');
    console.log('='.repeat(60));
    
    const all = [...portResults, ...hiddenResults].sort((a, b) => b.instScore.score - a.instScore.score);
    
    console.log('\n🏆 TOP INSTITUTIONAL PICKS:');
    all.slice(0,6).forEach((r, i) => {
        const t = r.rec.includes('BUY') ? '🟢' : r.rec.includes('SELL') ? '🔴' : '🟡';
        console.log(`   ${i+1}. ${r.stock.name} (${r.stock.code}) | Score: ${r.instScore.score} | ${t} ${r.rec}`);
        console.log(`      Imbalance: ${r.imb.ratio}% | Pattern: ${r.slope.pattern}`);
    });
    
    // Save report
    const report = {
        time: new Date().toISOString(),
        portfolio: portResults,
        hiddenGems: hiddenResults,
        topPicks: all.slice(0,5)
    };
    
    const fname = `quantum_institutional_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/${fname}`, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${fname}`);
}

main().catch(console.error);
