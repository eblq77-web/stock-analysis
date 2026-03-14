/**
 * V3 MULTI-TIER NEWSLETTER SYSTEM
 * Complete solution for different customer segments
 * 
 * TIERS:
 * 1. FREE - Market Overview (吸引流量)
 * 2. BASIC - Standard Signals (入门订阅)
 * 3. PRO - Full Analysis with Entry/Target (核心付费)
 * 4. VIP - Everything + AI Predictions (高端客户)
 * 
 * Run: node newsletter_tiered.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

class TieredNewsletter {
  constructor() {
    this.date = new Date();
    this.data = {};
  }

  run(cmd, timeout = 90) {
    try {
      return execSync(cmd, { 
        cwd: '/Users/liu/Desktop/Stock_Analysis', 
        encoding: 'utf8', 
        timeout: timeout * 1000,
        maxBuffer: 20 * 1024 * 1024
      });
    } catch (e) { return `Error: ${e.message}`; }
  }

  // Gather all data sources
  async gatherAll() {
    console.log('📡 Gathering all V3 data sources...\n');
    
    const sources = await Promise.all([
      this.getMarket(),
      this.getQuantumDaily(),
      this.getInstitutional(),
      this.getQuantum(),
      this.getSectors(),
      this.getSmallCap(),
      this.getProPicks(),
      this.getBreakouts()
    ]);
    
    return {
      market: sources[0],
      quantumDaily: sources[1],
      institutional: sources[2],
      quantum: sources[3],
      sectors: sources[4],
      smallcap: sources[5],
      pro: sources[6],
      breakouts: sources[7]
    };
  }

  getMarket() {
    const out = this.run('node mega_scanner.js');
    const stocks = [];
    out.split('\n').forEach(line => {
      const m = line.match(/✅\s+([^:]+):\s*¥?([0-9.]+)\s*([+-]?[0-9.]+)%/);
      if (m) stocks.push({ name: m[1].trim(), price: m[2], change: parseFloat(m[3]) });
    });
    const up = stocks.filter(s => s.change > 0).length;
    const down = stocks.filter(s => s.change < 0).length;
    const avg = stocks.length ? (stocks.reduce((a,b)=>a+b.change,0)/stocks.length).toFixed(2) : 0;
    return { stocks, up, down, avg, sentiment: up > down ? 'BULLISH' : down > up ? 'BEARISH' : 'NEUTRAL' };
  }

  getQuantumDaily() {
    const out = this.run('node quantum_daily_report.js', 60);
    const signals = { buy: [], watch: [], avoid: [] };
    let mode = 'none';
    
    out.split('\n').forEach(line => {
      if (line.includes('TOP BUY')) mode = 'buy';
      else if (line.includes('Watch')) mode = 'watch';
      else if (line.includes('Avoid')) mode = 'avoid';
      
      const m = line.match(/(\d+)\.\s+([0-9]{6})\s+([^\(]+)/);
      if (m && mode === 'buy') {
        const priceMatch = line.match(/Price:\s*¥?([0-9.]+)/);
        const targetMatch = line.match(/Target.*?¥?([0-9.]+)/);
        const stopMatch = line.match(/Stop.*?¥?([0-9.]+)/);
        const signalMatch = line.match(/Signal:\s*(\w+)/);
        
        if (priceMatch) {
          signals.buy.push({
            code: m[1], name: m[2].trim(),
            price: priceMatch[1],
            target: targetMatch ? targetMatch[1] : null,
            stop: stopMatch ? stopMatch[1] : null,
            signal: signalMatch ? signalMatch[1] : 'BUY'
          });
        }
      }
    });
    return signals;
  }

  getInstitutional() {
    const out = this.run('node institutional_scanner.js');
    const strong = [], moderate = [];
    let mode = 'none';
    
    out.split('\n').forEach(line => {
      if (line.includes('TOP INSTITUTION')) mode = 'strong';
      else if (line.includes('INSTITUTION')) mode = 'moderate';
      
      const m = line.match(/(\d{6}|HK\d{4})\s+([^\|]+).*?Score:\s*(\d+)/);
      if (m) {
        const s = { code: m[1], name: m[2].trim(), score: parseInt(m[3]) };
        if (mode === 'strong' && s.score >= 90) strong.push(s);
        else if (mode === 'moderate' && s.score >= 60 && s.score < 90) moderate.push(s);
      }
    });
    return { strong: strong.slice(0, 10), moderate: moderate.slice(0, 5) };
  }

  getQuantum() {
    const out = this.run('node quantum_engine_v2.js', 90);
    const stocks = [];
    let regime = { state: 'UNKNOWN', confidence: 0 };
    
    const rm = out.match(/State:\s*(\w+).*?Confidence:\s*([0-9.]+)/s);
    if (rm) regime = { state: rm[1], confidence: rm[2] };
    
    out.split('\n').forEach(line => {
      const m = line.match(/💎\s+([0-9]{6})\s+([^\n]+)/);
      if (m) {
        const pm = line.match(/Price:\s*¥?([0-9.]+)/);
        const cm = line.match(/Change:\s*([+-]?[0-9.]+)%/);
        if (pm && cm) stocks.push({ code: m[1], name: m[2].trim(), price: pm[1], change: parseFloat(cm[1]) });
      }
    });
    return { stocks: stocks.slice(0, 8), regime };
  }

  getSectors() {
    const out = this.run('node integrated_cycling.js');
    let phase = 'UNKNOWN';
    const pm = out.match(/Current Phase:\s*(\w+)/);
    if (pm) phase = pm[1];
    
    const stocks = [];
    out.split('\n').forEach(line => {
      const m = line.match(/(\d+)\.\s+(\d+)\s+([^\|]+)\|.*?Score:\s*(\d+)/);
      if (m) stocks.push({ code: m[2], name: m[3].trim(), score: parseInt(m[4]) });
    });
    return { phase, stocks: stocks.slice(0, 10) };
  }

  getSmallCap() {
    const out = this.run('node live_smallcap_monitor.js', 30);
    const hot = [], surge = [];
    let mode = 'none';
    
    out.split('\n').forEach(line => {
      if (line.includes('HOT')) mode = 'hot';
      else if (line.includes('SURGE')) mode = 'surge';
      else mode = 'none';
      
      const m = line.match(/[📈🔥]\s*([^\+]+)\s*\+([0-9.]+)%/);
      if (m && mode !== 'none') {
        const s = { name: m[1].trim(), change: parseFloat(m[2]) };
        if (mode === 'hot') hot.push(s);
        else if (mode === 'surge') surge.push(s);
      }
    });
    return { hot: hot.slice(0, 10), surge: surge.slice(0, 5), total: hot.length + surge.length };
  }

  getProPicks() {
    const out = this.run('node super_brain_pro_optimizer.js', 90);
    const stocks = [];
    out.split('\n').forEach(line => {
      const m = line.match(/(\d+)\.\s+([0-9]{6})\s+([^\s¥]+)\s*¥?([0-9.]+)\s*([+-]?[0-9.]+%)?\s*Score:(\d+)/);
      if (m) stocks.push({ rank: m[1], code: m[2], name: m[3].trim(), price: m[4], change: m[5]||'0%', score: parseInt(m[6]) });
    });
    return { stocks: stocks.slice(0, 15) };
  }

  getBreakouts() {
    const out = this.run('node live_breakout_alert.js', 30);
    const breakouts = [];
    out.split('\n').forEach(line => {
      if (line.includes('BREAKOUT') || line.includes('🚀')) {
        const m = line.match(/([0-9]{6})\s+([^\|]+)/);
        if (m) breakouts.push({ code: m[1], name: m[2].trim() });
      }
    });
    return { list: breakouts.slice(0, 8) };
  }

  // Generate tier-specific newsletters
  async generateAll() {
    this.data = await this.gatherAll();
    
    return {
      free: this.generateFree(),
      basic: this.generateBasic(),
      pro: this.generatePro(),
      vip: this.generateVIP()
    };
  }

  // ==================== TIER 1: FREE ====================
  generateFree() {
    const d = this.data;
    const dateStr = this.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    return {
      name: 'V3 Daily Digest',
      price: 'FREE',
      tagline: 'Free daily market overview',
      
      sections: [
        {
          title: '📊 Market Snapshot',
          content: `Market is ${d.market.sentiment} | ${d.market.up} up / ${d.market.down} down | Avg: ${d.market.avg}%`
        },
        {
          title: '🎯 Top 3 Picks',
          content: d.institutional.strong.slice(0, 3).map((s, i) => `${i+1}. ${s.code} ${s.name}`).join('\n')
        },
        {
          title: '🔥 Hot Stocks',
          content: d.smallcap.hot.slice(0, 5).map(s => s.name).join(', ')
        }
      ]
    };
  }

  // ==================== TIER 2: BASIC ====================
  generateBasic() {
    const d = this.data;
    
    return {
      name: 'V3 Basic',
      price: '¥99/month',
      tagline: 'Daily signals & institutional flows',
      
      sections: [
        {
          title: '👁️ At a Glance',
          content: `Market: ${d.market.sentiment} | Signals: ${d.institutional.strong.length} Strong | Hot: ${d.smallcap.total}`
        },
        {
          title: '🎯 Top Picks (Score ≥90)',
          content: d.institutional.strong.map(s => `✅ ${s.code} ${s.name} - Score: ${s.score}`).join('\n')
        },
        {
          title: '🏦 Institutional Flows',
          content: `Strong: ${d.institutional.strong.length} | Moderate: ${d.institutional.moderate.length}`
        },
        {
          title: '🔄 Sector Rotation',
          content: `Phase: ${d.sectors.phase}\n` + d.sectors.stocks.slice(0, 5).map(s => `${s.code} ${s.name}`).join('\n')
        }
      ]
    };
  }

  // ==================== TIER 3: PRO ====================
  generatePro() {
    const d = this.data;
    
    return {
      name: 'V3 Pro',
      price: '¥299/month',
      tagline: 'Full analysis with entry/target/stop loss',
      
      sections: [
        {
          title: '📊 Executive Dashboard',
          content: `Market: ${d.market.sentiment} | Regime: ${d.quantum.regime.state} (${d.quantum.regime.confidence}%) | Signals: ${d.quantumDaily.buy.length}`
        },
        {
          title: '🎯 BUY SIGNALS (Entry → Target → Stop)',
          content: d.quantumDaily.buy.slice(0, 8).map(s => 
            `${s.code} ${s.name}\n  Entry: ¥${s.price} → Target: ¥${s.target || 'TBD'} → Stop: ¥${s.stop || 'TBD'}\n  Signal: ${s.signal}`
          ).join('\n\n')
        },
        {
          title: '🏦 Institutional Accumulation',
          content: d.institutional.strong.map(s => `✅ ${s.code} ${s.name} (Score: ${s.score})`).join('\n')
        },
        {
          title: '🔄 Sector Leaders',
          content: d.sectors.stocks.slice(0, 8).map(s => `${s.score >= 90 ? '🚀' : '📈'} ${s.code} ${s.name} - Score: ${s.score}`).join('\n')
        },
        {
          title: '🚀 Breakout Alerts',
          content: d.breakouts.list.length > 0 ? d.breakouts.list.map(b => `🚀 ${b.code} ${b.name}`).join('\n') : 'No breakouts today'
        },
        {
          title: '⚠️ Risk Management',
          content: 'Stop Loss: -7% | Max Position: 20% | Take Profit: +10% partial'
        }
      ]
    };
  }

  // ==================== TIER 4: VIP ====================
  generateVIP() {
    const d = this.data;
    
    return {
      name: 'V3 VIP',
      price: '¥699/month',
      tagline: 'Everything + AI predictions + 1-on-1',
      
      sections: [
        {
          title: '🧠 QUANTUM AI PREDICTIONS',
          content: `Market Regime: ${d.quantum.regime.state} (Confidence: ${d.quantum.regime.confidence}%)\n\n` +
            'Top AI-Detected Opportunities:\n' +
            d.quantum.stocks.slice(0, 5).map(s => 
              `💎 ${s.code} ${s.name}\n   Price: ¥${s.price} | Change: +${s.change}%`
            ).join('\n\n')
        },
        {
          title: '🎯 PRO SIGNALS (Full Trade Plan)',
          content: d.quantumDaily.buy.slice(0, 10).map(s => 
            `━━━━━━━━━━━━━━━━━━━━\n🎯 ${s.code} ${s.name}\n💰 Entry: ¥${s.price}\n🎯 Target: ¥${s.target || 'N/A'} (+15%)\n🛡️ Stop: ¥${s.stop || 'N/A'} (-7%)\n📊 Signal: ${s.signal}\n💎 Conviction: HIGH`
          ).join('\n')
        },
        {
          title: '🏦 INSTITUTIONAL TRACKING',
          content: `🔍 Tracking ${d.institutional.strong.length} institutions\n\n` +
            d.institutional.strong.map(s => `✅ ${s.code} ${s.name} - Score: ${s.score}`).join('\n') +
            '\n\n🟡 Building Position:\n' +
            d.institutional.moderate.map(s => `🟢 ${s.code} ${s.name} - Score: ${s.score}`).join('\n')
        },
        {
          title: '🔄 SECTOR ROTATION & PHASE',
          content: `📍 Current Phase: ${d.sectors.phase}\n\nTop Sector Leaders:\n` +
            d.sectors.stocks.slice(0, 10).map(s => `${s.score >= 90 ? '🚀' : '📈'} ${s.code} ${s.name} (${s.score})`).join('\n')
        },
        {
          title: '🚀 SMALL CAP ALPHA',
          content: `🔥 ${d.smallcap.total} Hot Stocks Detected\n\n` +
            'Top Movers:\n' +
            d.smallcap.hot.slice(0, 8).map(s => `${s.change >= 50 ? '💎' : '🔥'} ${s.name} +${s.change}%`).join('\n')
        },
        {
          title: '🎯 TODAY\'S ACTION PLAN',
          content: `━━━━━━━━━━━━━━━━━━━━\n🟢 OPPORTUNITIES:\n` +
            d.quantumDaily.buy.slice(0, 3).map((s, i) => `${i+1}. ${s.code} ${s.name} - Target: ¥${s.target}`).join('\n') +
            `\n\n🔴 RISK ALERTS:\n` +
            `• Market: ${d.market.sentiment}\n` +
            `• Stop Loss: -7% HARD\n` +
            `• Max Position: 20%\n` +
            `• Phase: ${d.sectors.phase} - Adjust accordingly`
        },
        {
          title: '💎 EXCLUSIVE: VIP BENEFITS',
          content: `✓ Weekly 1-on-1 portfolio review\n✓ Priority signals (30 min early access)\n✓ Custom scan requests\n✓ Direct chat support`
        }
      ]
    };
  }

  // Save all tiers
  async save() {
    const result = await this.generateAll();
    
    const datePrefix = this.date.toISOString().split('T')[0];
    const basePath = `/Users/liu/Desktop/Stock_Analysis/signal_service`;
    
    // Save each tier
    Object.keys(result).forEach(tier => {
      const filename = `${basePath}/newsletter_${tier}_${datePrefix}.txt`;
      let content = this.formatText(result[tier]);
      fs.writeFileSync(filename, content);
      console.log(`✅ Saved: ${filename}`);
    });
    
    // Generate HTML version (Pro tier as default)
    const html = this.generateHTML(result.pro);
    fs.writeFileSync(`${basePath}/newsletter_${datePrefix}.html`, html);
    console.log(`✅ Saved HTML: ${basePath}/newsletter_${datePrefix}.html`);
    
    return result;
  }

  formatText(tier) {
    let txt = '';
    const dateStr = this.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    txt += `═══════════════════════════════════════════════════════════════\n`;
    txt += `        📈 ${tier.name.toUpperCase()} 📈\n`;
    txt += `        ${tier.tagline}\n`;
    txt += `═══════════════════════════════════════════════════════════════\n`;
    txt += `📅 ${dateStr}\n\n`;
    
    tier.sections.forEach(section => {
      txt += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      txt += `┃ ${section.title}\n`;
      txt += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      txt += `${section.content}\n\n`;
    });
    
    return txt;
  }

  generateHTML(tier) {
    const dateStr = this.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const tierLC = tier.name.toLowerCase().replace(' ', '-');
    
    let sectionsHTML = '';
    tier.sections.forEach(s => {
      sectionsHTML += `
      <div class="section">
        <div class="section-title">${s.title}</div>
        <div class="section-content">
          <pre>${s.content}</pre>
        </div>
      </div>`;
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tier.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #e6edf3; max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f6feb, #388bfd); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .tagline { opacity: 0.9; font-size: 14px; }
    .tier-badge { display: inline-block; background: #238636; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .date { text-align: center; color: #8b949e; margin-bottom: 20px; }
    .section { background: #161b22; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #30363d; }
    .section-title { font-size: 16px; font-weight: 600; color: #58a6ff; margin-bottom: 12px; }
    .section-content { font-size: 14px; line-height: 1.7; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📈 ${tier.name}</h1>
    <div class="tagline">${tier.tagline}</div>
    <div class="tier-badge">${tier.price}</div>
  </div>
  <div class="date">📅 ${dateStr}</div>
  ${sectionsHTML}
</body>
</html>`;
  }
}

// Run
if (require.main === module) {
  const nl = new TieredNewsletter();
  nl.save().then(result => {
    console.log('\n📊 All Tiers Generated!');
    console.log('FREE:', result.free.sections.length, 'sections');
    console.log('BASIC:', result.basic.sections.length, 'sections');
    console.log('PRO:', result.pro.sections.length, 'sections');
    console.log('VIP:', result.vip.sections.length, 'sections');
  }).catch(console.error);
}

module.exports = TieredNewsletter;
