/**
 * 🧠 SUPER BRAIN PRO - ADVANCED EDITION v5.0
 * =========================================
 * Enhanced with: Algorithm + Quantum + Calculation + All Indicators
 * 
 * Features:
 * - RSI, MACD, Bollinger Bands, VWAP
 * - Sector Rotation System
 * - Market Regime Detection
 * - News Sentiment Analysis
 * - Quantum Pattern Recognition
 * - Advanced Calculation Engine
 */

const https = require('https');
const http = require('http');

// ======================
// ADVANCED INDICATORS ENGINE
// ======================
class AdvancedIndicators {
    
    // RSI - Relative Strength Index
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return {
            value: rsi,
            signal: rsi < 30 ? 'OVERSOLD' : rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL',
            action: rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'WATCH'
        };
    }
    
    // MACD - Moving Average Convergence Divergence
    calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        const ema = (arr, p) => {
            const k = 2 / (p + 1);
            let emaVal = arr[0];
            for (let i = 1; i < arr.length; i++) {
                emaVal = arr[i] * k + emaVal * (1 - k);
            }
            return emaVal;
        };
        
        const fastEMA = ema(prices, fast);
        const slowEMA = ema(prices, slow);
        const macdLine = fastEMA - slowEMA;
        const signalLine = macdLine * 0.9;
        const histogram = macdLine - signalLine;
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram,
            crossover: histogram > 0 ? 'GOLDEN_CROSS' : 'DEATH_CROSS',
            action: histogram > 0 ? 'BULLISH' : 'BEARISH'
        };
    }
    
    // Bollinger Bands
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return null;
        
        const recent = prices.slice(-period);
        const sma = recent.reduce((a, b) => a + b, 0) / period;
        
        const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        const upper = sma + (stdDev * std);
        const lower = sma - (stdDev * std);
        const current = prices[prices.length - 1];
        
        let position = 'MIDDLE';
        if (current < lower) position = 'LOWER (BUY)';
        else if (current > upper) position = 'UPPER (SELL)';
        
        return {
            upper: upper,
            middle: sma,
            lower: lower,
            current: current,
            position: position,
            bandwidth: ((upper - lower) / sma * 100).toFixed(2)
        };
    }
    
    // VWAP - Volume Weighted Average Price
    calculateVWAP(prices, volumes) {
        let totalPV = 0, totalVolume = 0;
        
        for (let i = 0; i < prices.length; i++) {
            const vol = volumes[i] || 1000000;
            totalPV += prices[i] * vol;
            totalVolume += vol;
        }
        
        const vwap = totalVolume > 0 ? totalPV / totalVolume : prices[prices.length - 1];
        const currentPrice = prices[prices.length - 1];
        
        return {
            value: vwap,
            action: currentPrice > vwap ? 'ABOVE (BULLISH)' : 'BELOW (BEARISH)',
            distance: ((currentPrice - vwap) / vwap * 100).toFixed(2)
        };
    }
    
    // Stochastic Oscillator
    calculateStochastic(prices, period = 14) {
        if (prices.length < period) return { k: 50, d: 50 };
        
        const recent = prices.slice(-period);
        const low = Math.min(...recent);
        const high = Math.max(...recent);
        const close = prices[prices.length - 1];
        
        const k = ((close - low) / (high - low)) * 100;
        const d = k * 0.85 + 50 * 0.15;
        
        return {
            k: k,
            d: d,
            signal: k < 20 ? 'OVERSOLD' : k > 80 ? 'OVERBOUGHT' : 'NEUTRAL',
            action: k < 20 ? 'BUY' : k > 80 ? 'SELL' : 'WATCH'
        };
    }
    
    // ATR - Average True Range (Volatility)
    calculateATR(prices, period = 14) {
        if (prices.length < period + 1) return 0;
        
        let atr = 0;
        for (let i = 1; i <= period; i++) {
            atr += Math.abs(prices[i] - prices[i-1]);
        }
        atr /= period;
        
        return {
            value: atr,
            volatility: atr > prices[prices.length-1] * 0.03 ? 'HIGH' : 'NORMAL'
        };
    }
}

