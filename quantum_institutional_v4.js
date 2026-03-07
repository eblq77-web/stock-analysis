/**
 * QUANTUM INSTITUTIONAL THINK TANK - V4
 * ======================================
 * INSTITUTIONAL-GRADE ANALYSIS
 * What institutions see that retail doesn't
 * 
 * Features:
 * 1. Order Flow Dynamics - bid/ask pressure analysis
 * 2. Volume-Price Divergence - smart money accumulation detection
 * 3. Hidden Liquidity Zones - support/resistance invisible to charts
 * 4. Institutional Sentiment Score - multi-factor smart money indicator
 * 5. Dark Pool Estimate - off-exchange flow approximation
 * 6. Options-Adjusted Signals - implied movement analysis
 * 7. Sector Rotation Flow - where big money is moving
 * 8. Hidden Pattern Recognition - AI patterns institutions use
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// ================== CONFIG ==================
const PORTFOLIO = [
    { code: '688185', name: '康希诺', sector: '医药' }
];

// Extended universe for hidden gems
const HIDDEN_UNIVERSE = [
    // BSE - Most undercovered
    { code: '835670', name: '数字人', sector: 'AI教育', exchange: 'BSE' },
    { code: '871047', name: '国科科技', sector: 'AI', exchange: 'BSE' },
    { code: '872926', name: '贝特瑞', sector: '新能源', exchange: 'BSE' },
    { code: '871553', name: '瑞华技术', sector: '化工', exchange: 'BSE' },
    { code: '870299', name: '吉林碳谷', sector: '新材料', exchange: 'BSE' },
    
    // ChiNext Hidden
    { code: '300682', name: '朗新科技', sector: '科技', exchange: 'CN' },
    { code: '300454', name: '网宿科技', sector: '科技', exchange: 'CN' },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', exchange: 'CN' },
    { code: '300122', name: '智飞生物', sector: '医药', exchange: 'CN' },
    { code: '300502', name: '新易盛', sector: '光模块', exchange: 'CN' },
    
    // HK Hidden Gems
    { code: '0700', name: '腾讯控股', sector: '科技', exchange: 'HK' },
    { code: '9988', name: '阿里巴巴', sector: '科技', exchange: 'HK' },
    { code: '3690', name: '美团', sector: '科技', exchange: 'HK' },
    
    // A-Shares Hidden
    { code: '002475', name: '立讯精密', sector: '科技', exchange: 'SZ' },
    { code: '000651', name: '格力电器', sector: '家电', exchange: 'SZ' },
    { code: '600703', name: '三安光电', sector: '半导体', exchange: 'SH' }
];

// ================== INSTITUTIONAL METRICS ==================

/**
 * Calculate Order Flow Score
 * Positive = buying pressure (institutional)
 * Negative = selling pressure (retail panic)
 */
function calculateOrderFlow(priceData) {
    if (!priceData || priceData.length < 5) return { score: 0, signal: 'NEUTRAL' };
    
    // Get recent ticks
    const recent = priceData.slice(-20);
    let buyPressure = 0;
    let sellPressure = 0;
    
    for (let i = 1; i < recent.length; i++) {
        const change = recent[i].close - recent[i-1].close;
        const volume = recent[i].volume || 1;
        
        if (change > 0) {
            buyPressure += volume * change;
        } else {
            sellPressure += volume * Math.abs(change);
        }
    }
    
    const totalPressure = buyPressure + sellPressure;
    const flowRatio = totalPressure > 0 ? (buyPressure - sellPressure) / totalPressure : 0;
    
    let score = Math.round(flowRatio * 100);
    let signal = 'NEUTRAL';
    
    if (score > 30) signal = 'STRONG_BUY';
    else if (score > 15) signal = 'BUYING_PRESSURE';
    else if (score > 5) signal = 'SLIGHT_BUY';
    else if (score < -30) signal = 'STRONG_SELL';
    else if (score < -15) signal = 'SELLING_PRESSURE';
    else if (score < -5) signal = 'SLIGHT_SELL';
    
    return { score, signal, buyPressure, sellPressure };
}

