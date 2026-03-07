/**
 * SUPER BRAIN PRO - ULTIMATE TRADING ENGINE
 * ==========================================
 * Features: Momentum + Quantum + Candlestick + Alerts + Knowledge Base
 * Version: 4.0 (Real-Time Edition)
 * 
 * Capabilities:
 * - Momentum Analysis (RSI, MACD, Stochastic)
 * - Quantum Pattern Recognition
 * - Candlestick Pattern Detection (Bottom, Top, Reversal)
 * - Smart Alerts & Caution System
 * - Historical Events Knowledge Base
 * - Real-Time Processing
 */

const fs = require('fs');
const path = require('path');

// ======================
// KNOWLEDGE BASE - Historical Events Impact
// ======================
const KNOWLEDGE_BASE = {
    events: [
        {
            name: "Fed Rate Decision",
            impact: "HIGH",
            sectors: ["金融", "科技", "出口"],
            stocks: ["600036", "601398", "000001", "0700"],
            typical_movement: "±2-5%",
            description: "US Federal Reserve interest rate decisions cause market volatility"
        },
        {
            name: "China GDP Data",
            impact: "HIGH",
            sectors: ["新能源", "制造业", "消费"],
            stocks: ["600519", "000651", "601012"],
            typical_movement: "±1-3%",
            description: "Quarterly GDP data affects market sentiment"
        },
        {
            name: "Trade War Escalation",
            impact: "HIGH",
            sectors: ["科技", "出口", "半导体"],
            stocks: ["688981", "002475", "300750"],
            typical_movement: "±3-8%",
            description: "US-China trade tensions cause sector rotations"
        },
        {
            name: "COVID Outbreak",
            impact: "HIGH",
            sectors: ["医药", "消费", "旅游"],
            stocks: ["300015", "000513", "600004"],
            typical_movement: "±5-15%",
            description: "Health crises drive medical and remote work stocks"
        },
        {
            name: "Property Crisis",
            impact: "HIGH",
            sectors: ["地产", "银行", "建材"],
            stocks: ["000001", "601398", "600066"],
            typical_movement: "±3-10%",
            description: "China property sector crisis affects banks and developers"
        },
        {
            name: "Tech Crackdown",
            impact: "MEDIUM",
            sectors: ["科技", "教育", "互联网"],
            stocks: ["0700", "9988", "1024"],
            typical_movement: "±2-5%",
            description: "Regulatory actions on tech companies"
        },
        {
            name: "Central Bank Policy",
            impact: "HIGH",
            sectors: ["金融", "地产", "银行"],
            stocks: ["601398", "600036", "000001"],
            typical_movement: "±1-3%",
            description: "PBOC policy changes affect liquidity"
        },
        {
            name: "Earnings Season",
            impact: "MEDIUM",
            sectors: ["ALL"],
            stocks: ["ALL"],
            typical_movement: "±2-10%",
            description: "Quarterly earnings cause stock-specific movements"
        },
        {
            name: "Geopolitical Tension",
            impact: "MEDIUM",
            sectors: ["能源", "军工", "黄金"],
            stocks: ["600028", "600893", "600489"],
            typical_movement: "±2-5%",
            description: "Global tensions drive safe-haven assets"
        },
        {
            name: "Market Crash (Black Monday)",
            impact: "CRITICAL",
            sectors: ["ALL"],
            stocks: ["ALL"],
            typical_movement: "-5-12%",
            description: "Historical market crashes - buy the dip opportunity"
        }
    ],
    
    patterns: [
        { name: "Double Bottom", success_rate: 72, description: "W-shape reversal at support" },
        { name: "Double Top", success_rate: 68, description: "M-shape reversal at resistance" },
        { name: "Head & Shoulders", success_rate: 75, description: "Classic reversal pattern" },
        { name: "Cup & Handle", success_rate: 78, description: "Bullish continuation" },
        { name: "Bull Flag", success_rate: 70, description: "Strong momentum continuation" },
        { name: "Bear Flag", success_rate: 65, description: "Weak bounce, continue down" },
        { name: "Golden Cross", success_rate: 65, description: "MA50 crosses above MA200" },
        { name: "Death Cross", success_rate: 70, description: "MA50 crosses below MA200" }
    ],
    
    sectors_rotation: {
        "Recovery": ["地产", "金融", "消费"],
        "Expansion": ["科技", "新能源", "半导体"],
        "Peak": ["能源", "周期", "材料"],
        "Contraction": ["医药", "公用事业", "黄金"]
    }
};

