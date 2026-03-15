#!/usr/bin/env node
/**
 * Daily Automation Generator
 * Fetches data, fills templates, prepares for delivery
 * 
 * Usage: node daily_automation.js [mode]
 * Modes: daily | weekly | signal
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const TEMPLATES_FILE = path.join(BASE_DIR, 'automation', 'templates.json');
const OUTPUT_DIR = path.join(BASE_DIR, 'automation', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load templates
const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8')).templates;

/**
 * Fetch current portfolio data
 */
async function getPortfolio() {
  try {
    const portfolio = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'portfolio.json'), 'utf8'));
    const tracking = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'daily_tracking.json'), 'utf8'));
    
    // Get live prices for portfolio stocks
    const codes = portfolio.map(p => {
      if (p.code.startsWith('sh') || p.code.startsWith('sz')) return p.code;
      return p.code.startsWith('6') ? 'sh' + p.code : 'sz' + p.code;
    });
    
    if (codes.length === 0) return { holdings: [], cash: 500000, totalValue: 0 };
    
    // Fetch prices from Sina
    const url = `http://qt.gtimg.cn/q=${codes.join(',')}`;
    const response = await fetch(url);
    const text = await response.text();
    
    const prices = {};
    const lines = text.split(';').filter(l => l.trim());
    
    lines.forEach((line, i) => {
      const match = line.match(/v_"([^"]+)"/);
      if (match && codes[i]) {
        const parts = match[1].split('~');
        prices[codes[i]] = parseFloat(parts[1]) || 0; // Current price
      }
    });
    
    let totalValue = 0;
    const holdings = portfolio.map(p => {
      const code = p.code.startsWith('sh') || p.code.startsWith('sz') ? p.code : 
                   (p.code.startsWith('6') ? 'sh' + p.code : 'sz' + p.code);
      const price = prices[code] || p.avgPrice;
      const value = price * p.shares;
      totalValue += value;
      
      return {
        ...p,
        currentPrice: price,
        value: value,
        pnl: ((price - p.avgPrice) / p.avgPrice * 100).toFixed(2)
      };
    });
    
    return {
      holdings,
      cash: 500000, // From memory
      totalValue: totalValue + 500000
    };
    
  } catch (e) {
    console.error('Portfolio error:', e.message);
    return { holdings: [], cash: 500000, totalValue: 0 };
  }
}

/**
 * Get today's signals from tracking
 */
async function getTodaySignals() {
  try {
    const tracking = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'daily_tracking.json'), 'utf8'));
    
    const signals = [];
    for (const [code, data] of Object.entries(tracking)) {
      if (code === 'today_picks' || code === 'test_name' || code === 'start_date' || code === 'end_date' || code === 'rules') continue;
      
      signals.push({
        code,
        name: data.name,
        sector: data.sector,
        reason: data.reason,
        target: data.target,
        stopLoss: data.stopLoss
      });
    }
    
    return signals.slice(0, 5); // Top 5
    
  } catch (e) {
    console.error('Signals error:', e.message);
    return [];
  }
}

/**
 * Get market overview data
 */
async function getMarketOverview() {
  try {
    // Fetch major indices
    const indices = ['sh000001', 'sz399001', 'sh000300']; // Shanghai, Shenzhen, CSI300
    const url = `http://qt.gtimg.cn/q=${indices.join(',')}`;
    const response = await fetch(url);
    const text = await response.text();
    
    const market = {};
    const lines = text.split(';').filter(l => l.trim());
    
    lines.forEach((line, i) => {
      const match = line.match(/v_"([^"]+)"/);
      if (match) {
        const parts = match[1].split('~');
        const name = parts[0];
        const price = parseFloat(parts[1]) || 0;
        const change = parseFloat(parts[2]) || 0;
        market[indices[i]] = { name, price, change };
      }
    });
    
    return market;
    
  } catch (e) {
    console.error('Market overview error:', e.message);
    return {};
  }
}

/**
 * Fill template with data
 */