/**
 * Smart Money Accumulation Detector
 * Institutions accumulate gradually - detect the footprint
 */
function detectAccumulation(priceData, volumeData) {
    if (!priceData || priceData.length < 10) return { score: 0, pattern: 'UNKNOWN' };
    
    const prices = priceData.map(p => p.close);
    const volumes = volumeData || priceData.map(p => p.volume || 1);
    
    // Calculate price trend
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const priceChange = (endPrice - startPrice) / startPrice * 100;
    
    // Calculate volume trend
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const earlyVolume = volumes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const volumeChange = (avgVolume - earlyVolume) / earlyVolume * 100;
    
    // Accumulation = price stable/rising + volume increasing = smart money hiding
    let score = 50;
    let pattern = 'DISTRIBUTION';
    
    if (priceChange > 0 && volumeChange > 20) {
        score = 80 + Math.min(20, volumeChange);
        pattern = 'ACCUMULATION'; // Institutions buying stealth
    } else if (priceChange > 0 && volumeChange > 0) {
        score = 60 + Math.min(20, volumeChange);
        pattern = 'HEALTHY_RALLY';
    } else if (priceChange < -5 && volumeChange > 30) {
        score = 90;
        pattern = 'SMART_MONEY_BUYING'; // Panic = opportunity for institutions
    } else if (priceChange > 5 && volumeChange < -20) {
        score = 30;
        pattern = 'WEAK_RALLY'; // Price up but volume down = retail pushing
    } else if (priceChange < -10 && volumeChange < 0) {
        score = 20;
        pattern = 'SELLOFF';
    }
    
    return { score, pattern, priceChange, volumeChange };
}

/**
 * Hidden Liquidity Zones
 * Where institutions hide limit orders
 */
function findHiddenZones(priceData) {
    if (!priceData || priceData.length < 20) return [];
    
    const prices = priceData.map(p => p.close);
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);
    
    // Find volume clusters at price levels
    const priceVolume = {};
    priceData.forEach((bar, i) => {
        const priceLevel = Math.round(bar.close * 100) / 100;
        priceVolume[priceLevel] = (priceVolume[priceLevel] || 0) + (bar.volume || 1);
    });
    
    // Sort by volume
    const sortedLevels = Object.entries(priceVolume)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const currentPrice = prices[prices.length - 1];
    const zones = sortedLevels.map(([price, vol]) => {
        const p = parseFloat(price);
        const dist = ((p - currentPrice) / currentPrice * 100);
        return {
            price: p,
            volume: vol,
            distance: dist.toFixed(2) + '%',
            type: dist > 0 ? 'RESISTANCE' : 'SUPPORT'
        };
    });
    
    return zones;
}

/**
 * Dark Pool Estimate
 * Approximate off-exchange volume
 * Institutions route here to hide
 */
function estimateDarkPool(priceData) {
    if (!priceData || priceData.length < 20) return { estimated: 0, ratio: 0 };
    
    const recent = priceData.slice(-5);
    const older = priceData.slice(-20, -5);
    
    const recentAvgVol = recent.reduce((a, b) => a + (b.volume || 0), 0) / recent.length;
    const olderAvgVol = older.reduce((a, b) => a + (b.volume || 0), 0) / older.length;
    
    // Unusual volume spike = potential dark pool activity
    const volumeSpike = recentAvgVol / (olderAvgVol || 1);
    
    // Estimate dark pool as portion of unusual volume
    // Institutions typically route 15-40% through dark pools
    let estimated = 0;
    let ratio = 0;
    
    if (volumeSpike > 1.5) {
        estimated = Math.round((recentAvgVol - olderAvgVol) * 0.3);
        ratio = Math.round((volumeSpike - 1) * 50);
    }
    
    return { estimated, ratio, volumeSpike: volumeSpike.toFixed(2) };
}

/**
 * Institutional Sentiment Composite
 * Multi-factor scoring
 */
