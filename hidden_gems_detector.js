// ============================================
// 🎯 HIDDEN GEMS DETECTOR - Multi-Level Algorithm
// ============================================

const HIDDEN_GEMS_CONFIG = {
    // Level 1: Surface Analysis
    level1: {
        priceMin: 5,
        priceMax: 30,
        volumeMin: 100000,
        changeMin: 0,
        changeMax: 15
    },
    // Level 2: Institutional Detection
    level2: {
        volumeSurge: 2.0,
        institutionalBuyMin: 0.55,
        accumulationDaysMin: 3
    },
    // Level 3: Deep Forensic
    level3: {
        bidAskRatio: 1.2,
        orderFlowMin: 500000,
        timeWeightedMin: 0.6
    },
    // Level 4: Multi-Timeframe
    level4: {
        dailyTrend: 'up',
        weeklyTrend: 'up',
        sectorStrength: 0.5
    },
    // Level 5: Predictive
    level5: {
        confidenceMin: 0.7,
        patternMatchMin: 0.8
    }
};

// Stock list for scanning
const HIDDEN_GEMS_STOCKS = [
    // 北京交所 (BSE) - High growth potential
    '870864', '870299', '872926', '835670', '872567', '870518',
    '872358', '872885', '835799', '872357',
    // 创业板 (ChiNext)
    '300750', '300498', '300455', '300408', '300327',
    '300146', '300145', '300124', '300115', '300104',
    '300033', '300012', '300009', '300003',
    // 深圳主板
    '002475', '002371', '002352', '002340', '002294',
    '002241', '002236', '22226', '002156', '002124',
    // 上海主板
    '600522', '600506', '600489', '600468', '600438',
    '600406', '600399', '600345', '600309', '600276'
];

function calculateHiddenGemScore(stock, data) {
    let score = 0;
    let level = 0;
    let details = [];

    // Level 1: Surface Analysis
    const l1 = HIDDEN_GEMS_CONFIG.level1;
    if (data.price >= l1.priceMin && data.price <= l1.priceMax) {
        score += 20;
        level = 1;
        details.push('✓ Level 1: Price in range');
    }
    if (data.volume >= l1.volumeMin) {
        score += 15;
        details.push('✓ Level 1: Volume OK');
    }
    if (data.change >= l1.changeMin && data.change <= l1.changeMax) {
        score += 10;
        details.push('✓ Level 1: Change OK');
    }

    // Level 2: Institutional Detection
    const l2 = HIDDEN_GEMS_CONFIG.level2;
    if (data.volumeSurge >= l2.volumeSurge) {
        score += 20;
        level = Math.max(level, 2);
        details.push('✓ Level 2: Volume surge detected');
    }
    if (data.institutionalBuy >= l2.institutionalBuyMin) {
        score += 15;
        details.push('✓ Level 2: Institutional buying');
    }
    if (data.accumulationDays >= l2.accumulationDaysMin) {
        score += 10;
        details.push('✓ Level 2: Accumulation pattern');
    }

    // Level 3: Deep Forensic
    const l3 = HIDDEN_GEMS_CONFIG.level3;
    if (data.bidAskRatio >= l3.bidAskRatio) {
        score += 15;
        level = Math.max(level, 3);
        details.push('✓ Level 3: Strong bid/ask');
    }
    if (data.orderFlow >= l3.orderFlowMin) {
        score += 10;
        details.push('✓ Level 3: Large order flow');
    }

    // Level 4: Multi-Timeframe
    const l4 = HIDDEN_GEMS_CONFIG.level4;
    if (data.dailyTrend === l4.dailyTrend) {
        score += 10;
        level = Math.max(level, 4);
        details.push('✓ Level 4: Daily uptrend');
    }
    if (data.weeklyTrend === l4.weeklyTrend) {
        score += 10;
        details.push('✓ Level 4: Weekly uptrend');
    }

    // Level 5: Predictive (AI)
    const l5 = HIDDEN_GEMS_CONFIG.level5;
    if (data.confidence >= l5.confidenceMin) {
        score += 15;
        level = Math.max(level, 5);
        details.push('✓ Level 5: High confidence');
    }
    if (data.patternMatch >= l5.patternMatchMin) {
        score += 10;
        details.push('✓ Level 5: Pattern match');
    }

    return { score, level, details, stock };
}

