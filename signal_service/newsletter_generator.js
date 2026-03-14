/**
 * V3 Newsletter Generator
 * Creates formatted newsletter from Super Brain V3 data
 * Run: node newsletter_generator.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class NewsletterGenerator {
  constructor() {
    this.date = new Date().toLocaleDateString('zh-CN', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    this.sections = {};
  }

  // Run scanner and get output
  runCommand(cmd, timeout = 60) {
    try {
      return execSync(cmd, { 
        cwd: '/Users/liu/Desktop/Stock_Analysis', 
        encoding: 'utf8', 
        timeout: timeout * 1000,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }

  // Parse stock signals from output
  parseSignals(output, limit = 10) {
    const signals = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\d{6}|HK\d{4})\s+([^\|]+).*?Score:\s*(\d+)/);
      if (match) {
        signals.push({
          code: match[1],
          name: match[2].trim(),
          score: parseInt(match[3])
        });
      }
      
      // Also match simple stock patterns
      const simpleMatch = line.match(/[📈🔥🎯✅]\s*(\d{6})\s+([^\|]+)/);
      if (simpleMatch && !signals.find(s => s.code === simpleMatch[1])) {
        signals.push({
          code: simpleMatch[1],
          name: simpleMatch[2].trim(),
          score: 70
        });
      }
    }
    
    return signals.slice(0, limit);
  }

  // Section 1: Market Overview
  async getMarketOverview() {
    const output = this.runCommand('node mega_scanner.js');
    
    const stocks = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/✅\s+([^:]+):\s*¥?([0-9.]+)\s*([+-]?[0-9.]+)%/);
      if (match) {
        stocks.push({
          name: match[1].trim(),
          price: match[2],
          change: match[3]
        });
      }
    }

    const up = stocks.filter(s => parseFloat(s.change) > 0).length;
    const down = stocks.filter(s => parseFloat(s.change) < 0).length;
    
    return {
      title: '📊 今日市场概览',
      content: `监测 ${stocks.length} 只核心股票 | 上涨 ${up} 只 | 下跌 ${down} 只`,
      stocks: stocks.slice(0, 6)
    };
  }

  // Section 2: Institutional Picks
  async getInstitutionalPicks() {
    const output = this.runCommand('node institutional_scanner.js');
    
    const strongBuy = this.parseSignals(output.match(/🎯 TOP INSTITUTIONAL PICKS:([\s\S]*?)🟡/)?.[1] || '', 8);
    const buys = this.parseSignals(output.match(/🟢 INSTITUTIONAL BUYS:([\s\S]*?)🟡/)?.[1] || '', 3);
    
    return {
      title: '🏦 机构资金动向',
      strongBuy: strongBuy,
      buys: buys,
      total: strongBuy.length + buys.length
    };
  }

  // Section 3: Hidden Gems
  async getHiddenGems() {
    const output = this.runCommand('node hidden_gems_detector.js', 90);
    
    const gems = this.parseSignals(output, 10);
    
    return {
      title: '💎 隐藏金矿',
      gems: gems,
      count: gems.length
    };
  }

  // Section 4: Sector Rotation
  async getSectorRotation() {
    const output = this.runCommand('node integrated_cycling.js');
    
    // Extract sector info
    const sectors = [];
    const sectorMatch = output.match(/BEST BY EXCHANGE:([\s\S]*?)💡/);
    if (sectorMatch) {
      const lines = sectorMatch[1].split('\n');
      for (const line of lines) {
        const m = line.match(/([A-Z]+):\s*(\d+)\s+([^\(]+)/);
        if (m) {
          sectors.push({ exchange: m[1], code: m[2], name: m[3].trim() });
        }
      }
    }
    
    return {
      title: '🔄 板块轮动',
      sectors: sectors.slice(0, 6)
    };
  }

  // Section 5: Top Picks Summary
  async getTopPicks() {
    const output = this.runCommand('node integrated_cycling.js');
    
    const picks = [];
    const match = output.match(/🎯 TOP 20 STOCKS:([\s\S]*?)📊/);
    if (match) {
      const lines = match[1].split('\n');
      for (const line of lines) {
        const m = line.match(/\d+\.\s+(\d+)\s+([^\|]+)\|.*?Score:\s*(\d+)/);
        if (m) {
          picks.push({ code: m[1], name: m[2].trim(), score: parseInt(m[3]) });
        }
      }
    }
    
    return {
      title: '🎯 今日精选 TOP 10',
      picks: picks.slice(0, 10)
    };
  }

  // Generate full newsletter
  async generate() {
    console.log('📝 Generating V3 Newsletter...\n');
    
    const [market, institutional, hiddenGems, sectors, topPicks] = await Promise.all([
      this.getMarketOverview(),
      this.getInstitutionalPicks(),
      this.getHiddenGems(),
      this.getSectorRotation(),
      this.getTopPicks()
    ]);

    // Build newsletter
    let newsletter = '';
    
    // Header
    newsletter += `═══════════════════════════════════════\n`;
    newsletter += `     📊 V3 SUPER BRAIN 每日信号\n`;
    newsletter += `     ${this.date} 期\n`;
    newsletter += `═══════════════════════════════════════\n\n`;
    
    // Market Overview
    newsletter += `${market.title}\n`;
    newsletter += `${market.content}\n\n`;
    
    // Top Picks
    newsletter += `${topPicks.title}\n`;
    topPicks.picks.forEach((p, i) => {
      const emoji = p.score >= 90 ? '🚀' : p.score >= 85 ? '🔥' : '📈';
      newsletter += `${i+1}. ${emoji} ${p.code} ${p.name} (Score: ${p.score})\n`;
    });
    newsletter += '\n';
    
    // Institutional
    newsletter += `${institutional.title}\n`;
    if (institutional.strongBuy.length > 0) {
      newsletter += `🎯 强力买入 (${institutional.strongBuy.length}):\n`;
      institutional.strongBuy.slice(0, 5).forEach(s => {
        newsletter += `   ✅ ${s.code} ${s.name}\n`;
      });
    }
    if (institutional.buys.length > 0) {
      newsletter += `\n🟢 关注买入 (${institutional.buys.length}):\n`;
      institutional.buys.slice(0, 3).forEach(s => {
        newsletter += `   🟢 ${s.code} ${s.name}\n`;
      });
    }
    newsletter += '\n';
    
    // Hidden Gems
    if (hiddenGems.gems.length > 0) {
      newsletter += `${hiddenGems.title}\n`;
      hiddenGems.gems.slice(0, 5).forEach((g, i) => {
        newsletter += `${i+1}. 💎 ${g.code} ${g.name}\n`;
      });
      newsletter += '\n';
    }
    
    // Sectors
    newsletter += `${sectors.title}\n`;
    sectors.sectors.forEach(s => {
      newsletter += `   📍 ${s.exchange}: ${s.code} ${s.name}\n`;
    });
    newsletter += '\n';
    
    // Footer
    newsletter += `═══════════════════════════════════════\n`;
    newsletter += `Generated by V3 Super Brain\n`;
    newsletter += `© 2026 Super Brain Signal Service\n`;
    
    // Save to file
    const filename = `/Users/liu/Desktop/Stock_Analysis/signal_service/newsletter_${new Date().toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(filename, newsletter);
    console.log(`✅ Newsletter saved: ${filename}\n`);
    
    return {
      text: newsletter,
      html: this.toHtml(market, institutional, hiddenGems, sectors, topPicks),
      filename: filename
    };
  }

  // Convert to HTML email format
  toHtml(market, institutional, hiddenGems, sectors, topPicks) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>V3 Super Brain 每日信号 - ${this.date}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <h1 style="text-align: center; color: #1a73e8;">📊 V3 Super Brain 每日信号</h1>
  <p style="text-align: center; color: #666;">${this.date}</p>
  <hr style="border: 1px solid #eee;">
  
  <h2>${market.title}</h2>
  <p>${market.content}</p>
  <table style="width: 100%; border-collapse: collapse;">
    ${market.stocks.map(s => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">¥${s.price}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${parseFloat(s.change) > 0 ? 'green' : 'red'};">${s.change}%</td>
    </tr>`).join('')}
  </table>
  
  <h2>${topPicks.title}</h2>
  <table style="width: 100%; border-collapse: collapse;">
    ${topPicks.picks.map((p, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${i+1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.code} ${p.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.score}</td>
    </tr>`).join('')}
  </table>
  
  <h2>${institutional.title}</h2>
  <ul>
    ${institutional.strongBuy.slice(0, 5).map(s => `<li>🎯 ${s.code} ${s.name}</li>`).join('')}
  </ul>
  
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <p style="text-align: center; color: #999; font-size: 12px;">Generated by V3 Super Brain</p>
</body>
</html>`;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new NewsletterGenerator();
  generator.generate().then(result => {
    console.log('\n' + result.text);
  }).catch(console.error);
}

module.exports = NewsletterGenerator;