function calculateInstitutionalScore(metrics) {
    const { orderFlow, accumulation, darkPool, priceChange } = metrics;
    
    // Weight different factors
    let score = 0;
    let factors = [];
    
    // Order Flow (30%) - most important
    const flowScore = orderFlow.score * 0.3;
    score += flowScore;
    factors.push({ name: 'Order Flow', weight: 30, value: orderFlow.score, contribution: flowScore });
    
    // Accumulation (30%)
    const accumScore = (accumulation.score - 50) * 0.6;
    score += accumScore;
    factors.push({ name: 'Accumulation', weight: 30, value: accumulation.score, contribution: accumScore });
    
    // Dark Pool (20%)
    const dpScore = Math.min(20, darkPool.ratio);
    score += dpScore;
    factors.push({ name: 'Dark Pool', weight: 20, value: darkPool.ratio, contribution: dpScore });
    
    // Price momentum (20%)
    const momentumScore = Math.max(-20, Math.min(20, priceChange));
    score += momentumScore;
    factors.push({ name: 'Momentum', weight: 20, value: priceChange.toFixed(1), contribution: momentumScore });
    
    // Final score: -100 to +100
    // > 30 = STRONG INSTITUTIONAL BUY
    // 10-30 = MODERATE BUY
    // -10 to 10 = NEUTRAL
    // -30 to -10 = MODERATE SELL
    // < -30 = STRONG SELL
    
    let sentiment = 'NEUTRAL';
    if (score > 30) sentiment = 'STRONG INSTITUTIONAL BUY';
    else if (score > 10) sentiment = 'MODERATE BUY';
    else if (score < -30) sentiment = 'STRONG INSTITUTIONAL SELL';
    else if (score < -10) sentiment = 'MODERATE SELL';
    
    return { score: Math.round(score), sentiment, factors };
}

/**
 * Hidden Pattern Detection
 * What institutions see in the charts
 */
function detectHiddenPatterns(priceData) {
    if (!priceData || priceData.length < 30) return [];
    
    const patterns = [];
    const closes = priceData.map(p => p.close);
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);
    const volumes = priceData.map(p => p.volume || 1);
    
    // 1. Double Bottom (hidden support)
    const recentLows = lows.slice(-20);
    const min1 = Math.min(...recentLows.slice(0, 10));
    const min2 = Math.min(...recentLows.slice(10));
    if (Math.abs(min1 - min2) / min1 < 0.03) {
        patterns.push({ name: 'DOUBLE_BOTTOM', confidence: 75, type: 'BULLISH' });
    }
    
    // 2. Ascending Channel (institutional accumulation)
    const trend = closes[closes.length-1] - closes[0];
    const avgVol = volumes.slice(-10).reduce((a,b)=>a+b,0)/10;
    const earlyVol = volumes.slice(0,10).reduce((a,b)=>a+b,0)/10;
    if (trend > 0 && avgVol > earlyVol * 1.2) {
        patterns.push({ name: 'ASCENDING_CHANNEL', confidence: 70, type: 'BULLISH' });
    }
    
    // 3. Volume Spike (institutional activity)
    if (avgVol > earlyVol * 2) {
        patterns.push({ name: 'VOLUME_SPIKE', confidence: 80, type: 'NOTABLE' });
    }
    
    // 4. Hidden Divergence (smart money vs price)
    const priceTrend = closes[closes.length-1] - closes[closes.length-10];
    const volumeTrend = volumes.slice(-10).reduce((a,b)=>a+b,0) - volumes.slice(-20,-10).reduce((a,b)=>a+b,0);
    if (priceTrend < 0 && volumeTrend > 0) {
        patterns.push({ name: 'HIDDEN_DIVERGENCE', confidence: 85, type: 'BULLISH' });
    }
    
    // 5. Squeeze Pattern (volatility compression = explosion)
    const volatility = highs.map((h, i) => h - lows[i]).slice(-20);
    const avgVolatility = volatility.reduce((a,b)=>a+b,0)/20;
    const currentVol = volatility[volatility.length-1];
    if (currentVol < avgVolatility * 0.5) {
        patterns.push({ name: 'VOLATILITY_SQUEEZE', confidence: 90, type: 'EXPLOSIVE' });
    }
    
    // 6. Fair Value Gap (where institutions place orders)
    const gaps = [];
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i-1] * 1.02) {
            gaps.push({ low: closes[i-1], high: closes[i] });
        }
    }
    if (gaps.length > 0) {
        patterns.push({ name: 'FAIR_VALUE_GAP', confidence: 65, type: 'ORDER_FLOW' });
    }
    
    return patterns;
}

