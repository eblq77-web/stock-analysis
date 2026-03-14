/**
 * V3 ULTIMATE NEWSLETTER GENERATOR
 * Professional-grade institutional newsletter
 * Run: node newsletter_ultimate.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

class UltimateNewsletter {
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

  // Get ALL data sources
  async gatherData() {
    console.log('📡 Gathering data from V3 modules...\n');
    
    // Parallel execution for speed
    const [market, quantum, pro, institutional, sector, smallcap] = await Promise.all([
      this.getMarket(),
      this.getQuantum(),
      this.getPro(),
      this.getInstitutional(),
      this.getSector(),
      this.getSmallCap()
    ]);

    this.data = { market, quantum, pro, institutional, sector, smallcap };
    return this.data;
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
    return { stocks, up, down, sentiment: up > down ? 'BULL' : down > up ? 'BEAR' : 'NEUTRAL' };
  }

  getQuantum() {
    const out = this.run('node quantum_engine_v2.js', 90);
    const stocks = [];
    let current = {};
    out.split('\n').forEach(line => {
      const m = line.match(/💎\s+([0-9]{6})\s+([^\n]+)/);
      if (m) current = { code: m[1], name: m[2].trim() };
      const p = line.match(/Price:\s*¥?([0-9.]+).*?Change:\s*([+-]?[0-9.]+)%/);
      if (p && current.code) {
        stocks.push({ ...current, price: p[1], change: parseFloat(p[2]) });
        current = {};
      }
    });
    // Extract regime
    const regime = out.match(/MARKET REGIME:.*?State:\s*(\w+).*?Confidence:\s*([0-9.]+)%/s);
    return { stocks: stocks.slice(0, 10), regime: regime ? { state: regime[1], confidence: regime[2] } : null };
  }

  getPro() {
    const out = this.run('node super_brain_pro_optimizer.js', 90);
    const stocks = [];
    out.split('\n').forEach(line => {
      const m = line.match(/(\d+)\.\s+([0-9]{6})\s+([^\s¥]+)\s*¥?([0-9.]+)\s*([+-]?[0-9.]+%)?\s*Score:(\d+)/);
      if (m) stocks.push({ rank: m[1], code: m[2], name: m[3].trim(), price: m[4], change: m[5]||'0%', score: parseInt(m[6]) });
    });
    return { stocks: stocks.slice(0, 10) };
  }

  getInstitutional() {
    const out = this.run('node institutional_scanner.js');
    const strong = [], moderate = [];
    let mode = 'none';
    out.split('\n').forEach(line => {
      if (line.includes('TOP INSTITUTIONAL')) mode = 'strong';
      else if (line.includes('INSTITUTIONAL BUYS')) mode = 'moderate';
      const m = line.match(/(\d{6}|HK\d{4})\s+([^\|]+).*?Score:\s*(\d+)/);
      if (m) {
        const stock = { code: m[1], name: m[2].trim(), score: parseInt(m[3]) };
        if (mode === 'strong' && stock.score >= 90) strong.push(stock);
        else if (mode === 'moderate' && stock.score >= 60) moderate.push(stock);
      }
    });
    return { strong: strong.slice(0, 10), moderate: moderate.slice(0, 5) };
  }

  getSector() {
    const out = this.run('node integrated_cycling.js');
    const stocks = [];
    let phase = 'UNKNOWN';
    const phaseMatch = out.match(/Current Phase:\s*(\w+)/);
    if (phaseMatch) phase = phaseMatch[1];
    
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
      const m = line.match(/[📈🔥]?\s*([^\+]+)\s*\+([0-9.]+)%/);
      if (m && mode !== 'none') {
        const stock = { name: m[1].trim(), change: parseFloat(m[2]) };
        if (mode === 'hot') hot.push(stock);
        else if (mode === 'surge') surge.push(stock);
      }
    });
    return { hot: hot.slice(0, 10), surge: surge.slice(0, 5), total: hot.length + surge.length };
  }

  // Generate ASCII chart
  generateChart(stocks) {
    if (!stocks || stocks.length === 0) return '';
    const maxChange = Math.max(...stocks.map(s => Math.abs(s.change || 0)));
    const width = 30;
    let chart = '\n';
    stocks.slice(0, 8).forEach(s => {
      const change = s.change || 0;
      const barLen = Math.round((Math.abs(change) / maxChange) * width);
      const bar = change > 0 ? '█'.repeat(barLen) : '▓'.repeat(barLen);
      const arrow = change > 0 ? '📈' : '📉';
      chart += `${arrow} ${s.name.substring(0,8).padEnd(10)} ${bar.padEnd(width)} ${change > 0 ? '+' : ''}${change.toFixed(2)}%\n`;
    });
    return chart;
  }

  // Generate the ultimate newsletter
  async generate() {
    await this.gatherData();
    const d = this.data;
    const dateStr = this.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Build premium header
    let newsletter = '';
    newsletter += `████████████████████████████████████████████████████████████████████\n`;
    newsletter += `██                                                                ██\n`;
    newsletter += `██     ██████╗  ██████╗ ████████╗███████╗██╗     ███████╗           ██\n`;
    newsletter += `██     ██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██║     ██╔════╝           ██\n`;
    newsletter += `██     ██║  ██║██║   ██║   ██║   █████╗  ██║     ███████╗           ██\n`;
    newsletter += `██     ██║  ██║██║   ██║   ██║   ██╔══╝  ██║     ╚════██║           ██\n`;
    newsletter += `██     ██████╔╝╚██████╔╝   ██║   ███████╗███████╗███████║           ██\n`;
    newsletter += `██     ╚═════╝  ╚═════╝    ╀╀╚═╝  ╚══════╝╚══════╝╚══════╝           ██\n`;
    newsletter += `██                                                                ██\n`;
    newsletter += `██        V3 INSTITUTIONAL GRADE DAILY INTELLIGENCE               ██\n`;
    newsletter += `██                                                                ██\n`;
    newsletter += `████████████████████████████████████████████████████████████████████\n\n`;
    
    newsletter += `═══════════════════════════════════════════════════════════════════════\n`;
    newsletter += `                      📅 ${dateStr}  |  🕐 Generated: ${this.date.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}\n`;
    newsletter += `═══════════════════════════════════════════════════════════════════════\n\n`;

    // EXECUTIVE DASHBOARD
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃                    📊 EXECUTIVE DASHBOARD                           ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    const sentiment = d.market.sentiment;
    const sentimentIcon = sentiment === 'BULL' ? '🐂' : sentiment === 'BEAR' ? '🐻' : '⚖️';
    const sentimentColor = sentiment === 'BULL' ? '🟢' : sentiment === 'BEAR' ? '🔴' : '🟡';
    
    newsletter += `  ${sentimentIcon} MARKET: ${sentimentColor} ${sentiment}  |  `;
    newsletter += `📈 ${d.market.up} UP  `;
    newsletter += `📉 ${d.market.down} DOWN  |  `;
    newsletter += `🎯 ${d.institutional.strong.length} SIGNALS  |  `;
    newsletter += `🔥 ${d.smallcap.total} HOT\n\n`;

    // QUANTUM ENGINE ALPHA
    newsletter += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃              🧠 QUANTUM ENGINE ALPHA (AI-Predictive)                ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    
    if (d.quantum.regime) {
      newsletter += `\n  🎯 Market Regime: ${d.quantum.regime.state} (Confidence: ${d.quantum.regime.confidence}%)\n`;
    }
    
    if (d.quantum.stocks.length > 0) {
      newsletter += `\n  💎 HIGH-CONFIDENCE OPPORTUNITIES:\n`;
      newsletter += `  ┌─────────────────────────────────────────────────────────────────┐\n`;
      d.quantum.stocks.slice(0, 5).forEach((s, i) => {
        const code = (s.code || '').padEnd(8);
        const name = (s.name || '').substring(0, 12).padEnd(12);
        const price = `¥${s.price}`.padEnd(10);
        const change = `${s.change > 0 ? '+' : ''}${s.change}%`.padEnd(10);
        newsletter += `  │ ${i+1}. ${code} ${name} ${price} ${change} │\n`;
      });
      newsletter += `  └─────────────────────────────────────────────────────────────────┘\n`;
    }

    // INSTITUTIONAL FLOWS
    newsletter += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃                 🏦 INSTITUTIONAL CAPITAL FLOWS                       ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    
    newsletter += `\n  ✅ STRONG BUY SIGNALS (Score ≥90) - High Institutional Confidence:\n`;
    newsletter += `  ┌─────────────────────────────────────────────────────────────────┐\n`;
    d.institutional.strong.slice(0, 8).forEach(s => {
      const code = (s.code || '').padEnd(8);
      const name = (s.name || '').substring(0, 14).padEnd(14);
      const score = `Score: ${s.score}`.padEnd(10);
      newsletter += `  │ ✅ ${code} ${name} ${score} │\n`;
    });
    newsletter += `  └─────────────────────────────────────────────────────────────────┘\n`;

    if (d.institutional.moderate.length > 0) {
      newsletter += `\n  🟡 MODERATE SIGNALS (Score 60-89) - Building Momentum:\n  `;
      newsletter += d.institutional.moderate.map(s => `${s.code} ${s.name}`).join('  |  ') + '\n';
    }

    // SECTOR ROTATION
    newsletter += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃                    🔄 SECTOR ROTATION                               ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    
    newsletter += `\n  📍 Current Phase: ${d.sector.phase}\n`;
    newsletter += `\n  🚀 LEADING SECTORS:\n`;
    newsletter += `  ┌─────────────────────────────────────────────────────────────────┐\n`;
    d.sector.stocks.slice(0, 8).forEach((s, i) => {
      const emoji = s.score >= 90 ? '🚀' : s.score >= 85 ? '🔥' : '📈';
      const code = (s.code || '').padEnd(8);
      const name = (s.name || '').substring(0, 14).padEnd(14);
      const score = `Score: ${s.score}`.padEnd(10);
      newsletter += `  │ ${emoji} ${code} ${name} ${score} │\n`;
    });
    newsletter += `  └─────────────────────────────────────────────────────────────────┘\n`;

    // SMALL CAP HOT
    if (d.smallcap.hot.length > 0) {
      newsletter += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      newsletter += `┃                 🔥 SMALL CAP HOT MOVERS                             ┃\n`;
      newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      
      newsletter += `  ${this.generateChart(d.smallcap.hot.slice(0, 8))}`;
    }

    // TOP PICKS CONSOLIDATED
    newsletter += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃                 🎯 TODAY'S TOP PICKS (Consolidated)                 ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    
    newsletter += `\n  📋 PRO OPTIMIZER TOP 10:\n`;
    newsletter += `  ┌─────────────────────────────────────────────────────────────────┐\n`;
    d.pro.stocks.slice(0, 10).forEach(s => {
      const rank = s.rank.padEnd(3);
      const code = (s.code || '').padEnd(8);
      const name = (s.name || '').substring(0, 10).padEnd(10);
      const score = `Score: ${s.score}`.padEnd(8);
      newsletter += `  │ #${rank} ${code} ${name} ${score} │\n`;
    });
    newsletter += `  └─────────────────────────────────────────────────────────────────┘\n`;

    // ACTION ITEMS
    newsletter += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    newsletter += `┃                 ✅ TODAY'S ACTION ITEMS                             ┃\n`;
    newsletter += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    
    newsletter += `\n  🔥 HIGH CONVICTION WATCHLIST:\n`;
    const topPicks = [...d.institutional.strong.slice(0, 3), ...d.pro.stocks.slice(0, 2)];
    topPicks.forEach((s, i) => {
      newsletter += `     ${i+1}. ${s.code || s.code} ${s.name} - Score: ${s.score}\n`;
    });
    
    newsletter += `\n  ⚠️ RISK ALERT:\n`;
    newsletter += `     • Market is ${d.market.sentiment} - ${d.market.sentiment === 'BEAR' ? 'Reduce exposure' : 'Maintain discipline'}\n`;
    newsletter += `     • Current phase: ${d.sector.phase} - Adjust strategy accordingly\n`;
    newsletter += `     • Stop-loss: -7% hard stop on all positions\n`;

    // FOOTER
    newsletter += `\n`;
    newsletter += `═══════════════════════════════════════════════════════════════════════\n`;
    newsletter += `  📊 DATA SOURCES: V3 Super Brain | Quantum Engine | Institutional Scanner\n`;
    newsletter += `  🎯 METHODOLOGY: Multi-factor Alpha | Institutional Flow | Pattern Recognition\n`;
    newsletter += `  ⚠️ DISCLAIMER: For educational purposes only. Not investment advice.\n`;
    newsletter += `  © 2026 V3 INSTITUTIONAL SIGNAL SERVICE - All Rights Reserved\n`;
    newsletter += `═══════════════════════════════════════════════════════════════════════\n`;

    // Save
    const filename = `/Users/liu/Desktop/Stock_Analysis/signal_service/newsletter_ultimate_${this.date.toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(filename, newsletter);
    console.log(`✅ Ultimate Newsletter saved: ${filename}\n`);

    return {
      text: newsletter,
      stats: {
        market: d.market,
        quantum: d.quantum.stocks.length,
        institutional: d.institutional.strong.length,
        smallcap: d.smallcap.total,
        sector: d.sector.phase
      }
    };
  }
}

// Run
if (require.main === module) {
  const nl = new UltimateNewsletter();
  nl.generate().then(r => {
    console.log(r.text);
    console.log('\n📊 STATS:', r.stats);
  }).catch(console.error);
}

module.exports = UltimateNewsletter;
