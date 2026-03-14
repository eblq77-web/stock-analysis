/**
 * V3 PREMIUM NEWSLETTER GENERATOR
 * Institutional-grade daily intelligence report
 * Inspired by top financial newsletters (Morning Brew, etc.)
 * Run: node newsletter_premium.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

class PremiumNewsletter {
  constructor() {
    this.date = new Date();
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };
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

  // Get all data sources
  async gatherAll() {
    console.log('🔄 Gathering V3 data sources...\n');
    
    const sources = await Promise.all([
      this.getMarket(),
      this.getQuantum(),
      this.getInstitutional(),
      this.getSectors(),
      this.getSmallCap(),
      this.getProPicks()
    ]);
    
    return {
      market: sources[0],
      quantum: sources[1],
      institutional: sources[2],
      sectors: sources[3],
      smallcap: sources[4],
      pro: sources[5]
    };
  }

  getMarket() {
    const out = this.run('node mega_scanner.js');
    const stocks = [];
    let header = 'Market Overview';
    out.split('\n').forEach(line => {
      const m = line.match(/✅\s+([^:]+):\s*¥?([0-9.]+)\s*([+-]?[0-9.]+)%/);
      if (m) stocks.push({ name: m[1].trim(), price: m[2], change: parseFloat(m[3]) });
    });
    
    const avg = stocks.length ? (stocks.reduce((a,b)=>a+b.change,0)/stocks.length).toFixed(2) : 0;
    const up = stocks.filter(s => s.change > 0).length;
    const down = stocks.filter(s => s.change < 0).length;
    
    return { stocks, avg, up, down, sentiment: up > down ? 'BULLISH' : down > up ? 'BEARISH' : 'NEUTRAL' };
  }

  getQuantum() {
    const out = this.run('node quantum_engine_v2.js', 90);
    const stocks = [];
    let regime = { state: 'UNKNOWN', confidence: 0 };
    
    const regimeMatch = out.match(/State:\s*(\w+).*?Confidence:\s*([0-9.]+)/s);
    if (regimeMatch) regime = { state: regimeMatch[1], confidence: regimeMatch[2] };
    
    out.split('\n').forEach(line => {
      const m = line.match(/💎\s+([0-9]{6})\s+([^\n]+)/);
      if (m) {
        const name = m[2].trim();
        const priceMatch = line.match(/Price:\s*¥?([0-9.]+)/);
        const changeMatch = line.match(/Change:\s*([+-]?[0-9.]+)%/);
        if (priceMatch && changeMatch) {
          stocks.push({ code: m[1], name, price: priceMatch[1], change: parseFloat(changeMatch[1]) });
        }
      }
    });
    return { stocks: stocks.slice(0, 8), regime };
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

  getSectors() {
    const out = this.run('node integrated_cycling.js');
    let phase = 'UNKNOWN';
    const phaseMatch = out.match(/Current Phase:\s*(\w+)/);
    if (phaseMatch) phase = phaseMatch[1];
    
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

  // Create bar chart
  barChart(data, width = 25) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data.map(d => Math.abs(d.change)));
    return data.slice(0, 8).map(d => {
      const len = Math.round((Math.abs(d.change) / max) * width);
      const bar = '█'.repeat(len);
      const arrow = d.change > 0 ? '↑' : '↓';
      return `${d.name.substring(0,8).padEnd(10)} ${bar.padEnd(width)} ${d.change > 0 ? '+' : ''}${d.change.toFixed(1)}%${arrow}`;
    }).join('\n');
  }

  // Generate the premium newsletter
  async generate() {
    const data = await this.gatherAll();
    const d = this.date;
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    let nl = '';
    
    // ═════════════════════════════════════════════════════════════════════
    // PREMIUM HEADER
    // ═════════════════════════════════════════════════════════════════════
    nl += `
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║     ██████╗ ██████╗ ██╗   ██╗██╗   ██╗███████╗    ███████╗ █████╗  ██████╗ ║
║     ██╔══██╗██╔══██╗╚██╗ ██╔╝██║   ██║██╔════╝    ██╔════╝██╔══██╗██╔═══██║║
║     ██║  ██║██████╔╝ ╚████╔╝ ██║   ██║█████╗      █████╗  ███████║██║   ██║║
║     ██║  ██║██╔══██╗  ╚██╔╝  ██║   ██║██╔══╝      ██╔══╝  ██╔══██║██║   ██║║
║     ██████╔╝██║  ██║   ██║   ╚██████╔╝███████╗    ██║     ██║  ██║╚██████╔╝║
║     ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ║
║                                                                            ║
║              📈 V3 INSTITUTIONAL DAILY INTELLIGENCE 📈                   ║
║                                                                            ║
║                        The Daily Edge You Need                            ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

`;
    nl += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    nl += `  📅 ${dateStr}  |  🕐 ${timeStr} (Shanghai Time)  |  Vol. ${d.getDate()}\n`;
    nl += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ═════════════════════════════════════════════════════════════════════
    // AT A GLANCE
    // ═════════════════════════════════════════════════════════════════════
    const sentIcon = data.market.sentiment === 'BULLISH' ? '🐂' : data.market.sentiment === 'BEARISH' ? '🐻' : '⚖️';
    const sentColor = data.market.sentiment === 'BULLISH' ? '🟢' : data.market.sentiment === 'BEARISH' ? '🔴' : '🟡';
    
    nl += `┌──────────────────────────────────────────────────────────────────────────────┐\n`;
    nl += `│                           👁️ AT A GLANCE                                     │\n`;
    nl += `├──────────────────────────────────────────────────────────────────────────────┤\n`;
    nl += `│  ${sentIcon} MARKET: ${sentColor} ${data.market.sentiment}`.padEnd(62) + `│\n`;
    nl += `│  📊 Index Movement: ${data.market.up} UP / ${data.market.down} DOWN`.padEnd(52) + `│\n`;
    nl += `│  📈 Avg Change: ${data.market.avg > 0 ? '+' : ''}${data.market.avg}%`.padEnd(58) + `│\n`;
    nl += `│  🎯 Institutional Signals: ${data.institutional.strong.length} Strong Buys`.padEnd(48) + `│\n`;
    nl += `│  🔥 Small Cap Momentum: ${data.smallcap.total} Hot Stocks`.padEnd(52) + `│\n`;
    nl += `│  🧠 Quantum Regime: ${data.quantum.regime.state} (${data.quantum.regime.confidence}% Conf.)`.padEnd(47) + `│\n`;
    nl += `└──────────────────────────────────────────────────────────────────────────────┘\n\n`;

    // ═════════════════════════════════════════════════════════════════════
    // THE DAILY BRIEF
    // ═════════════════════════════════════════════════════════════════════
    nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    nl += `┃                        📋 THE DAILY BRIEF                                     ┃\n`;
    nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    nl += `  Good ${this.getTimeOfDay()}! Here's your institutional-grade market intelligence:\n\n`;
    
    nl += `  📌 KEY TAKEAWAYS:\n`;
    nl += `  ─────────────────────────────────────────────────────────────────────────────\n`;
    nl += `  • Market sentiment is ${data.market.sentiment} with ${data.market.up} advancing vs ${data.market.down} declining stocks\n`;
    nl += `  • Quantum Engine shows ${data.quantum.regime.state} regime with ${data.quantum.regime.confidence}% confidence\n`;
    nl += `  • ${data.institutional.strong.length} stocks showing strong institutional accumulation\n`;
    nl += `  • Small caps leading with ${data.smallcap.total} stocks in hot momentum\n\n`;

    // ═════════════════════════════════════════════════════════════════════
    // TOP PICKS
    // ═════════════════════════════════════════════════════════════════════
    nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    nl += `┃                        🎯 TOP PICKS                                          ┃\n`;
    nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    nl += `  HIGH-CONFIDENCE INSTITUTIONAL SETUPS:\n`;
    nl += `  ┌────┬──────────┬─────────────────┬──────────┬────────────┐\n`;
    nl += `  │ #  │ CODE     │ NAME            │ SCORE    │ CONVICTION │\n`;
    nl += `  ├────┼──────────┼─────────────────┼──────────┼────────────┤\n`;
    
    const allPicks = [...data.institutional.strong.slice(0, 5), ...data.pro.stocks.slice(0, 5)];
    allPicks.slice(0, 8).forEach((s, i) => {
      const code = (s.code || '').padEnd(10);
      const name = (s.name || '').substring(0, 15).padEnd(15);
      const score = (s.score || '').toString().padEnd(10);
      const conviction = s.score >= 90 ? '🔥 HIGH' : s.score >= 70 ? '🟡 MEDIUM' : '🟢 LOW';
      nl += `  │ ${(i+1).toString().padEnd(2)} │ ${code} │ ${name} │ ${score} │ ${conviction} │\n`;
    });
    nl += `  └────┴──────────┴─────────────────┴──────────┴────────────┘\n\n`;

    // ═════════════════════════════════════════════════════════════════════
    // INSTITUTIONAL FLOW
    // ═════════════════════════════════════════════════════════════════════
    nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    nl += `┃                     🏦 INSTITUTIONAL ACTIVITY                                ┃\n`;
    nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    nl += `  WHERE SMART MONEY IS PUTTING CAPITAL TO WORK:\n\n`;
    
    nl += `  ✅ STRONG ACCUMULATION (Score 90-100):\n  `;
    nl += data.institutional.strong.slice(0, 6).map(s => `${s.code} ${s.name}`).join('  |  ') + '\n\n';
    
    if (data.institutional.moderate.length > 0) {
      nl += `  🟡 BUILDING POSITION (Score 60-89):\n  `;
      nl += data.institutional.moderate.slice(0, 4).map(s => `${s.code} ${s.name}`).join('  |  ') + '\n\n';
    }

    // ═════════════════════════════════════════════════════════════════════
    // QUANTUM ALPHA
    // ═════════════════════════════════════════════════════════════════════
    if (data.quantum.stocks.length > 0) {
      nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      nl += `┃                   🧠 QUANTUM ALPHA SIGNALS                                 ┃\n`;
      nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      
      nl += `  AI-DETECTED HIGH PROBABILITY SETUPS:\n`;
      nl += `  ┌────┬──────────┬─────────────────┬──────────┬────────────┐\n`;
      nl += `  │ #  │ CODE     │ NAME            │ PRICE    │ CHANGE     │\n`;
      nl += `  ├────┼──────────┼─────────────────┼──────────┼────────────┤\n`;
      
      data.quantum.stocks.slice(0, 6).forEach((s, i) => {
        const code = (s.code || '').padEnd(10);
        const name = (s.name || '').substring(0, 15).padEnd(15);
        const price = `¥${s.price}`.padEnd(10);
        const change = `${s.change > 0 ? '+' : ''}${s.change.toFixed(1)}%`.padEnd(10);
        nl += `  │ ${(i+1).toString().padEnd(2)} │ ${code} │ ${name} │ ${price} │ ${change} │\n`;
      });
      nl += `  └────┴──────────┴─────────────────┴──────────┴────────────┘\n\n`;
    }

    // ═════════════════════════════════════════════════════════════════════
    // SECTOR ROTATION
    // ═════════════════════════════════════════════════════════════════════
    nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    nl += `┃                      🔄 SECTOR ROTATION                                     ┃\n`;
    nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    nl += `  MARKET PHASE: 📍 ${data.sectors.phase}\n\n`;
    nl += `  LEADING SECTORS BY STRENGTH:\n`;
    nl += `  ┌────┬──────────┬─────────────────┬──────────┐\n`;
    nl += `  │ #  │ CODE     │ NAME            │ SCORE    │\n`;
    nl += `  ├────┼──────────┼─────────────────┼──────────┤\n`;
    
    data.sectors.stocks.slice(0, 6).forEach((s, i) => {
      const emoji = s.score >= 90 ? '🔥' : '📈';
      const code = (s.code || '').padEnd(10);
      const name = (s.name || '').substring(0, 15).padEnd(15);
      const score = s.score.toString().padEnd(8);
      nl += `  │ ${(i+1).toString().padEnd(2)} │ ${code} │ ${emoji} ${name} │ ${score} │\n`;
    });
    nl += `  └────┴──────────┴─────────────────┴──────────┘\n\n`;

    // ═════════════════════════════════════════════════════════════════════
    // SMALL CAP MOVERS
    // ═════════════════════════════════════════════════════════════════════
    if (data.smallcap.hot.length > 0) {
      nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      nl += `┃                    🚀 SMALL CAP MOMENTUM                                   ┃\n`;
      nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      
      nl += `  TOP MOVERS:\n`;
      nl += `  ${this.barChart(data.smallcap.hot)}\n\n`;
    }

    // ═════════════════════════════════════════════════════════════════════
    // ACTION ITEMS
    // ═════════════════════════════════════════════════════════════════════
    nl += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    nl += `┃                    ✅ TODAY'S ACTION ITEMS                                   ┃\n`;
    nl += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    nl += `  🔴 RISK MANAGEMENT:\n`;
    nl += `  ─────────────────────────────────────────────────────────────────────────────\n`;
    nl += `  • Current Market: ${data.market.sentiment} - ${data.market.sentiment === 'BEARISH' ? 'Consider reducing exposure' : 'Maintain discipline'}\n`;
    nl += `  • Hard Stop Loss: -7% on all positions\n`;
    nl += `  • Position Sizing: Max 20% per stock\n`;
    nl += `  • Take Profit: Consider partial at +10%\n\n`;
    
    nl += `  🟢 OPPORTUNITIES:\n`;
    nl += `  ─────────────────────────────────────────────────────────────────────────────\n`;
    data.institutional.strong.slice(0, 3).forEach((s, i) => {
      nl += `  ${i+1}. ${s.code} ${s.name} - Score: ${s.score} (Institutional Accumulation)\n`;
    });
    nl += '\n';

    // ═════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═════════════════════════════════════════════════════════════════════
    nl += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    nl += `                                                                                  \n`;
    nl += `  📊 METHODOLOGY                                                                \n`;
    nl += `  ─────────────────────────────────────────────────────────────────────────────  \n`;
    nl += `  Our analysis combines multiple institutional-grade indicators:                \n`;
    nl += `  • Quantum Pattern Recognition Engine                                          \n`;
    nl += `  • Institutional Capital Flow Analysis                                         \n`;
    nl += `  • Multi-Factor Alpha Scoring                                                  \n`;
    nl += `  • Sector Rotation & Market Phase Detection                                    \n`;
    nl += `                                                                                  \n`;
    nl += `  ⚠️ DISCLAIMER                                                                 \n`;
    nl += `  ─────────────────────────────────────────────────────────────────────────────  \n`;
    nl += `  This newsletter is for educational purposes only. Not investment advice.     \n`;
    nl += `  Always do your own due diligence before making any investment decisions.     \n`;
    nl += `                                                                                  \n`;
    nl += `  © 2026 V3 INSTITUTIONAL SIGNAL SERVICE - All Rights Reserved                 \n`;
    nl += `  📧 Contact: [Your Email] | 📱 @[Your Channel]                                  \n`;
    nl += `                                                                                  \n`;
    nl += `  You received this because you subscribed to V3 Daily Intelligence.            \n`;
    nl += `  To unsubscribe, click [Unsubscribe]                                          \n`;
    nl += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // Save
    const filename = `/Users/liu/Desktop/Stock_Analysis/signal_service/newsletter_premium_${this.date.toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(filename, nl);
    console.log(`✅ Premium Newsletter saved: ${filename}\n`);

    return { text: nl, data };
  }

  getTimeOfDay() {
    const h = this.date.getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }
}

// Run
if (require.main === module) {
  const nl = new PremiumNewsletter();
  nl.generate().then(r => {
    console.log(r.text);
  }).catch(console.error);
}

module.exports = PremiumNewsletter;