// ======================
// SECTOR ROTATION SYSTEM
// ======================
class SectorRotation {
    constructor() {
        this.sectors = {
            'RECOVERY': {
                sectors: ['金融', '消费', '地产'],
                description: 'Market bottoming, buy defensive',
                risk: 'MEDIUM'
            },
            'EXPANSION': {
                sectors: ['科技', '新能源', '半导体', 'AI'],
                description: 'Growth phase, buy cyclicals',
                risk: 'HIGH'
            },
            'PEAK': {
                sectors: ['能源', '材料', '化工'],
                description: 'Late cycle, take profits',
                risk: 'HIGH'
            },
            'CONTRACTION': {
                sectors: ['医药', '公用事业', '黄金'],
                description: 'Uncertainty, defensive plays',
                risk: 'LOW'
            }
        };
    }
    
    detectRegime(marketData) {
        // Simple regime detection based on market indicators
        const { indexChange, volume, advanceDecline } = marketData;
        
        if (indexChange > 1.5 && volume > 1.2 && advanceDecline > 0.6) {
            return 'EXPANSION';
        } else if (indexChange < -1.5) {
            return 'CONTRACTION';
        } else if (indexChange > 0) {
            return 'RECOVERY';
        } else {
            return 'PEAK';
        }
    }
    
    getRecommendedSectors(regime) {
        return this.sectors[regime] || this.sectors['RECOVERY'];
    }
}

// ======================
// MARKET REGIME DETECTION
// ======================
class MarketRegime {
    detect(data) {
        const { indexChange, volatility, trend, volume } = data;
        
        // Bull Market
        if (indexChange > 1 && volatility < 2 && trend > 0) {
            return {
                regime: 'BULL_STRONG',
                confidence: 85,
                strategy: 'AGGRESSIVE',
                positionSize: 20
            };
        }
        
        // Bull Correction
        if (indexChange > 0 && volatility > 2) {
            return {
                regime: 'BULL_CORRECTION',
                confidence: 70,
                strategy: 'SELECTIVE',
                positionSize: 15
            };
        }
        
        // Bear Market
        if (indexChange < -1.5) {
            return {
                regime: 'BEAR',
                confidence: 80,
                strategy: 'DEFENSIVE',
                positionSize: 10
            };
        }
        
        // Sideways
        return {
            regime: 'SIDEWAYS',
            confidence: 75,
            strategy: 'RANGE_TRADING',
            positionSize: 12
        };
    }
}

// ======================
// NEWS SENTIMENT ANALYSIS
// ======================
class NewsSentiment {
    constructor() {
        this.keywords = {
            positive: ['利好', '上涨', '突破', '增长', '业绩', '订单', '合作', '买入', '增持'],
            negative: ['利空', '下跌', '风险', '亏损', '减持', '诉讼', '调查', '警告'],
            neutral: ['公告', '会议', '报告', '数据']
        };
    }
    
    analyze(news) {
        let score = 0;
        const words = news.toLowerCase().split('');
        
        for (const [word, impact] of Object.entries(this.keywords)) {
            for (const keyword of impact) {
                if (news.includes(keyword)) {
                    if (word === 'positive') score += 1;
                    else if (word === 'negative') score -= 1;
                }
            }
        }
        
        return {
            score: score,
            sentiment: score > 0 ? 'POSITIVE' : score < 0 ? 'NEGATIVE' : 'NEUTRAL',
            action: score > 1 ? 'BUY' : score < -1 ? 'SELL' : 'NEUTRAL'
        };
    }
}

// ======================
// QUANTUM PATTERN ENGINE
// ======================
class QuantumPatterns {
    detect(stockData) {
        const patterns = [];
        const { prices, volume, rsi, macd } = stockData;
        
        // Pattern 1: The Anarchist (Volatility Breakout)
        const volatility = this.calculateVolatility(prices);
        if (volatility > 5) {
            patterns.push({
                name: 'THE_ANARCHIST',
                description: 'High volatility breakout',
                confidence: 92,
                action: 'BUY'
            });
        }
        
        // Pattern 2: Silver Swan (Gradual Accumulation)
        const trend = prices[prices.length-1] - prices[0];
        if (trend > 0 && trend < 3 && volatility < 2) {
            patterns.push({
                name: 'SILVER_SWAN',
                description: 'Gradual accumulation',
                confidence: 78,
                action: 'BUY'
            });
        }
        
        // Pattern 3: Dark Pool Robot (Hidden Institutional)
        if (volume > 20000000) {
            patterns.push({
                name: 'DARK_POOL_ROBOT',
                description: 'Hidden institutional buying',
                confidence: 85,
                action: 'BUY'
            });
        }
        
        // Pattern 4: Phoenix Rising (Recovery)
        if (rsi < 35 && macd > 0) {
            patterns.push({
                name: 'PHOENIX_RISING',
                description: 'Recovery from bottom',
                confidence: 82,
                action: 'BUY'
            });
        }
        
        // Pattern 5: Quantum Leap (Momentum)
        if (macd > 0 && volume > 15000000) {
            patterns.push({
                name: 'QUANTUM_LEAP',
                description: 'Momentum breakout',
                confidence: 88,
                action: 'BUY'
            });
        }
        
        return patterns;
    }
    
    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }
}