function getRecommendation(score) {
    if (score >= 80) return { label: '🚀 SUPER GEM', color: '#00ff00' };
    if (score >= 60) return { label: '💎 HIDDEN GEM', color: '#00ccff' };
    if (score >= 40) return { label: '👀 WATCH', color: '#ffff00' };
    if (score >= 20) return { label: '⏳ CANDIDATE', color: '#ff9900' };
    return { label: '❌ AVOID', color: '#ff0000' };
}

async function runHiddenGemsScan() {
    const output = document.getElementById('hidden-gems-output');
    if (!output) {
        console.error('Hidden gems output element not found');
        return;
    }

    output.innerHTML = '<div class="loading">🔍 Scanning for hidden gems...</div>';

    const results = [];
    
    // Simulate scanning with real-time updates
    for (let i = 0; i < HIDDEN_GEMS_STOCKS.length; i++) {
        const stock = HIDDEN_GEMS_STOCKS[i];
        const progress = Math.round((i / HIDDEN_GEMS_STOCKS.length) * 100);
        
        output.innerHTML = `<div class="loading">🔍 Scanning ${stock}... ${progress}%</div>`;

        try {
            // Fetch real-time data
            const data = await fetchStockData(stock);
            
            if (data) {
                const analysis = calculateHiddenGemScore(stock, data);
                const rec = getRecommendation(analysis.score);
                
                results.push({
                    ...analysis,
                    ...rec,
                    price: data.price,
                    change: data.change,
                    volume: data.volume
                });
            }
        } catch (e) {
            console.log(`Error scanning ${stock}:`, e.message);
        }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Display results
    let html = `
        <div class="results-header">
            <h3>🎯 Hidden Gems Scan Complete</h3>
            <p>Scanned ${HIDDEN_GEMS_STOCKS.length} stocks | Found ${results.filter(r => r.score >= 40).length} candidates</p>
        </div>
        <div class="results-table">
            <table>
                <thead>
                    <tr>
                        <th>Stock</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Score</th>
                        <th>Level</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
    `;

    results.slice(0, 20).forEach(r => {
        html += `
            <tr>
                <td><strong>${r.stock}</strong></td>
                <td>¥${r.price || 'N/A'}</td>
                <td style="color: ${r.change >= 0 ? '#00ff00' : '#ff0000'}">${r.change || 0}%</td>
                <td><strong>${r.score}</strong></td>
                <td>L${r.level}</td>
                <td style="color: ${r.color}">${r.label}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    output.innerHTML = html;
}

async function fetchStockData(stock) {
    // Simulated data - in production, use real API
    return {
        price: Math.random() * 25 + 5,
        change: (Math.random() - 0.3) * 10,
        volume: Math.floor(Math.random() * 5000000) + 50000,
        volumeSurge: Math.random() * 3,
        institutionalBuy: Math.random() * 0.4 + 0.4,
        accumulationDays: Math.floor(Math.random() * 7),
        bidAskRatio: Math.random() * 2 + 0.5,
        orderFlow: Math.floor(Math.random() * 10000000),
        dailyTrend: Math.random() > 0.5 ? 'up' : 'down',
        weeklyTrend: Math.random() > 0.5 ? 'up' : 'down',
        confidence: Math.random() * 0.4 + 0.5,
        patternMatch: Math.random() * 0.3 + 0.6
    };
}

// Export for use
if (typeof window !== 'undefined') {
    window.runHiddenGemsScan = runHiddenGemsScan;
    window.HIDDEN_GEMS_CONFIG = HIDDEN_GEMS_CONFIG;
}
