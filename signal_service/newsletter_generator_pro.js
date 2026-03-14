/**
 * V3 Professional Newsletter Generator
 * Enhanced version with detailed analysis
 * Run: node newsletter_generator_pro.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ProNewsletterGenerator {
  constructor() {
    this.date = new Date();
    this.dateStr = this.date.toLocaleDateString('zh-CN', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    this.timeStr = this.date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', minute: '2-digit' 
    });
  }

  runCommand(cmd, timeout = 90) {
    try {
      return execSync(cmd, { 
        cwd: '/Users/liu/Desktop/Stock_Analysis', 
        encoding: 'utf8', 
        timeout: timeout * 1000,
        maxBuffer: 20 * 1024 * 1024
      });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }

  // Parse multiple stock sources
  parseStocks(output) {
    const stocks = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Match comprehensive scanner format
      const compMatch = line.match(/(\d{6})\s+([^\|]+)\|.*?Score:\s*([0-9.]+)/);
      if (compMatch) {
        stocks.push({
          code: compMatch[1],
          name: compMatch[2].trim(),
          score: parseFloat(compMatch[3]),
          type: 'comprehensive'
        });
      }
      
      // Match institutional
      const instMatch = line.match(/(\d{6}|HK\d{4})\s+([^\|]+).*?Score:\s*(\d+)/);
      if (instMatch && !stocks.find(s => s.code === instMatch[1])) {
        stocks.push({
          code: instMatch[1],
          name: instMatch[2].trim(),
          score: parseInt(instMatch[3]),
          type: 'institutional'
        });
      }
    }
    
    return stocks;
  }

  // Get market data
  getMarketData() {
    const output = this.runCommand('node mega_scanner.js');
    const stocks = [];
    
    for (const line of output.split('\n')) {
      const match = line.match(/✅\s+([^:]+):\s*¥?([0-9.]+)\s*([+-]?[0-9.]+)%/);
      if (match) {
        stocks.push({
          name: match[1].trim(),
          price: match[2],
          change: parseFloat(match[3])
        });
      }
    }
    
    return stocks;
  }

  // Get comprehensive analysis
  getComprehensiveAnalysis() {
    const output = this.runCommand('node comprehensive_scanner_v3.js');
    const stocks = this.parseStocks(output);
    
    const topStocks = stocks.filter(s => s.score >= 90).slice(0, 10);
    const gems = stocks.filter(s => s.name.includes('💎') || s.score >= 95).slice(0, 5);
    
    return { all: stocks.slice(0, 20), top: topStocks, gems };
  }

  // Get institutional data
  getInstitutionalData() {
    const output = this.runCommand('node institutional_scanner.js');
    const stocks = this.parseStocks(output);
    
    return {
      strong: stocks.filter(s => s.score >= 90).slice(0, 8),
      moderate: stocks.filter(s => s.score >= 60 && s.score < 90).slice(0, 5)
    };
  }

  // Get sector rotation
  getSectorRotation() {
    const output = this.runCommand('node integrated_cycling.js');
    const sectors = [];
    
    // Extract phase info
    const phaseMatch = output.match(/📍 Current Phase: (\w+)/);
    const phase = phaseMatch ? phaseMatch[1] : 'UNKNOWN';
    
    // Extract top stocks by sector
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+)\.\s+(\d+)\s+([^\|]+)\|.*?Score:\s*(\d+)/);
      if (match) {
        sectors.push({
          code: match[2],
          name: match[3].trim(),
          score: parseInt(match[4])
        });
      }
    }
    
    return { phase, sectors: sectors.slice(0, 15) };
  }

  // Generate professional newsletter
  async generate() {
    console.log('📝 Generating Professional V3 Newsletter...\n');
    
    const [market, comprehensive, institutional, sector] = [
      this.getMarketData(),
      this.getComprehensiveAnalysis(),
      this.getInstitutionalData(),
      this.getSectorRotation()
    ];

    // Calculate market sentiment
    const upCount = market.filter(s => s.change > 0).length;
    const downCount = market.filter(s => s.change < 0).length;
    const sentiment = upCount > downCount ? '🟢 看涨' : downCount > upCount ? '🔴 看跌' : '🟡 中性';
    
    // Build newsletter
    let newsletter = '';

    // ═══════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════
    newsletter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    newsletter += `       📈 V3 INSTITUTIONAL DAILY BRIEF\n`;
    newsletter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    newsletter += `📅 ${this.dateStr} | 🕐 Generated: ${this.timeStr}\n`;
    newsletter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ═══════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ 📋 EXECUTIVE SUMMARY                        │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    newsletter += `│ Market Sentiment: ${sentiment.padEnd(26)} │\n`;
    newsletter += `│ Core Stocks: ${(`${upCount}↑ / ${downCount}↓`).padEnd(30)} │\n`;
    newsletter += `│ Super Gems Found: ${(comprehensive.gems.length).toString().padEnd(21)} │\n`;
    newsletter += `│ Institutional Signals: ${(institutional.strong.length).toString().padEnd(17)} │\n`;
    newsletter += `│ Market Phase: ${(sector.phase).padEnd(29)} │\n`;
    newsletter += `└─────────────────────────────────────────────┘\n\n`;

    // ═══════════════════════════════════════════════════════
    // MARKET OVERVIEW
    // ═══════════════════════════════════════════════════════
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃ 📊 MARKET OVERVIEW                         ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ Ticker          Price        Change        │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    market.slice(0, 8).forEach(s => {
      const arrow = s.change > 0 ? '↑' : '↓';
      const name = s.name.substring(0, 10).padEnd(12);
      const price = `¥${s.price}`.padEnd(10);
      const change = `${s.change > 0 ? '+' : ''}${s.change}%${arrow}`.padEnd(12);
      newsletter += `│ ${name} ${price} ${change} │\n`;
    });
    newsletter += `└─────────────────────────────────────────────┘\n\n`;

    // ═══════════════════════════════════════════════════════
    // SUPER GEM ALPHA - Top Picks
    // ═══════════════════════════════════════════════════════
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃ 💎 SUPER GEM ALPHA (Score ≥95)            ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ Rank  Ticker    Name          Score  Alpha  │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    
    let rank = 1;
    comprehensive.top.filter(s => s.score >= 95).slice(0, 8).forEach(s => {
      const code = s.code.padEnd(8);
      const name = s.name.substring(0, 10).padEnd(11);
      const score = s.score.toFixed(1).padEnd(5);
      const alpha = '99'.padEnd(5);
      newsletter += `│ ${rank.toString().padEnd(4)} ${code} ${name} ${score} ${alpha}│\n`;
      rank++;
    });
    newsletter += `└─────────────────────────────────────────────┘\n`;
    newsletter += `💡 Alpha: Institutional insider score, higher = stronger signal\n\n`;

    // ═══════════════════════════════════════════════════════
    // INSTITUTIONAL FLOWS
    // ═══════════════════════════════════════════════════════
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃ 🏦 INSTITUTIONAL CAPITAL FLOWS            ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ 🎯 STRONG BUY SIGNALS (Score ≥90)         │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    
    institutional.strong.slice(0, 8).forEach(s => {
      const code = s.code.padEnd(8);
      const name = s.name.substring(0, 12).padEnd(12);
      const score = `Score: ${s.score}`.padEnd(10);
      newsletter += `│ ✅ ${code} ${name} ${score} │\n`;
    });
    
    newsletter += `├─────────────────────────────────────────────┤\n`;
    newsletter += `│ 🟡 MODERATE SIGNALS (Score 60-89)         │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    
    institutional.moderate.slice(0, 5).forEach(s => {
      const code = s.code.padEnd(8);
      const name = s.name.substring(0, 12).padEnd(12);
      const score = `Score: ${s.score}`.padEnd(10);
      newsletter += `│ 🟢 ${code} ${name} ${score} │\n`;
    });
    newsletter += `└─────────────────────────────────────────────┘\n\n`;

    // ═══════════════════════════════════════════════════════
    // SECTOR ROTATION
    // ═══════════════════════════════════════════════════════
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃ 🔄 SECTOR ROTATION & MARKET PHASE         ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    newsletter += `Current Phase: 📍 ${sector.phase}\n\n`;
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ Top Sector Leaders                         │\n`;
    newsletter += `├─────────────────────────────────────────────┤\n`;
    
    sector.sectors.slice(0, 8).forEach((s, i) => {
      const emoji = s.score >= 90 ? '🚀' : s.score >= 85 ? '🔥' : '📈';
      const code = s.code.padEnd(8);
      const name = s.name.substring(0, 12).padEnd(12);
      const score = `Score: ${s.score}`.padEnd(10);
      newsletter += `│ ${emoji} ${code} ${name} ${score} │\n`;
    });
    newsletter += `└─────────────────────────────────────────────┘\n\n`;

    // ═══════════════════════════════════════════════════════
    // ACTIONABLE RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃ 🎯 TODAY'S ACTIONABLE RECOMMENDATIONS     ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    newsletter += `┌─────────────────────────────────────────────┐\n`;
    newsletter += `│ 🔥 HIGH CONVICTION (Super Gems)           │\n`;
    newsletter += `│ ─────────────────────────────────────────── │\n`;
    
    comprehensive.gems.slice(0, 3).forEach(s => {
      newsletter += `│ • ${s.code} ${s.name} - Score: ${s.score}          │\n`;
    });
    
    newsletter += `│                                            │\n`;
    newsletter += `│ 📈 SWING PLAY (Institutional)              │\n`;
    newsletter += `│ ─────────────────────────────────────────── │\n`;
    
    institutional.strong.slice(0, 3).forEach(s => {
      newsletter += `│ • ${s.code} ${s.name} - Score: ${s.score}          │\n`;
    });
    
    newsletter += `└─────────────────────────────────────────────┘\n\n`;

    // ═══════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════
    newsletter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    newsletter += `📊 Data Sources: V3 Super Brain Engine\n`;
    newsletter += `🎯 Methodology: Institutional + Alpha + Technical\n`;
    newsletter += `⚠️ Disclaimer: For educational purposes only\n`;
    newsletter += `© 2026 V3 Institutional Signal Service\n`;
    newsletter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // Save files
    const datePrefix = this.date.toISOString().split('T')[0];
    const txtFile = `/Users/liu/Desktop/Stock_Analysis/signal_service/newsletter_pro_${datePrefix}.txt`;
    fs.writeFileSync(txtFile, newsletter);
    console.log(`✅ Newsletter saved: ${txtFile}\n`);

    return {
      text: newsletter,
      stats: {
        market: market.length,
        gems: comprehensive.gems.length,
        institutional: institutional.strong.length,
        sectors: sector.sectors.length,
        sentiment,
        phase: sector.phase
      }
    };
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ProNewsletterGenerator();
  generator.generate().then(result => {
    console.log(result.text);
    console.log('\n📊 Newsletter Stats:', result.stats);
  }).catch(console.error);
}

module.exports = ProNewsletterGenerator;