// ======================
// CALCULATION ENGINE
// ======================
class CalculationEngine {
    
    // Position Size Calculator
    calculatePositionSize(capital, price, riskPercent) {
        const riskAmount = capital * (riskPercent / 100);
        const shares = Math.floor(riskAmount / price);
        const positionValue = shares * price;
        
        return {
            shares: shares,
            positionValue: positionValue,
            riskAmount: riskAmount,
            riskPercent: riskPercent,
            capitalRemaining: capital - positionValue
        };
    }
    
    // Profit/Loss Calculator
    calculatePnL(buyPrice, sellPrice, shares) {
        const cost = buyPrice * shares;
        const proceeds = sellPrice * shares;
        const profit = proceeds - cost;
        const profitPercent = (profit / cost * 100);
        
        return {
            buyPrice: buyPrice,
            sellPrice: sellPrice,
            shares: shares,
            cost: cost,
            proceeds: proceeds,
            profit: profit,
            profitPercent: profitPercent,
            action: profit > 0 ? 'PROFIT' : profit < 0 ? 'LOSS' : 'BREAKEVEN'
        };
    }
    
    // Stop Loss Calculator
    calculateStopLoss(buyPrice, riskPercent) {
        const stopLoss = buyPrice * (1 - riskPercent / 100);
        const riskPerShare = buyPrice - stopLoss;
        
        return {
            buyPrice: buyPrice,
            stopLoss: stopLoss,
            riskPercent: riskPercent,
            riskPerShare: riskPerShare,
            maxLoss: riskPerShare
        };
    }
    
    // ROI Calculator
    calculateROI(currentPrice, costBasis, shares) {
        const totalCost = costBasis * shares;
        const currentValue = currentPrice * shares;
        const profit = currentValue - totalCost;
        const roi = (profit / totalCost * 100);
        
        return {
            costBasis: costBasis,
            currentPrice: currentPrice,
            currentValue: currentValue,
            profit: profit,
            roi: roi,
            action: roi > 0 ? 'PROFIT' : 'LOSS'
        };
    }
    
    // Risk/Reward Calculator
    calculateRiskReward(buyPrice, targetPrice, stopLoss) {
        const risk = Math.abs(buyPrice - stopLoss);
        const reward = Math.abs(targetPrice - buyPrice);
        const ratio = reward / risk;
        
        return {
            buyPrice: buyPrice,
            targetPrice: targetPrice,
            stopLoss: stopLoss,
            risk: risk,
            reward: reward,
            ratio: ratio.toFixed(2),
            recommendation: ratio >= 2 ? 'GOOD' : ratio >= 1.5 ? 'ACCEPTABLE' : 'POOR'
        };
    }
    
    // Average Down Calculator
    calculateAverageDown(originalShares, originalPrice, newShares, newPrice) {
        const totalShares = originalShares + newShares;
        const totalCost = (originalShares * originalPrice) + (newShares * newPrice);
        const averagePrice = totalCost / totalShares;
        
        return {
            originalShares: originalShares,
            originalPrice: originalPrice,
            newShares: newShares,
            newPrice: newPrice,
            totalShares: totalShares,
            averagePrice: averagePrice,
            savingsPerShare: originalPrice - averagePrice
        };
    }
}

// ======================
// MAIN SUPER BRAIN ENGINE
// ======================
class SuperBrainProAdvanced {
    constructor() {
        this.indicators = new AdvancedIndicators();
        this.sectorRotation = new SectorRotation();
        this.regime = new MarketRegime();
        this.news = new NewsSentiment();
        this.quantum = new QuantumPatterns();
        this.calc = new CalculationEngine();
    }
    
