/**
 * Signal Generator - V3 Super Brain to Formatted Signals
 * Runs scans and formats output for distribution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SignalGenerator {
  constructor() {
    this.signals = [];
    this.timestamp = new Date();
  }

  // Run the mega scanner and parse results
  async runMegaScan() {
    console.log('📊 Running Mega Scanner...');
    try {
      const result = execSync('node mega_scanner.js', {
        cwd: '/Users/liu/Desktop/Stock_Analysis',
        encoding: 'utf8',
        timeout: 60000
      });
      
      // Parse stock data from output
      const signals = [];
      const lines = result.split('\n');
      
      for (const line of lines) {
        // Match: ✅ 股票名: ¥价格 -涨跌幅%
        const match = line.match(/✅\s+([^:]+):\s*¥?([0-9.]+)\s*([+-]?[0-9.]+)%/);
        if (match) {
          const name = match[1].trim();
          const price = parseFloat(match[2]);
          const change = parseFloat(match[3]);
          
          signals.push({
            name: name,
            price: price,
            change: change,
            score: this.calculateScore(change),
            recommendation: this.getRecommendation(change),
            timestamp: this.timestamp
          });
        }
      }
      
      return signals;
    } catch (e) {
      console.error('Scan failed:', e.message);
      return [];
    }
  }

  // Run hidden gems
  async runHiddenGemsScan() {
    console.log('🔍 Running Hidden Gems Scan...');
    try {
      const result = execSync('node hidden_gems_detector.js', {
        cwd: '/Users/liu/Desktop/Stock_Analysis',
        encoding: 'utf8',
        timeout: 90000
      });
      return this.parseHiddenGems(result);
    } catch (e) {
      console.log('⚠️ Hidden gems scan error, trying alternative...');
      return [];
    }
  }

  // Parse hidden gems output
  parseHiddenGems(output) {
    const signals = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match various patterns
      const patterns = [
        /([0-9]{6})\s+([^\|]+).*?¥([0-9.]+).*?([+-]?[0-9.]+)%/,
        /([^\|]+)\s*\|\s*¥?([0-9.]+).*?\|\s*([+-]?[0-9.]+)%/
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1] && !match[1].includes('===')) {
          const name = match[1].trim();
          const price = parseFloat(match[2]) || 0;
          const change = parseFloat(match[3]) || 0;
          
          if (price > 0) {
            signals.push({
              name: name,
              price: price,
              change: change,
              score: this.calculateScore(change),
              recommendation: this.getRecommendation(change),
              timestamp: this.timestamp
            });
          }
        }
      }
    }
    
    return signals;
  }

  // Calculate signal score
  calculateScore(change) {
    let score = 50;
    
    if (change >= 5) score += 20;
    if (change >= 10) score += 15;
    if (change >= 20) score += 10;
    if (change < 0) score -= 10; // Penalize negative
    
    return Math.max(0, Math.min(100, score));
  }

  // Get recommendation
  getRecommendation(change) {
    if (change >= 10) return '🚀 STRONG BUY';
    if (change >= 5) return '🔥 BUY';
    if (change >= 0) return '📈 WATCH';
    return '⏳ WAIT';
  }

  // Format for Feishu
  formatForFeishu(signals) {
    const sorted = signals.sort((a, b) => b.score - a.score).slice(0, 10);
    
    const title = `📊 V3 Super Brain Signals - ${this.formatDate()}`;
    let content = `🎯 Found ${signals.length} signals\n`;
    content += `🕐 Generated: ${this.formatTime()}\n\n`;

    const fields = sorted.map((s, i) => ({
      index: i + 1,
      name: s.name.substring(0, 10),
      price: s.price,
      change: s.change,
      score: s.score,
      rec: s.recommendation
    }));

    return { title, content, fields };
  }

  // Format for Telegram
  formatForTelegram(signals) {
    const sorted = signals.sort((a, b) => b.score - a.score).slice(0, 10);
    
    let msg = `📊 *V3 Super Brain Signals* - ${this.formatDate()}\n\n`;
    msg += `🎯 Found ${signals.length} signals\n\n`;
    
    sorted.forEach((s, i) => {
      const emoji = s.change > 10 ? '🚀' : s.change > 5 ? '🔥' : '📈';
      msg += `${i+1}. ${emoji} *${s.name}*\n`;
      msg += `   💰 ¥${s.price} (${s.change > 0 ? '+' : ''}${s.change}%)\n`;
      msg += `   🎯 ${s.recommendation}\n\n`;
    });

    msg += `_Score: V3 Algorithm | ${this.formatTime()}_`;
    return msg;
  }

  formatDate() {
    return this.timestamp.toLocaleDateString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit' 
    });
  }

  formatTime() {
    return this.timestamp.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', minute: '2-digit' 
    });
  }

  // Main run function
  async generate() {
    console.log('⚡ Generating V3 Signals...');
    
    // Run mega scan first (more stocks)
    const megaSignals = await this.runMegaScan();
    const hgSignals = await this.runHiddenGemsScan();
    
    // Combine unique signals
    const allSignals = [...megaSignals];
    
    // Add hidden gems if any
    hgSignals.forEach(s => {
      if (!allSignals.find(x => x.name === s.name)) {
        allSignals.push(s);
      }
    });
    
    this.signals = allSignals;
    console.log(`✅ Generated ${this.signals.length} signals`);

    // Generate market summary
    const marketSummary = this.getMarketSummary(megaSignals);
    
    return {
      raw: this.signals,
      feishu: this.formatForFeishu(this.signals),
      telegram: this.formatForTelegram(this.signals),
      marketSummary: marketSummary,
      timestamp: this.timestamp
    };
  }

  getMarketSummary(signals) {
    if (signals.length === 0) return 'Market data unavailable';
    
    const up = signals.filter(s => s.change > 0).length;
    const down = signals.filter(s => s.change < 0).length;
    const total = signals.length;
    const avgChange = signals.reduce((a, b) => a + b.change, 0) / total;
    
    return `📊 Market: ${up}↑ / ${down}↓ | Avg: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SignalGenerator();
  generator.generate().then(result => {
    console.log('\n📤 TELEGRAM FORMAT:');
    console.log(result.telegram);
    console.log('\n📤 FEISHU FORMAT:');
    console.log(result.feishu);
  }).catch(console.error);
}

module.exports = SignalGenerator;