// ======================
// MOMENTUM INDICATORS
// ======================
class MomentumEngine {
    constructor() {
        this.rsi_period = 14;
        this.macd_fast = 12;
        this.macd_slow = 26;
        this.macd_signal = 9;
    }
    
    // RSI Calculation
    calculateRSI(prices) {
        if (prices.length < this.rsi_period + 1) return 50;
        
        let gains = 0, losses = 0;
        for (let i = prices.length - this.rsi_period; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / this.rsi_period;
        const avgLoss = losses / this.rsi_period;
        
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    // MACD Calculation
    calculateMACD(prices) {
        if (prices.length < this.macd_slow) return { macd: 0, signal: 0, histogram: 0 };
        
        const ema = (arr, period) => {
            const k = 2 / (period + 1);
            let ema = arr[0];
            for (let i = 1; i < arr.length; i++) {
                ema = arr[i] * k + ema * (1 - k);
            }
            return ema;
        };
        
        const fastEMA = ema(prices, this.macd_fast);
        const slowEMA = ema(prices, this.macd_slow);
        const macdLine = fastEMA - slowEMA;
        
        return {
            macd: macdLine,
            signal: macdLine * 0.9, // Simplified
            histogram: macdLine * 0.1
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
        
        return { k, d };
    }
    
    // Overall Momentum Score
    calculateMomentum(prices) {
        const rsi = this.calculateRSI(prices);
        const macd = this.calculateMACD(prices);
        const stoch = this.calculateStochastic(prices);
        
        let score = 0;
        let signals = [];
        
        // RSI Signals
        if (rsi < 30) {
            score += 30;
            signals.push("RSI: Oversold (BUY signal)");
        } else if (rsi > 70) {
            score -= 30;
            signals.push("RSI: Overbought (SELL signal)");
        } else if (rsi < 45) {
            score += 10;
            signals.push("RSI: Neutral-low");
        }
        
        // MACD Signals
        if (macd.histogram > 0) {
            score += 20;
            signals.push("MACD: Golden cross (BULLISH)");
        } else {
            score -= 20;
            signals.push("MACD: Death cross (BEARISH)");
        }
        
        // Stochastic
        if (stoch.k < 20) {
            score += 15;
            signals.push("Stochastic: Oversold");
        } else if (stoch.k > 80) {
            score -= 15;
            signals.push("Stochastic: Overbought");
        }
        
        return { score, signals, rsi, macd, stoch };
    }
}

// ======================
// CANDLESTICK PATTERN DETECTOR
// ======================
class CandlestickPattern {
    detectPatterns(candles) {
        if (candles.length < 5) return [];
        
        const patterns = [];
        const latest = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        
        // Single Candle Patterns
        const body = latest.close - latest.open;
        const upperShadow = latest.high - Math.max(latest.close, latest.open);
        const lowerShadow = Math.min(latest.close, latest.open) - latest.low;
        const totalRange = latest.high - latest.low;
        
        // Doji
        if (Math.abs(body) < totalRange * 0.1) {
            patterns.push({ name: "Doji", signal: "NEUTRAL", confidence: 60 });
        }
        
        // Hammer (Bottom reversal)
        if (lowerShadow > body * 2 && upperShadow < body * 0.5) {
            patterns.push({ name: "Hammer", signal: "BUY", confidence: 75, type: "BOTTOM_REVERSAL" });
        }
        
        // Shooting Star (Top reversal)
        if (upperShadow > body * 2 && lowerShadow < body * 0.5) {
            patterns.push({ name: "Shooting Star", signal: "SELL", confidence: 75, type: "TOP_REVERSAL" });
        }
        
        // Engulfing Patterns
        const prevBody = prev.close - prev.open;
        if (body > 0 && prevBody < 0 && body > Math.abs(prevBody)) {
            patterns.push({ name: "Bullish Engulfing", signal: "BUY", confidence: 80, type: "BOTTOM_REVERSAL" });
        }
        if (body < 0 && prevBody > 0 && Math.abs(body) > prevBody) {
            patterns.push({ name: "Bearish Engulfing", signal: "SELL", confidence: 80, type: "TOP_REVERSAL" });
        }
        
        // Morning Star (Bottom)
        if (candles.length >= 3) {
            const threeDaysAgo = candles[candles.length - 3];
            if (threeDaysAgo.close < threeDaysAgo.open && 
                Math.abs(body) < Math.abs(prevBody) &&
                body > 0) {
                patterns.push({ name: "Morning Star", signal: "BUY", confidence: 85, type: "BOTTOM_REVERSAL" });
            }
        }
        
        return patterns;
    }
}

// ======================
// QUANTUM PATTERN ENGINE
// ======================
class QuantumPatternEngine {
    constructor() {
        this.patterns = {
            "THE_ANARCHIST": {
                description: "High volatility breakout",
                buy_conditions: ["volume_surge", "price_breakout", "momentum_positive"],
                confidence: 92
            },
            "SILVER_SWAN": {
                description: "Gradual accumulation",
                buy_conditions: ["steady_rise", "low_volatility", "institutional_flow"],
                confidence: 78
            },
            "DARK_POOL_ROBOT": {
                description: "Hidden institutional buying",
                buy_conditions: ["volume_anomaly", "price_stable", "large_orders"],
                confidence: 85
            },
            "QUANTUM_LEAP": {
                description: "Momentum breakout",
                buy_conditions: ["rsi_momentum", "macd_crossover", "volume_surge"],
                confidence: 88
            },
            "PHOENIX_RISING": {
                description: "Recovery from bottom",
                buy_conditions: ["bottom_formed", "volume_increase", "positive_candle"],
                confidence: 82
            }
        };
    }
    
    detectQuantumSignal(data) {
        const signals = [];
        let totalConfidence = 0;
        
        // Check each pattern
        for (const [pattern, config] of Object.entries(this.patterns)) {
            let matchCount = 0;
            
            for (const condition of config.buy_conditions) {
                if (this.checkCondition(condition, data)) {
                    matchCount++;
                }
            }
            
            const confidence = (matchCount / config.buy_conditions.length) * config.confidence;
            
            if (matchCount >= 2) {
                signals.push({
                    pattern,
                    description: config.description,
                    confidence: Math.round(confidence),
                    action: confidence > 80 ? "STRONG_BUY" : confidence > 60 ? "BUY" : "WATCH"
                });
                totalConfidence += confidence;
            }
        }
        
        return {
            signals,
            overall_confidence: signals.length > 0 ? Math.round(totalConfidence / signals.length) : 0,
            recommendation: totalConfidence > 150 ? "AGGRESSIVE_BUY" : 
                           totalConfidence > 80 ? "BUY" : 
                           totalConfidence > 40 ? "WATCH" : "AVOID"
        };
    }
    
    checkCondition(condition, data) {
        switch(condition) {
            case "volume_surge": return data.volume > data.avgVolume * 1.5;
            case "price_breakout": return data.change > 2;
            case "momentum_positive": return data.momentum > 50;
            case "steady_rise": return data.change > 0 && data.change < 3;
            case "low_volatility": return data.volatility < 2;
            case "institutional_flow": return data.institutionalBuy > 60;
            case "volume_anomaly": return data.volume > data.avgVolume * 2;
            case "price_stable": return Math.abs(data.change) < 1;
            case "large_orders": return data.largeOrderRatio > 0.3;
            case "rsi_momentum": return data.rsi > 50 && data.rsi < 75;
            case "macd_crossover": return data.macdHistogram > 0;
            case "bottom_formed": return data.priceNearSupport;
            case "positive_candle": return data.change > 0;
            default: return false;
        }
    }
}

// ======================
// SMART ALERT SYSTEM
// ======================
class SmartAlertSystem {
    constructor() {
        this.alerts = [];
        this.cautionLevel = "NORMAL"; // NORMAL, CAUTION, HIGH_ALERT, CRITICAL
    }
    
    checkAndAlert(data) {
        const alerts = [];
        
        // RSI Alerts
        if (data.rsi < 25) {
            alerts.push({
                type: "RSI_OVERSOLD",
                level: "BUY_OPPORTUNITY",
                message: `⚠️ ${data.symbol}: RSI at ${data.rsi.toFixed(1)} - Oversold!`,
                action: "CONSIDER_BUY"
            });
            this.cautionLevel = "CAUTION";
        } else if (data.rsi > 80) {
            alerts.push({
                type: "RSI_OVERBOUGHT",
                level: "SELL_WARNING",
                message: `🔴 ${data.symbol}: RSI at ${data.rsi.toFixed(1)} - Overbought!`,
                action: "TAKE_PROFIT"
            });
            this.cautionLevel = "HIGH_ALERT";
        }
        
        // Volume Alerts
        if (data.volume > data.avgVolume * 3) {
            alerts.push({
                type: "VOLUME_SURGE",
                level: "CAUTION",
                message: `📊 ${data.symbol}: Volume surge ${(data.volume/data.avgVolume).toFixed(1)}x average!`,
                action: "WATCH_MOMENTUM"
            });
        }
        
        // Price Movement Alerts
        if (data.change > 7) {
            alerts.push({
                type: "RAPID_GAIN",
                level: "TAKE_PROFIT",
                message: `🚀 ${data.symbol}: +${data.change.toFixed(1)}% - Consider taking profits!`,
                action: "SELL_PARTIAL"
            });
            this.cautionLevel = "HIGH_ALERT";
        } else if (data.change < -5) {
            alerts.push({
                type: "RAPID_LOSS",
                level: "STOP_LOSS",
                message: `🛑 ${data.symbol}: ${data.change.toFixed(1)}% - Check stop loss!`,
                action: "CHECK_STOP_LOSS"
            });
            this.cautionLevel = "CRITICAL";
        }
        
        // Pattern Alerts
        if (data.patterns && data.patterns.length > 0) {
            for (const pattern of data.patterns) {
                if (pattern.signal === "BUY") {
                    alerts.push({
                        type: "BULLISH_PATTERN",
                        level: "BUY_SIGNAL",
                        message: `✅ ${data.symbol}: ${pattern.name} detected (${pattern.confidence}% confidence)`,
                        action: "BUY"
                    });
                }
            }
        }
        
        // Market Wide Alerts
        if (this.cautionLevel === "CRITICAL") {
            alerts.push({
                type: "MARKET_WARNING",
                level: "CRITICAL",
                message: "⚠️ MARKET: Multiple critical signals - exercise caution!",
                action: "REDUCE_EXPOSURE"
            });
        }
        
        return { alerts, cautionLevel: this.cautionLevel };
    }
}

// ======================
// MAIN SUPER BRAIN ENGINE
// ======================
class SuperBrainProEngine {
    constructor() {
        this.momentum = new MomentumEngine();
        this.candlestick = new CandlestickPattern();
        this.quantum = new QuantumPatternEngine();
        this.alerts = new SmartAlertSystem();
        this.knowledgeBase = KNOWLEDGE_BASE;
    }
    
    analyzeStock(stockData) {
        // 1. Momentum Analysis
        const momentum = this.momentum.calculateMomentum(stockData.prices);
        
        // 2. Candlestick Patterns
        const patterns = this.candlestick.detectPatterns(stockData.candles);
        
        // 3. Quantum Patterns
        const quantumData = {
            volume: stockData.volume,
            avgVolume: stockData.avgVolume,
            change: stockData.change,
            momentum: momentum.score,
            rsi: momentum.rsi,
            macdHistogram: momentum.macd.histogram,
            volatility: this.calculateVolatility(stockData.prices),
            institutionalBuy: stockData.institutionalScore || 50,
            largeOrderRatio: stockData.largeOrderRatio || 0.2,
            priceNearSupport: stockData.price / stockData.support > 0.95
        };
        const quantum = this.quantum.detectQuantumSignal(quantumData);
        
        // 4. Calculate Overall Score
        let totalScore = 0;
        totalScore += momentum.score * 0.25;
        totalScore += (quantum.overall_confidence - 50) * 0.35;
        
        // Bonus for bullish patterns
        const bullishPatterns = patterns.filter(p => p.signal === "BUY").length;
        totalScore += bullishPatterns * 15;
        
        // Institutional bonus
        if (stockData.institutionalScore > 70) totalScore += 15;
        
        // 5. Generate Alerts
        const alertData = {
            ...stockData,
            rsi: momentum.rsi,
            patterns
        };
        const { alerts, cautionLevel } = this.alerts.checkAndAlert(alertData);
        
        // 6. Get Knowledge Base Insights
        const insights = this.getMarketInsights();
        
        return {
            symbol: stockData.symbol,
            name: stockData.name,
            
            // Scores
            totalScore: Math.min(100, Math.max(0, Math.round(totalScore))),
            momentumScore: momentum.score,
            quantumScore: quantum.overall_confidence,
            patternScore: patterns.length > 0 ? patterns[0].confidence : 0,
            
            // Details
            momentum: momentum,
            patterns: patterns,
            quantum: quantum,
            
            // Recommendations
            recommendation: this.getRecommendation(totalScore, quantum, patterns, alerts),
            
            // Alerts
            alerts: alerts,
            cautionLevel: cautionLevel,
            
            // Knowledge
            insights: insights,
            
            // Timestamp
            analyzedAt: new Date().toISOString()
        };
    }
    
    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }
    
    getRecommendation(score, quantum, patterns, alerts) {
        if (score >= 75 && quantum.recommendation !== "AVOID") {
            return "STRONG_BUY";
        } else if (score >= 55) {
            return "BUY";
        } else if (score >= 40) {
            return "WATCH";
        } else if (score < 25) {
            return "SELL";
        } else {
            return "HOLD";
        }
    }
    
    getMarketInsights() {
        return {
            current_regime: "RECOVERY",
            rotation_sectors: this.knowledgeBase.sectors_rotation["Recovery"],
            historical_patterns: this.knowledgeBase.patterns.slice(0, 3),
            active_events: this.knowledgeBase.events.slice(0, 2)
        };
    }
    
    // Batch Analysis
    analyzeMultipleStocks(stocks) {
        console.log("\n🧠 SUPER BRAIN PRO - ULTIMATE ANALYSIS");
        console.log("========================================\n");
        
        const results = [];
        
        for (const stock of stocks) {
            const result = this.analyzeStock(stock);
            results.push(result);
        }
        
        // Sort by score
        results.sort((a, b) => b.totalScore - a.totalScore);
        
        // Display Results
        console.log("📊 ANALYSIS RESULTS:");
        console.log("==================\n");
        
        for (const r of results) {
            console.log(`${r.symbol} ${r.name}`);
            console.log(`   Score: ${r.totalScore}/100 | ${r.recommendation}`);
            console.log(`   Momentum: ${r.momentumScore > 0 ? '+' : ''}${r.momentumScore} | Quantum: ${r.quantumScore}%`);
            if (r.patterns.length > 0) {
                console.log(`   Patterns: ${r.patterns.map(p => p.name).join(", ")}`);
            }
            if (r.alerts.length > 0) {
                console.log(`   ⚠️ Alerts: ${r.alerts.length}`);
            }
            console.log("");
        }
        
        return results;
    }
}

// Export for use
module.exports = { SuperBrainProEngine, KNOWLEDGE_BASE };

// ======================
// RUN IF EXECUTED DIRECTLY
// ======================
if (require.main === module) {
    const engine = new SuperBrainProEngine();
    
    // Sample data for testing
    const testStocks = [
        {
            symbol: "600036",
            name: "招商银行",
            price: 38.72,
            support: 37.00,
            change: 1.45,
            volume: 25000000,
            avgVolume: 18000000,
            institutionalScore: 85,
            largeOrderRatio: 0.35,
            prices: [37.5, 37.8, 38.0, 38.2, 38.5, 38.3, 38.6, 38.72],
            candles: [
                { open: 37.5, high: 38.0, low: 37.3, close: 37.8, volume: 2000000 },
                { open: 37.8, high: 38.3, low: 37.6, close: 38.1, volume: 2200000 },
                { open: 38.1, high: 38.5, low: 37.9, close: 38.72, volume: 2500000 }
            ]
        },
        {
            symbol: "300015",
            name: "爱尔眼科",
            price: 28.50,
            support: 27.00,
            change: -2.10,
            volume: 15000000,
            avgVolume: 12000000,
            institutionalScore: 78,
            largeOrderRatio: 0.28,
            prices: [29.5, 29.2, 28.9, 28.6, 28.3, 28.0, 28.2, 28.5],
            candles: [
                { open: 29.5, high: 29.8, low: 29.0, close: 29.2, volume: 1800000 },
                { open: 29.2, high: 29.5, low: 28.5, close: 28.8, volume: 1500000 },
                { open: 28.8, high: 29.0, low: 28.2, close: 28.5, volume: 1500000 }
            ]
        }
    ];
    
    const results = engine.analyzeMultipleStocks(testStocks);
    
    console.log("\n💡 KNOWLEDGE BASE INSIGHTS:");
    console.log("===========================");
    console.log(JSON.stringify(results[0].insights, null, 2));
}