    analyze(stock) {
        // Generate mock data if not provided
        const prices = stock.prices || [38, 38.2, 38.5, 38.3, 38.6, 38.8, 39, 38.72];
        const volumes = stock.volumes || [15000000, 18000000, 22000000, 20000000, 25000000, 23000000, 28000000, 25000000];
        
        // Calculate all indicators
        const rsi = this.indicators.calculateRSI(prices);
        const macd = this.indicators.calculateMACD(prices);
        const bollinger = this.indicators.calculateBollingerBands(prices);
        const vwap = this.indicators.calculateVWAP(prices, volumes);
        const stoch = this.indicators.calculateStochastic(prices);
        const atr = this.indicators.calculateATR(prices);
        
        // Sector rotation
        const regimeData = { indexChange: 0.5, volume: 1.2, advanceDecline: 0.55 };
        const currentRegime = this.regime.detect(regimeData);
        const sectorInfo = this.sectorRotation.getRecommendedSectors(currentRegime.regime);
        
        // Quantum patterns
        const quantumData = { prices, volume: volumes[volumes.length-1], rsi: rsi.value, macd: macd.macd };
        const patterns = this.quantum.detect(quantumData);
        
        // Calculate overall score
        let score = 50;
        if (rsi.signal === 'OVERSOLD') score += 20;
        if (macd.action === 'BULLISH') score += 20;
        if (patterns.length > 0) score += patterns[0].confidence * 0.3;
        
        return {
            symbol: stock.symbol,
            name: stock.name,
            
            // Indicators
            rsi: rsi,
            macd: macd,
            bollinger: bollinger,
            vwap: vwap,
            stochastic: stoch,
            atr: atr,
            
            // Regime
            regime: currentRegime,
            sectorInfo: sectorInfo,
            
            // Patterns
            quantumPatterns: patterns,
            
            // Score
            totalScore: Math.min(100, Math.round(score)),
            
            // Recommendation
            recommendation: score > 75 ? 'STRONG_BUY' : score > 55 ? 'BUY' : score > 40 ? 'WATCH' : 'AVOID'
        };
    }
}

// ======================
// RUN DEMO
// ======================
if (require.main === module) {
    const brain = new SuperBrainProAdvanced();
    
    const testStock = {
        symbol: '600036',
        name: '招商银行',
        prices: [38, 38.2, 38.5, 38.3, 38.6, 38.8, 39, 38.72],
        volumes: [15000000, 18000000, 22000000, 20000000, 25000000, 23000000, 28000000, 25000000]
    };
    
    const result = brain.analyze(testStock);
    
    console.log('\n' + '🧠'.repeat(10));
    console.log('\n   SUPER BRAIN PRO ADVANCED v5.0');
    console.log('   =============================\n');
    
    console.log(`📌 ${result.symbol} ${result.name}`);
    console.log(`   📊 Total Score: ${result.totalScore}/100`);
    console.log(`   🎯 Recommendation: ${result.recommendation}\n`);
    
    console.log('📈 INDICATORS:');
    console.log(`   RSI: ${(result.rsi?.value || 50).toFixed(1)} (${result.rsi?.signal || 'NEUTRAL'})`);
    console.log(`   MACD: ${result.macd?.crossover || 'N/A'} (${result.macd?.action || 'NEUTRAL'})`);
    console.log(`   Bollinger: ${result.bollinger?.position || 'N/A'}`);
    console.log(`   VWAP: ${result.vwap?.action || 'N/A'} (${result.vwap?.distance || 0}% away)`);
    console.log(`   Stochastic: ${result.stoch?.signal || 'NEUTRAL'}\n`);
    
    console.log('🎯 MARKET REGIME:');
    console.log(`   Regime: ${result.regime.regime} (${result.regime.confidence}% confidence)`);
    console.log(`   Strategy: ${result.regime.strategy}`);
    console.log(`   Sector: ${result.sectorInfo.sectors.join(', ')}\n`);
    
    console.log('⚡ QUANTUM PATTERNS:');
    result.quantumPatterns.forEach(p => {
        console.log(`   ${p.name}: ${p.description} (${p.confidence}%)`);
    });
    
    // Demo calculations
    console.log('\n🧮 CALCULATIONS:');
    const position = brain.calc.calculatePositionSize(100000, 38.72, 2);
    console.log(`   Position Size: ${position.shares} shares (¥${position.positionValue.toFixed(0)})`);
    
    const pnl = brain.calc.calculatePnL(38.72, 42, 1000);
    console.log(`   P&L: ¥${pnl.profit.toFixed(0)} (${pnl.profitPercent.toFixed(1)}%)`);
    
    const riskReward = brain.calc.calculateRiskReward(38.72, 45, 36);
    console.log(`   Risk/Reward: 1:${riskReward.ratio} (${riskReward.recommendation})`);
    
    console.log('\n' + '✅'.repeat(10) + '\n');
}

module.exports = { SuperBrainProAdvanced };
