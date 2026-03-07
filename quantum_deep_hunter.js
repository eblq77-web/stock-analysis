/**
 * QUANTUM DEEP HUNTER - A-Share Bottom Finder
 * ===========================================
 * Find institutional accumulation at the BOTTOM - EARLY
 * Focus: 深圳 (ChiNext) + 上海 (Main Board)
 * Target: Stocks about to break out from base
 */

const http = require('http');
const fs = require('fs');

// Massive A-Share Universe - 100+ stocks
const A_SHARES = [
    // ChiNext (创业板) - Most hidden, highest growth
    { code: '300682', name: '朗新科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300454', name: '网宿科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300476', name: '中际旭创', sector: 'AI硬件', market: 'sz', board: 'CN' },
    { code: '300122', name: '智飞生物', sector: '医药', market: 'sz', board: 'CN' },
    { code: '300502', name: '新易盛', sector: '光模块', market: 'sz', board: 'CN' },
    { code: '300308', name: '中际旭创', sector: 'AI硬件', market: 'sz', board: 'CN' },
    { code: '300663', name: '朗新科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300567', name: '金晨光测', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300626', name: '华锋超净', sector: '新能源', market: 'sz', board: 'CN' },
    { code: '300767', name: '博济医药', sector: '医药', market: 'sz', board: 'CN' },
    { code: '300777', name: '新晨科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300792', name: '万通强赎', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300796', name: '金世华', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300803', name: '必创科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300807', name: '新朋聚', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300810', name: '亚光科技', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300812', name: '易明网安', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300815', name: '聚杰微纤', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300818', name: '深冷股份', sector: '设备', market: 'sz', board: 'CN' },
    { code: '300820', name: '华光股份', sector: '设备', market: 'sz', board: 'CN' },
    { code: '300822', name: '睿智微装', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300824', name: '朗科智能', sector: '科技', market: 'sz', board: 'CN' },
    { code: '300826', name: '华测检测', sector: '检测', market: 'sz', board: 'CN' },
    { code: '300828', name: '金现代', sector: '软件', market: 'sz', board: 'CN' },
    { code: '300830', name: '华宝股份', sector: '食品', market: 'sz', board: 'CN' },
    { code: '300832', name: '红塔证券', sector: '证券', market: 'sz', board: 'CN' },
    { code: '300834', name: '星辉娱乐', sector: '传媒', market: 'sz', board: 'CN' },
    { code: '300836', name: '宝丽迪', sector: '化工', market: 'sz', board: 'CN' },
    { code: '300838', name: '美畅股份', sector: '新材料', market: 'sz', board: 'CN' },
    { code: '300840', name: '卓越新能', sector: '新能源', market: 'sz', board: 'CN' },
    
    // Shenzhen Main Board (深圳主板)
    { code: '000001', name: '平安银行', sector: '银行', market: 'sz', board: 'SZ' },
    { code: '000002', name: '万科A', sector: '地产', market: 'sz', board: 'SZ' },
    { code: '000063', name: '中兴通讯', sector: '科技', market: 'sz', board: 'SZ' },
    { code: '000100', name: 'TCL科技', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '000333', name: '美的集团', sector: '家电', market: 'sz', board: 'SZ' },
    { code: '000425', name: '北方华创', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '000651', name: '格力电器', sector: '家电', market: 'sz', board: 'SZ' },
    { code: '000725', name: '京东方A', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '000768', name: '中航飞机', sector: '军工', market: 'sz', board: 'SZ' },
    { code: '000858', name: '五粮液', sector: '白酒', market: 'sz', board: 'SZ' },
    { code: '002001', name: '新和成', sector: '医药', market: 'sz', board: 'SZ' },
    { code: '002007', name: '华兰生物', sector: '医药', market: 'sz', board: 'SZ' },
    { code: '002027', name: '分众传媒', sector: '传媒', market: 'sz', board: 'SZ' },
    { code: '002049', name: '紫光国微', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002074', name: '国轩高科', sector: '电池', market: 'sz', board: 'SZ' },
    { code: '002156', name: '通富微电', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002185', name: '华天科技', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002230', name: '科陆电子', sector: '电力', market: 'sz', board: 'SZ' },
    { code: '002236', name: '大华股份', sector: '科技', market: 'sz', board: 'SZ' },
    { code: '002251', name: '光线传媒', sector: '传媒', market: 'sz', board: 'SZ' },
    { code: '002304', name: '南山控股', sector: '地产', market: 'sz', board: 'SZ' },
    { code: '002311', name: '海大集团', sector: '饲料', market: 'sz', board: 'SZ' },
    { code: '002371', name: '北方华创', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002410', name: '广联达', sector: '软件', market: 'sz', board: 'SZ' },
    { code: '002415', name: '海康威视', sector: '科技', market: 'sz', board: 'SZ' },
    { code: '002429', name: '兆驰股份', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '002456', name: '欧菲光', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '002460', name: '赣锋锂业', sector: '锂电', market: 'sz', board: 'SZ' },
    { code: '002466', name: '天齐锂业', sector: '锂电', market: 'sz', board: 'SZ' },
    { code: '002475', name: '立讯精密', sector: '科技', market: 'sz', board: 'SZ' },
    { code: '002493', name: '荣盛石化', sector: '化工', market: 'sz', board: 'SZ' },
    { code: '002594', name: '比亚迪', sector: '新能源车', market: 'sz', board: 'SZ' },
    { code: '002601', name: '龙蟒佰利', sector: '化工', market: 'sz', board: 'SZ' },
    { code: '002617', name: '中环股份', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002709', name: '天赐材料', sector: '新能源', market: 'sz', board: 'SZ' },
    { code: '002714', name: '牧原股份', sector: '养殖', market: 'sz', board: 'SZ' },
    { code: '002736', name: '国光电器', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '002812', name: '恩捷股份', sector: '新能源', market: 'sz', board: 'SZ' },
    { code: '002841', name: '视源股份', sector: '电子', market: 'sz', board: 'SZ' },
    { code: '002916', name: '深南电路', sector: '半导体', market: 'sz', board: 'SZ' },
    { code: '002920', name: '盈趣科技', sector: '电子', market: 'sz', board: 'SZ' },
    
    // Shanghai Main Board (上海主板)
    { code: '600000', name: '浦发银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '600009', name: '上海机场', sector: '机场', market: 'sh', board: 'SH' },
    { code: '600016', name: '民生银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '600019', name: '宝钢股份', sector: '钢铁', market: 'sh', board: 'SH' },
    { code: '600028', name: '中国石化', sector: '石化', market: 'sh', board: 'SH' },
    { code: '600030', name: '中信证券', sector: '证券', market: 'sh', board: 'SH' },
    { code: '600036', name: '招商银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '600048', name: '保利发展', sector: '地产', market: 'sh', board: 'SH' },
    { code: '600050', name: '中国联通', sector: '通信', market: 'sh', board: 'SH' },
    { code: '600104', name: '上汽集团', sector: '汽车', market: 'sh', board: 'SH' },
    { code: '600111', name: '北方稀土', sector: '稀土', market: 'sh', board: 'SH' },
    { code: '600176', name: '中国巨石', sector: '建材', market: 'sh', board: 'SH' },
    { code: '600183', name: '生益科技', sector: '电子', market: 'sh', board: 'SH' },
    { code: '600276', name: '恒瑞医药', sector: '医药', market: 'sh', board: 'SH' },
    { code: '600309', name: '万华化学', sector: '化工', market: 'sh', board: 'SH' },
    { code: '600406', name: '国电南瑞', sector: '电力', market: 'sh', board: 'SH' },
    { code: '600519', name: '贵州茅台', sector: '白酒', market: 'sh', board: 'SH' },
    { code: '600547', name: '山东黄金', sector: '黄金', market: 'sh', board: 'SH' },
    { code: '600570', name: '恒生电子', sector: '软件', market: 'sh', board: 'SH' },
    { code: '600585', name: '海螺水泥', sector: '水泥', market: 'sh', board: 'SH' },
    { code: '600588', name: '用友网络', sector: '软件', market: 'sh', board: 'SH' },
    { code: '600690', name: '青岛海尔', sector: '家电', market: 'sh', board: 'SH' },
    { code: '600703', name: '三安光电', sector: '半导体', market: 'sh', board: 'SH' },
    { code: '600745', name: '闻泰科技', sector: '半导体', market: 'sh', board: 'SH' },
    { code: '600760', name: '黑牡丹', sector: '地产', market: 'sh', board: 'SH' },
    { code: '600809', name: '山西汾酒', sector: '白酒', market: 'sh', board: 'SH' },
    { code: '600837', name: '海通证券', sector: '证券', market: 'sh', board: 'SH' },
    { code: '600887', name: '伊利股份', sector: '食品', market: 'sh', board: 'SH' },
    { code: '600893', name: '中航沈飞', sector: '军工', market: 'sh', board: 'SH' },
    { code: '600900', name: '长江电力', sector: '电力', market: 'sh', board: 'SH' },
    { code: '601012', name: '隆基绿能', sector: '光伏', market: 'sh', board: 'SH' },
    { code: '601066', name: '中信建投', sector: '证券', market: 'sh', board: 'SH' },
    { code: '601088', name: '中国神华', sector: '煤炭', market: 'sh', board: 'SH' },
    { code: '601166', name: '兴业银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '601236', name: '红塔证券', sector: '证券', market: 'sh', board: 'SH' },
    { code: '601288', name: '农业银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '601318', name: '中国平安', sector: '保险', market: 'sh', board: 'SH' },
    { code: '601328', name: '交通银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '601398', name: '工商银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '601601', name: '中国太保', sector: '保险', market: 'sh', board: 'SH' },
    { code: '601628', name: '中国人寿', sector: '保险', market: 'sh', board: 'SH' },
    { code: '601668', name: '中国建筑', sector: '建筑', market: 'sh', board: 'SH' },
    { code: '601688', name: '中国中车', sector: '设备', market: 'sh', board: 'SH' },
    { code: '601766', name: '中国中车', sector: '军工', market: 'sh', board: 'SH' },
    { code: '601818', name: '光大银行', sector: '银行', market: 'sh', board: 'SH' },
    { code: '601888', name: '中国中免', sector: '旅游', market: 'sh', board: 'SH' },
    { code: '601989', name: '中国重工', sector: '军工', market: 'sh', board: 'SH' }
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
                    if (p.length < 35) { resolve(null); return; }
                    
                    // Price & basic
                    const price = parseFloat(p[3]) || 0;
                    const changePct = parseFloat(p[5]) || 0;
                    const volume = parseInt(p[6]) || 0;
                    const amount = parseInt(p[7]) || 0;
                    const high = parseFloat(p[33]) || 0;
                    const low = parseFloat(p[34]) || 0;
                    
                    // Order book - careful parsing
                    const bids = [];
                    const asks = [];
                    for (let i = 0; i < 5; i++) {
                        const bp = parseFloat(p[10 + i*2]);
                        const bv = parseInt(p[11 + i*2]);
                        const ap = parseFloat(p[20 + i*2]);
                        const av = parseInt(p[21 + i*2]);
                        if (bp > 0 && bp < price * 1.5) bids.push({ price: bp, vol: bv });
                        if (ap > 0 && ap < price * 1.5) asks.push({ price: ap, vol: av });
                    }
                    
                    resolve({ code: p[2], name: p[1], price, changePct, volume, amount, high, low, bids, asks });
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

// ================== DEEP HUNTING ALGORITHMS ==================

/**
 * BOTTOM FUNDING DETECTION
 * Early stage: institutions building position at lows
 */
function detectBottomFunding(data) {
    if (!data || !data.price || !data.low) return { score: 0, stage: 'UNKNOWN' };
    
    const nearLow = (data.price - data.low) / data.low * 100;
    const nearHigh = (data.high - data.price) / data.high * 100;
    const range = (data.high - data.low) / data.low * 100;
    
    let score = 0;
    let stage = 'UNKNOWN';
    
    // Stage 1: Deep bottom (price at lows, volume building)
    if (nearLow < 2 && range > 3) {
        score += 40;
        stage = 'DEEP_BOTTOM';
    }
    // Stage 2: Base building (tight range, accumulation)
    else if (range < 3 && nearLow < 5) {
        score += 55;
        stage = 'BASE_BUILDING';
    }
    // Stage 3: Early breakout (breaking resistance)
    else if (nearHigh < 2 && nearLow > 3) {
        score += 45;
        stage = 'EARLY_BREAKOUT';
    }
    // Stage 4: Momentum (strong move, still accumulating)
    else if (data.changePct > 3 && data.changePct < 10 && range < 5) {
        score += 35;
        stage = 'MOMENTUM_BUILD';
    }
    
    return { score: Math.min(100, score), stage, nearLow: nearLow.toFixed(2), range: range.toFixed(2) };
}

/**
 * INSTITUTIONAL ACCUMULATION DETECTION
 * Hidden buying in order book
 */
function detectInstitutionalAccumulation(data) {
    if (!data || !data.bids || data.bids.length < 2) return { score: 0, signals: [] };
    
    const signals = [];
    let score = 0;
    
    // Calculate bid pressure
    const totalBid = data.bids.reduce((a, b) => a + (b.vol || 0), 0);
    const totalAsk = data.asks.reduce((a, b) => a + (b.vol || 0), 0);
    const imbalance = (totalBid - totalAsk) / (totalBid + totalAsk || 1);
    
    if (imbalance > 0.3) { score += 35; signals.push(`BUY Pressure:${(imbalance*100).toFixed(0)}%`); }
    else if (imbalance > 0.15) { score += 20; signals.push(`Moderate:${(imbalance*100).toFixed(0)}%`); }
    
    // Deep order detection (hidden orders)
    if (data.bids.length >= 3) {
        const deepBid = data.bids.slice(2).reduce((a, b) => a + (b.vol || 0), 0);
        const topBid = data.bids.slice(0, 2).reduce((a, b) => a + (b.vol || 0), 0);
        if (deepBid > topBid * 0.8) { score += 30; signals.push('Deep Accum'); }
    }
    
    // Large single order detection
    const maxBid = Math.max(...data.bids.map(b => b.vol || 0));
    const avgBid = totalBid / (data.bids.length || 1);
    if (maxBid > avgBid * 2) { score += 25; signals.push('Large Order'); }
    
    return { score: Math.min(100, score), signals };
}

/**
 * VOLUME ACCUMULATION PATTERN
 * Volume increasing while price stable = smart money
 */
function detectVolumeAccumulation(data) {
    if (!data || !data.volume) return { score: 0, pattern: 'UNKNOWN' };
    
    // For now, use current volume as proxy
    // In real system, would compare to historical average
    const volLevel = data.volume / 10000; // Convert to 万手
    
    let score = 0;
    let pattern = 'NORMAL';
    
    // High volume at support = accumulation
    if (volLevel > 50) { score += 30; pattern = 'HIGH_VOL_SUPPORT'; }
    else if (volLevel > 20) { score += 20; pattern = 'MODERATE_VOL'; }
    
    return { score, pattern, vol: volLevel.toFixed(0) };
}

/**
 * SUPPORT ZONE DETECTION
 * Strong support levels where institutions place orders
 */
function detectSupportZone(data) {
    if (!data || !data.bids || data.bids.length === 0) return { score: 0, zone: 'UNKNOWN' };
    
    const bid1 = data.bids[0].price;
    const nearSupport = (data.price - bid1) / data.price * 100;
    
    let score = 0;
    let zone = 'MID_RANGE';
    
    // Strong support (bid very close to price)
    if (nearSupport < 0.5) { score += 40; zone = 'STRONG_SUPPORT'; }
    else if (nearSupport < 1) { score += 30; zone = 'GOOD_SUPPORT'; }
    else if (nearSupport < 2) { score += 20; zone = 'WEAK_SUPPORT'; }
    else { score += 10; zone = 'NO_SUPPORT'; }
    
    return { score, zone, distance: nearSupport.toFixed(3) };
}

/**
 * DEEP COMPOSITE SCORE
 * Final scoring for bottom hunting
 */
function calcDeepScore(bottom, accum, vol, support) {
    let score = 0;
    const factors = [];
    
    // Bottom funding (40%)
    const bottomScore = bottom.score * 0.4;
    score += bottomScore;
    factors.push({ name: 'Bottom', value: bottom.score, w: 40, contrib: bottomScore.toFixed(1) });
    
    // Institutional accumulation (30%)
    const accumScore = accum.score * 0.3;
    score += accumScore;
    factors.push({ name: 'Accum', value: accum.score, w: 30, contrib: accumScore.toFixed(1) });
    
    // Volume (15%)
    const volScore = vol.score * 0.15;
    score += volScore;
    factors.push({ name: 'Volume', value: vol.score, w: 15, contrib: volScore.toFixed(1) });
    
    // Support (15%)
    const supportScore = support.score * 0.15;
    score += supportScore;
    factors.push({ name: 'Support', value: support.score, w: 15, contrib: supportScore.toFixed(1) });
    
    score = Math.round(score);
    
    // Action
    let action = 'WATCH';
    let emoji = '👀';
    if (score > 60) { action = 'STRONG BUY - Early Bottom'; emoji = '🔥'; }
    else if (score > 45) { action = 'BUY - Bottom Building'; emoji = '🟢'; }
    else if (score > 30) { action = 'WATCH - Potential'; emoji = '🟡'; }
    else if (score < 15) { action = 'AVOID - No Setup'; emoji = '🔴'; }
    
    return { score, action, emoji, factors };
}

// ================== MAIN ==================

async function analyzeStock(stock) {
    const data = await fetchStockData(stock.code, stock.market);
    if (!data || !data.price || data.price === 0) return null;
    
    const bottom = detectBottomFunding(data);
    const accum = detectInstitutionalAccumulation(data);
    const vol = detectVolumeAccumulation(data);
    const support = detectSupportZone(data);
    const deep = calcDeepScore(bottom, accum, vol, support);
    
    return { stock, data, bottom, accum, vol, support, deep };
}

async function runDeepHunter() {
    console.log('\n' + '🔍'.repeat(20));
    console.log('   QUANTUM DEEP HUNTER - A-Share Bottom Finder');
    console.log('   Shenzhen + Shanghai | Early Detection');
    console.log('🔍'.repeat(20));
    
    console.log(`\n🔬 Scanning ${A_SHARES.length} A-Shares...`);
    
    const results = [];
    for (const s of A_SHARES) {
        const r = await analyzeStock(s);
        if (r) results.push(r);
        process.stdout.write('.');
        await new Promise(x => setTimeout(x, 80));
    }
    
    console.log('\n\n' + '='.repeat(70));
    console.log('🔍 QUANTUM DEEP HUNTER - A-SHARE BOTTOM DETECTION');
    console.log('='.repeat(70));
    
    // Sort by deep score
    results.sort((a, b) => b.deep.score - a.deep.score);
    
    // Best setups
    const buys = results.filter(r => r.deep.score > 35);
    
    console.log('\n🎯 STRONGEST BOTTOM SETUPS (Score > 35):');
    buys.slice(0, 15).forEach((r, i) => {
        console.log(`\n${i+1}. ${r.data.name} (${r.stock.code}) - ${r.stock.board} ${r.stock.sector}`);
        console.log(`   💰 Price: ¥${r.data.price} | Change: ${r.data.changePct > 0 ? '+' : ''}${r.data.changePct}%`);
        console.log(`   📊 DEEP SCORE: ${r.deep.score} ${r.deep.emoji} ${r.deep.action}`);
        console.log(`   📈 Stage: ${r.bottom.stage} | Range: ${r.bottom.range}% | Near Low: ${r.bottom.nearLow}%`);
        console.log(`   🎯 Support: ${r.support.zone} | Vol: ${r.vol.vol}万手`);
        if (r.accum.signals.length) console.log(`   � институт: ${r.accum.signals.join(', ')}`);
    });
    
    // By Board
    const cn = results.filter(r => r.stock.board === 'CN' && r.deep.score > 25);
    const sz = results.filter(r => r.stock.board === 'SZ' && r.deep.score > 25);
    const sh = results.filter(r => r.stock.board === 'SH' && r.deep.score > 25);
    
    console.log('\n\n📊 BY BOARD:');
    console.log(`   创业板 (ChiNext): ${cn.length} stocks with setup`);
    console.log(`   深圳主板: ${sz.length} stocks with setup`);
    console.log(`   上海主板: ${sh.length} stocks with setup`);
    
    // Save report
    const report = {
        time: new Date().toISOString(),
        total: results.length,
        setups: buys.slice(0, 20),
        byBoard: { CN: cn.length, SZ: sz.length, SH: sh.length },
        all: results.map(r => ({
            code: r.stock.code, name: r.data.name, board: r.stock.board,
            price: r.data.price, change: r.data.changePct,
            score: r.deep.score, action: r.deep.action, stage: r.bottom.stage
        }))
    };
    
    fs.writeFileSync(`${process.env.HOME}/Desktop/Stock_Analysis/quantum_deep_hunter_report.json`, 
        JSON.stringify(report, null, 2));
    console.log('\n\n💾 Saved: quantum_deep_hunter_report.json');
    
    return report;
}

runDeepHunter().catch(console.error);
