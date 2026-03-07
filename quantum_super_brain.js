/**
 * CHARLES'S QUANTUM SUPER BRAIN - LIVE INTEGRATED
 * ================================================
 * Full integration: Live API + All Modules + Forensic Analysis
 * The most profound trading system
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// ============================================
// LIVE API CONNECTIONS
// ============================================

class LiveDataSource {
    constructor() {
        this.endpoints = {
            tencent: 'http://qt.gtimg.cn/q=',
            eastmoney: 'https://emweb.securities.eastmoney.com/'
        };
    }
    
    // Fetch from Tencent (primary - fastest)
    fetchTencent(code) {
        return new Promise((resolve) => {
            const url = `${this.endpoints.tencent}sh${code},sz${code}`;
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parts = data.split('~');
                        if (parts.length > 40) {
                            resolve({
                                source: 'Tencent',
                                code: code,
                                name: parts[1] || '',
                                price: parseFloat(parts[3]) || 0,
                                change: parseFloat(parts[4]) || 0,
                                changePercent: parseFloat(parts[5]) || 0,
                                open: parseFloat(parts[5]) || 0,
                                high: parseFloat(parts[33]) || 0,
                                low: parseFloat(parts[34]) || 0,
                                volume: parseInt(parts[38]) || 0,
                                amount: parseInt(parts[37]) || 0,
                                bid: parseFloat(parts[9]) || 0,
                                ask: parseFloat(parts[19]) || 0,
                                turnover: parseFloat(parts[38]) ? (parseInt(parts[37]) / parseInt(parts[38]) * 100).toFixed(2) : 0
                            });
                        } else resolve(null);
                    } catch (e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(5000, () => { req.destroy(); resolve(null); });
        });
    }
    
    // Fetch batch
    async fetchBatch(codes) {
        console.log(`\n📡 LIVE API: Fetching ${codes.length} stocks...`);
        const results = [];
        
        for (const code of codes) {
            const data = await this.fetchTencent(code);
            if (data) results.push(data);
            await new Promise(r => setTimeout(r, 50)); // Rate limit
        }
        
        console.log(`✅ Live data: ${results.length}/${codes.length} stocks`);
        return results;
    }
}

// ============================================
// FORENSIC ANALYZER
// ============================================

class ForensicAnalyzer {
    constructor(data) {
        this.data = data;
    }
    
    // Deep forensic analysis
    analyze() {
        console.log('\n🔍 FORENSIC ANALYSIS...');
        
        const results = {
            timestamp: new Date().toISOString(),
            marketForensics: this.analyzeMarket(),
            volumeForensics: this.analyzeVolume(),
            priceForensics: this.analyzePrice(),
            opportunities: [],
            institutionalSignals: [],
            riskSignals: []
        };
        
        // Analyze each stock
        for (const stock of this.data) {
            const analysis = this.analyzeStock(stock);
            
            if (analysis.score >= 60) {
                results.opportunities.push(analysis);
            }
            
            if (analysis.institutional) {
                results.institutionalSignals.push(analysis);
            }
            
            if (analysis.risk) {
                results.riskSignals.push(analysis);
            }
        }
        
        // Sort
        results.opportunities.sort((a, b) => b.score - a.score);
        results.institutionalSignals.sort((a, b) => b.institutionalScore - a.institutionalScore);
        
        return results;
    }
    
    analyzeMarket() {
        if (!this.data.length) return { state: 'unknown' };
        
        const changes = this.data.map(s => s.changePercent || 0);
        const volumes = this.data.map(s => s.volume || 0);
        
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const positive = changes.filter(c => c > 0).length;
        const negative = changes.filter(c => c < 0).length;
        
        let state = 'SIDEWAYS';
        let confidence = 0.5;
        
        if (avgChange > 1.5 && positive > negative * 1.5) {
            state = 'BULL';
            confidence = Math.min(0.95, 0.6 + (positive / this.data.length) * 0.35);
        } else if (avgChange < -1.5 && negative > positive * 1.5) {
            state = 'BEAR';
            confidence = Math.min(0.95, 0.6 + (negative / this.data.length) * 0.35);
        } else if (Math.abs(avgChange) > 2.5) {
            state = 'VOLATILE';
            confidence = 0.8;
        }
        
        return {
            state,
            confidence: (confidence * 100).toFixed(0) + '%',
            avgChange: avgChange.toFixed(2) + '%',
            avgVolume: (avgVolume / 100000000).toFixed(1) + '亿',
            positiveRatio: (positive / this.data.length * 100).toFixed(0) + '%'
        };
    }
    
    analyzeVolume() {
        const volumes = this.data.map(s => s.volume || 0).sort((a, b) => b - a);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        
        // Find anomalies
        const anomalies = this.data.filter(s => s.volume > avgVolume * 2).map(s => ({
            code: s.code,
            name: s.name,
            volume: s.volume,
            ratio: (s.volume / avgVolume).toFixed(1) + 'x'
        }));
        
        return { anomalies, avgVolume };
    }
    
    analyzePrice() {
        // Price momentum analysis
        const momentum = this.data.map(s => ({
            code: s.code,
            name: s.name,
            change: s.changePercent,
            momentum: s.changePercent > 3 ? 'STRONG_UP' : 
                      s.changePercent > 1 ? 'UP' :
                      s.changePercent < -3 ? 'STRONG_DOWN' :
                      s.changePercent < -1 ? 'DOWN' : 'NEUTRAL'
        }));
        
        return { momentum };
    }
    
    analyzeStock(stock) {
        const score = {
            momentum: 0,
            volume: 0,
            volatility: 0,
            value: 0,
            total: 0
        };
        
        // Momentum scoring
        const change = stock.changePercent || 0;
        if (change > 5) score.momentum = 30;
        else if (change > 3) score.momentum = 20;
        else if (change > 1) score.momentum = 10;
        else if (change < -5) score.momentum = 25; // oversold opportunity
        else if (change < -3) score.momentum = 15;
        
        // Volume scoring
        const volume = stock.volume || 0;
        if (volume > 30000000) score.volume = 25;
        else if (volume > 20000000) score.volume = 20;
        else if (volume > 10000000) score.volume = 15;
        else if (volume > 5000000) score.volume = 10;
        
        // Volatility scoring
        if (stock.high && stock.low && stock.open) {
            const range = ((stock.high - stock.low) / stock.open * 100);
            if (range > 10) score.volatility = 20;
            else if (range > 5) score.volatility = 15;
            else if (range > 3) score.volatility = 10;
        }
        
        // Value scoring (turnover)
        const turnover = parseFloat(stock.turnover) || 0;
        if (turnover > 10) score.value = 15;
        else if (turnover > 5) score.value = 10;
        else if (turnover > 2) score.value = 5;
        
        score.total = score.momentum + score.volume + score.volatility + score.value;
        
        // Institutional detection
        let institutional = null;
        if (volume > 20000000 && change > 2) {
            institutional = {
                type: 'ACCUMULATION',
                direction: 'BUY',
                score: Math.min(100, (volume / 40000000 * 100 + change * 5))
            };
        } else if (volume > 15000000 && change < -3) {
            institutional = {
                type: 'DISTRIBUTION',
                direction: 'SELL',
                score: Math.min(100, (volume / 30000000 * 100 + Math.abs(change) * 5))
            };
        }
        
        // Risk detection
        let risk = null;
        if (change < -7) {
            risk = { level: 'HIGH', reason: 'Extreme oversold' };
        } else if (change > 10) {
            risk = { level: 'MEDIUM', reason: 'Overbought' };
        }
        
        // Generate signal
        let signal = 'WATCH';
        if (score.total >= 80) signal = 'STRONG_BUY';
        else if (score.total >= 60) signal = 'BUY';
        else if (score.total < 30) signal = 'AVOID';
        
        return {
            ...stock,
            forensicScore: score.total,
            momentumScore: score.momentum,
            volumeScore: score.volume,
            volatilityScore: score.volatility,
            signal,
            institutional,
            institutionalScore: institutional?.score || 0,
            risk,
            action: this.determineAction(signal, change, stock.volume || 0)
        };
    }
    
    determineAction(signal, change, volume) {
        if (signal === 'STRONG_BUY' && change > 0) return 'BUY_MOMENTUM';
        if (signal === 'STRONG_BUY' && change < -3) return 'BUY_DIP';
        if (signal === 'BUY' && change > 2) return 'BUY_BREAKOUT';
        if (signal === 'BUY' && change < -4) return 'BUY_OEVERSOLD';
        if (signal === 'AVOID') return 'SHORT_OR_SKIP';
        return 'WATCH';
    }
}

// ============================================
// INSTITUTIONAL DETECTOR
// ============================================

class InstitutionalDetector {
    constructor(data) {
        this.data = data;
    }
    
    detect() {
        console.log('\n🏦 INSTITUTIONAL DETECTION...');
        
        const signals = [];
        
        for (const stock of this.data) {
            // Multiple detection methods
            const methods = {
                volumeSurge: this.detectVolumeSurge(stock),
                priceVolume: this.detectPriceVolume(stock),
                accumulation: this.detectAccumulation(stock),
                unusual: this.detectUnusual(stock)
            };
            
            // Calculate composite score
            let totalScore = 0;
            let detectionCount = 0;
            
            Object.values(methods).forEach(m => {
                if (m.detected) {
                    totalScore += m.score;
                    detectionCount++;
                }
            });
            
            if (detectionCount > 0) {
                signals.push({
                    code: stock.code,
                    name: stock.name,
                    price: stock.price,
                    change: stock.changePercent,
                    volume: stock.volume,
                    compositeScore: totalScore,
                    detections: detectionCount,
                    methods: Object.keys(methods).filter(k => methods[k].detected),
                    direction: this.determineDirection(stock, methods)
                });
            }
        }
        
        // Sort by score
        signals.sort((a, b) => b.compositeScore - a.compositeScore);
        
        return signals;
    }
    
    detectVolumeSurge(stock) {
        // Detect unusual volume
        const threshold = 20000000;
        return {
            detected: stock.volume > threshold,
            score: stock.volume > 30000000 ? 40 : 25,
            description: 'Volume surge detected'
        };
    }
    
    detectPriceVolume(stock) {
        // Accumulation: price up + high volume
        if (stock.changePercent > 2 && stock.volume > 15000000) {
            return { detected: true, score: 35, description: 'Accumulation pattern' };
        }
        // Distribution: price down + high volume
        if (stock.changePercent < -2 && stock.volume > 15000000) {
            return { detected: true, score: 35, description: 'Distribution pattern' };
        }
        return { detected: false, score: 0 };
    }
    
    detectAccumulation(stock) {
        // Money flow indicator
        if (stock.bid && stock.ask && stock.price) {
            const spread = (stock.ask - stock.bid) / stock.price * 100;
            if (spread < 0.5 && stock.volume > 10000000) {
                return { detected: true, score: 30, description: 'Accumulation (tight spread)' };
            }
        }
        return { detected: false, score: 0 };
    }
    
    detectUnusual(stock) {
        // Unusual activity
        if (Math.abs(stock.changePercent) > 5 && stock.volume > 10000000) {
            return { detected: true, score: 25, description: 'Unusual activity' };
        }
        return { detected: false, score: 0 };
    }
    
    determineDirection(stock, methods) {
        if (stock.changePercent > 0) return 'BUYING';
        if (stock.changePercent < 0) return 'SELLING';
        return 'NEUTRAL';
    }
}

// ============================================
// MAIN QUANTUM SUPER BRAIN
// ============================================

async function runQuantumSuperBrain() {
    console.log('🧠 QUANTUM SUPER BRAIN - LIVE');
    console.log('=============================');
    console.log('🔬 Forensic Analysis | Institutional Detection | Live API\n');
    
    const liveAPI = new LiveDataSource();
    
    // Stock universe - 50 key stocks
    const universe = [
        // Tech/AI
        '300476', '300033', '300308', '300018', '300502', '300498', '300059',
        '0700', '9988', '3690', '1024', '9618',
        // New Energy  
        '300750', '002594', '601012', '300014', '872926', '870299',
        // Healthcare
        '300122', '600276', '300015', '300142', '000538',
        // Consumer
        '600519', '000858', '000333', '000651', '000568',
        // Finance
        '601318', '600036', '000001', '600030',
        // BSE Hidden
        '835670', '871047', '871049'
    ];
    
    // Fetch live data
    const liveData = await liveAPI.fetchBatch(universe);
    
    if (!liveData.length) {
        console.log('❌ No live data - using backup');
    }
    
    // Run forensic analysis
    const forensic = new ForensicAnalyzer(liveData);
    const forensicResults = forensic.analyze();
    
    // Run institutional detection
    const institutional = new InstitutionalDetector(liveData);
    const instResults = institutional.detect();
    
    // Output results
    console.log('\n📊 MARKET FORENSICS:');
    console.log('--------------------');
    console.log(`   Regime: ${forensicResults.marketForensics.state}`);
    console.log(`   Confidence: ${forensicResults.marketForensics.confidence}`);
    console.log(`   Avg Change: ${forensicResults.marketForensics.avgChange}`);
    console.log(`   Positive: ${forensicResults.marketForensics.positiveRatio}`);
    
    console.log('\n🎯 TOP OPPORTUNITIES (Forensic):');
    console.log('--------------------------------');
    
    for (const opp of forensicResults.opportunities.slice(0, 8)) {
        console.log(`\n💎 ${opp.code} ${opp.name}`);
        console.log(`   Price: ¥${opp.price} | Change: ${opp.changePercent.toFixed(2)}%`);
        console.log(`   Volume: ${(opp.volume/10000).toFixed(0)}万`);
        console.log(`   Score: ${opp.forensicScore} | Signal: ${opp.signal}`);
        console.log(`   Action: ${opp.action}`);
    }
    
    console.log('\n\n🏦 INSTITUTIONAL SIGNALS:');
    console.log('-------------------------');
    
    if (instResults.length === 0) {
        console.log('   None detected');
    } else {
        for (const sig of instResults.slice(0, 5)) {
            const emoji = sig.direction === 'BUYING' ? '🟢' : '🔴';
            console.log(`   ${emoji} ${sig.code} ${sig.name}: ${sig.detections} signals (${sig.direction})`);
        }
    }
    
    // Generate final recommendations
    const recommendations = forensicResults.opportunities
        .filter(o => o.signal.includes('BUY'))
        .slice(0, 10)
        .map(o => ({
            code: o.code,
            name: o.name,
            price: o.price,
            change: o.changePercent,
            entry: o.price,
            target15: (o.price * 1.15).toFixed(2),
            stop7: (o.price * 0.93).toFixed(2),
            score: o.forensicScore,
            signal: o.signal,
            action: o.action
        }));
    
    // Save report
    const today = new Date().toISOString().split('T')[0];
    
    const report = `# 🧠 QUANTUM SUPER BRAIN - LIVE ANALYSIS
## ${new Date().toLocaleString('zh-CN')}

### 🔬 Market Forensics
- **Regime:** ${forensicResults.marketForensics.state}
- **Confidence:** ${forensicResults.marketForensics.confidence}
- **Avg Change:** ${forensicResults.marketForensics.avgChange}
- **Positive Ratio:** ${forensicResults.marketForensics.positiveRatio}

### 🎯 Live Recommendations

| Code | Name | Price | Change% | Entry | Target15% | Stop7% | Score | Signal |
|------|------|-------|---------|-------|-----------|--------|-------|--------|
${recommendations.map(r => `| ${r.code} | ${r.name} | ¥${r.price} | ${r.change.toFixed(2)}% | ¥${r.entry} | ¥${r.target15} | ¥${r.stop7} | ${r.score} | ${r.signal} |`).join('\n')}

### 🏦 Institutional Activity
${instResults.slice(0, 5).map(s => `- ${s.code} ${s.name}: ${s.detections} signals (${s.direction}) - Score: ${s.compositeScore}`).join('\n') || 'None detected'}

### 📊 Volume Anomalies
${forensicResults.volumeForensics.anomalies.slice(0, 5).map(a => `- ${a.code} ${a.name}: ${a.ratio} avg volume`).join('\n') || 'None detected'}

---
*Quantum Super Brain - Live API Integrated*
`;
    
    const reportPath = `/Users/liu/Desktop/Stock_Analysis/daily_overview/QUANTUM_SUPER_BRAIN_${today}.md`;
    fs.writeFileSync(reportPath, report, 'utf8');
    
    // Save JSON for tracking
    const jsonPath = `/Users/liu/Desktop/Stock_Analysis/daily_overview/QUANTUM_SUPER_BRAIN_${today}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        marketForensics: forensicResults.marketForensics,
        recommendations,
        institutional: instResults.slice(0, 10),
        volumeAnomalies: forensicResults.volumeForensics.anomalies
    }, null, 2), 'utf8');
    
    console.log(`\n✅ Report: QUANTUM_SUPER_BRAIN_${today}.md`);
    console.log('🎯 Quantum Super Brain complete!');
    
    return { forensicResults, instResults, recommendations };
}

runQuantumSuperBrain().catch(console.error);