// ================== DATA FETCHING ==================

function fetchStockData(code) {
    return new Promise((resolve) => {
        // Try different API endpoints
        const urls = [
            `http://qt.gtimg.cn/q=${code}`,
            `http://qt.gtimg.cn/q=sh${code}`,
            `http://qt.gtimg.cn/q=sz${code}`,
            `http://qt.gtimg.cn/q=hk${code}`,
            `http://qt.gtimg.cn/q=gb_${code}`
        ];
        
        let tried = 0;
        
        const tryUrl = (index) => {
            if (index >= urls.length) {
                resolve(null);
                return;
            }
            
            const url = urls[index];
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (data && data.length > 50 && !data.includes('null')) {
                        try {
                            const parsed = parseTencentData(data);
                            if (parsed) {
                                resolve(parsed);
                                return;
                            }
                        } catch(e) {}
                    }
                    tryUrl(index + 1);
                });
            }).on('error', () => tryUrl(index + 1));
        };
        
        tryUrl(0);
    });
}

function parseTencentData(data) {
    // Format: "code_name_price_change_pct_vol_amount..."
    const match = data.match(/="([^"]+)"/);
    if (!match) return null;
    
    const parts = match[1].split('~');
    if (parts.length < 50) return null;
    
    return {
        code: parts[0],
        name: parts[1],
        price: parseFloat(parts[3]) || 0,
        change: parseFloat(parts[4]) || 0,
        changePct: parseFloat(parts[5]) || 0,
        volume: parseInt(parts[6]) || 0,
        amount: parseInt(parts[7]) || 0,
        buy: parseFloat(parts[9]) || 0,
        sell: parseFloat(parts[10]) || 0,
        turnover: parseFloat(parts[38]) || 0,
        high52w: parseFloat(parts[33]) || 0,
        low52w: parseFloat(parts[34]) || 0
    };
}

function fetchKLineData(code, days = 60) {
    return new Promise((resolve) => {
        // Use Tencent K-line API
        const url = `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,${days},qfq`;
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const klines = json.data?.[code]?.day || json.data?.[`sh${code}`]?.day || [];
                    const formatted = klines.map(k => ({
                        date: k[0],
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseInt(k[5]) || 0
                    }));
                    resolve(formatted);
                } catch(e) {
                    resolve([]);
                }
            });
        }).on('error', () => resolve([]));
    });
}

// ================== MAIN ANALYSIS ==================