function fillTemplate(template, data) {
  let filled = template;
  for (const [key, value] of Object.entries(data)) {
    filled = filled.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return filled;
}

/**
 * Generate daily report
 */
async function generateDailyReport() {
  console.log('📊 Generating Daily Report...\n');
  
  const today = new Date().toISOString().split('T')[0];
  const portfolio = await getPortfolio();
  const signals = await getTodaySignals();
  const market = await getMarketOverview();
  
  let report = `# 📊 Daily Report - ${today}\n\n`;
  
  // Market Overview
  report += `## 🌊 Market Overview\n`;
  for (const [key, data] of Object.entries(market)) {
    const changeSign = data.change >= 0 ? '+' : '';
    report += `- **${data.name}**: ${data.price.toFixed(2)} (${changeSign}${data.change.toFixed(2)}%)\n`;
  }
  report += '\n';
  
  // Today's Signals
  report += `## 🎯 Today's Signals\n`;
  if (signals.length > 0) {
    signals.forEach(s => {
      report += `### ${s.name} (${s.code})\n`;
      report += `- 🏷️ ${s.sector}\n`;
      report += `- 📝 ${s.reason}\n`;
      report += `- 🎯 Target: ¥${s.target}\n`;
      report += `- 🛡️ Stop: ¥${s.stopLoss}\n\n`;
    });
  } else {
    report += '_No new signals today_\n\n';
  }
  
  // Portfolio
  report += `## 📦 Portfolio\n`;
  report += `- 💵 Cash: ¥${portfolio.cash.toLocaleString()}\n`;
  report += `- 📊 Total Value: ¥${portfolio.totalValue.toLocaleString()}\n`;
  report += `- 📈 Holdings: ${portfolio.holdings.length} stocks\n\n`;
  
  if (portfolio.holdings.length > 0) {
    report += `| Stock | Shares | Avg Price | Current | P&L |\n`;
    report += `|-------|--------|-----------|---------|-----|\n`;
    portfolio.holdings.forEach(h => {
      const pnlSign = parseFloat(h.pnl) >= 0 ? '+' : '';
      report += `| ${h.name} | ${h.shares} | ¥${h.avgPrice} | ¥${h.currentPrice.toFixed(2)} | ${pnlSign}${h.pnl}% |\n`;
    });
  }
  
  // Save report
  const reportFile = path.join(OUTPUT_DIR, `daily_${today}.md`);
  fs.writeFileSync(reportFile, report);
  console.log(`✅ Report saved: ${reportFile}`);
  
  // Also save JSON for other uses
  const jsonFile = path.join(OUTPUT_DIR, `daily_${today}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify({
    date: today,
    market,
    signals,
    portfolio
  }, null, 2));
  console.log(`✅ JSON saved: ${jsonFile}`);
  
  return report;
}

/**
 * Generate signal alert for a specific stock
 */
async function generateSignalAlert(stockCode) {
  console.log(`🎯 Generating Signal Alert for ${stockCode}...\n`);
  
  const signals = await getTodaySignals();
  const signal = signals.find(s => s.code === stockCode || s.code.includes(stockCode));
  
  if (!signal) {
    console.log(`⚠️ No signal found for ${stockCode}`);
    return null;
  }
  
  const template = templates.daily_signal.content;
  const filled = fillTemplate(template, {
    stock_name: signal.name,
    stock_code: signal.code,
    entry_price: '0.00', // Would need live price
    target_price: signal.target,
    stop_loss: signal.stopLoss,
    signal_reason: signal.reason,
    disclaimer: '此信号仅供参考，不构成投资建议。'
  });
  
  return filled;
}

// Main
const mode = process.argv[2] || 'daily';

if (mode === 'daily') {
  generateDailyReport().then(report => {
    console.log('\n' + '='.repeat(50));
    console.log(report);
  });
} else if (mode === 'signal' && process.argv[3]) {
  generateSignalAlert(process.argv[3]).then(alert => {
    if (alert) console.log(alert);
  });
} else {
  console.log('Usage: node daily_automation.js [daily|signal <code>]');
}