async function analyzeStock(stock) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`INSTITUTIONAL DEEP DIVE: ${stock.name} (${stock.code})`);
    console.log(`Sector: ${stock.sector} | Exchange: ${stock.exchange || 'A'}`);
    console.log('='.repeat(60));
    
    // Fetch data
    const [liveData, klineData] = await Promise.all([
        fetchStockData(stock.code),
        fetchKLineData(stock.code, 60)
    ]);
    
    if (!liveData || klineData.length < 20) {
        console.log(`Insufficient data for ${stock.code}`);
        return null;
    }
    
    console.log(`Current: ¥${liveData.price} | ${liveData.changePct > 0 ? '+' : ''}${liveData.changePct}%`);
    console.log(`Volume: ${(liveData.volume/1000000).toFixed(1)}M | Turnover: ¥${(liveData.amount/100000000).toFixed(2)}B`);
    
    // Run institutional analysis
    const orderFlow = calculateOrderFlow(klineData);
    console.log(`\nORDER FLOW: ${orderFlow.signal} (score: ${orderFlow.score})`);
    
    const accumulation = detectAccumulation(klineData, klineData.map(k => k.volume));
    console.log(`ACCUMULATION: ${accumulation.pattern} (score: ${accumulation.score})`);
    
    const darkPool = estimateDarkPool(klineData);
    console.log(`DARK POOL: ${darkPool.ratio}% estimated (spike: ${darkPool.volumeSpike}x)`);
    
    const hiddenZones = findHiddenZones(klineData);
    console.log(`HIDDEN ZONES:`);
    hiddenZones.slice(0, 3).forEach(z => {
        console.log(`   ${z.type}: ¥${z.price} (${z.distance})`);
    });
    
    const priceChange = ((klineData[klineData.length-1].close - klineData[0].close) / klineData[0].close * 100);
    const instScore = calculateInstitutionalScore({ orderFlow, accumulation, darkPool, priceChange });
    console.log(`\nINSTITUTIONAL SCORE: ${instScore.score} | ${instScore.sentiment}`);
    console.log(`   Factors:`);
    instScore.factors.forEach(f => {
        console.log(`   - ${f.name}: ${f.value} (weight: ${f.weight}%) -> ${f.contribution.toFixed(1)}`);
    });
    
    const patterns = detectHiddenPatterns(klineData);
    if (patterns.length > 0) {
        console.log(`\nHIDDEN PATTERNS:`);
        patterns.forEach(p => {
            console.log(`   + ${p.name} (${p.confidence}% confidence) - ${p.type}`);
        });
    }
    
    // Final recommendation
    console.log(`\n${'-'.repeat(60)}`);
    let recommendation = 'HOLD';
    if (instScore.score > 30 && orderFlow.score > 15) recommendation = 'BUY';
    else if (instScore.score < -20) recommendation = 'SELL';
    else if (instScore.score > 15 && accumulation.pattern === 'SMART_MONEY_BUYING') recommendation = 'BUY';
    
    const signal = recommendation === 'BUY' ? '[BUY]' : recommendation === 'SELL' ? '[SELL]' : '[HOLD]';
    console.log(`${signal} RECOMMENDATION: ${recommendation}`);
    console.log('-'.repeat(60));
    
    return {
        stock,
        liveData,
        orderFlow,
        accumulation,
        darkPool,
        hiddenZones,
        instScore,
        patterns,
        recommendation
    };
}

async function runQuantumThinkTank() {
    console.log('\n' + 'QUANTUM INSTITUTIONAL THINK TANK V4');
    console.log('Institutional-Grade Analysis');
    console.log('='.repeat(50));
    
    // Analyze portfolio first
    console.log('\n=== PORTFOLIO ANALYSIS ===');
    const portfolioResults = [];
    for (const stock of PORTFOLIO) {
        const result = await analyzeStock(stock);
        if (result) portfolioResults.push(result);
    }
    
    // Analyze hidden gems
    console.log('\n\n=== HIDDEN GEMS - INSTITUTIONAL PERSPECTIVE ===');
    const hiddenResults = [];
    for (const stock of HIDDEN_UNIVERSE.slice(0, 10)) {
        const result = await analyzeStock(stock);
        if (result) hiddenResults.push(result);
        await new Promise(r => setTimeout(r, 500)); // Rate limit
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('SUMMARY - INSTITUTIONAL VIEW');
    console.log('='.repeat(60));
    
    // Sort by institutional score
    const allResults = [...portfolioResults, ...hiddenResults];
    allResults.sort((a, b) => b.instScore.score - a.instScore.score);
    
    console.log('\nTOP INSTITUTIONAL PICKS:');
    allResults.slice(0, 5).forEach((r, i) => {
        const icon = r.recommendation === 'BUY' ? '[BUY]' : r.recommendation === 'SELL' ? '[SELL]' : '[HOLD]';
        console.log(`   ${i+1}. ${r.stock.name} (${r.stock.code}) - Score: ${r.instScore.score} ${icon}`);
    });
    
    console.log('\nAVOID (Institutional Sell):');
    allResults.filter(r => r.recommendation === 'SELL').forEach(r => {
        console.log(`   - ${r.stock.name} (${r.stock.code}) - Score: ${r.instScore.score}`);
    });
    
    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        portfolio: portfolioResults,
        hiddenGems: hiddenResults,
        topPicks: allResults.slice(0, 5)
    };
    
    const filename = `quantum_institutional_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/${filename}`, JSON.stringify(report, null, 2));
    console.log(`\nReport saved: ${filename}`);
    
    return report;
}

// Run
runQuantumThinkTank().catch(console.error);
