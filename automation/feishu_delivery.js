#!/usr/bin/env node
/**
 * Feishu Delivery Module
 * Sends reports to Feishu groups
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

/**
 * Load config
 */
function loadConfig() {
  try {
    const configPath = path.join(BASE_DIR, 'automation', 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Config load error:', e.message);
  }
  return null;
}

/**
 * Get latest daily report
 */
function getLatestReport() {
  const outputDir = path.join(BASE_DIR, 'automation', 'output');
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('daily_') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    const data = fs.readFileSync(path.join(outputDir, files[0]), 'utf8');
    return JSON.parse(data);
  }
  return null;
}

/**
 * Format report for Feishu
 */
function formatFeishuMessage(report) {
  const { date, market, signals, portfolio } = report;
  
  let message = `📊 **每日交易报告** - ${date}\n\n`;
  
  // Market Overview
  message += `🌊 **市场概况**\n`;
  for (const [key, data] of Object.entries(market)) {
    const changeSign = data.change >= 0 ? '+' : '';
    message += `• ${data.name}: ${data.price.toFixed(2)} (${changeSign}${data.change.toFixed(2)}%)\n`;
  }
  message += '\n';
  
  // Signals
  message += `🎯 **今日信号**\n`;
  if (signals && signals.length > 0) {
    signals.slice(0, 3).forEach(s => {
      message += `• ${s.name} (${s.code}) - ${s.sector}\n`;
      message += `  目标: ¥${s.target} | 止损: ¥${s.stopLoss}\n`;
    });
  } else {
    message += `• 暂无新信号\n`;
  }
  message += '\n';
  
  // Portfolio
  message += `📦 **持仓情况**\n`;
  message += `• 现金: ¥${portfolio.cash.toLocaleString()}\n`;
  message += `• 总市值: ¥${portfolio.totalValue.toLocaleString()}\n`;
  message += `• 持仓: ${portfolio.holdings.length}只股票\n`;
  
  if (portfolio.holdings && portfolio.holdings.length > 0) {
    message += '\n**持仓明细**\n';
    portfolio.holdings.forEach(h => {
      const pnlSign = parseFloat(h.pnl) >= 0 ? '+' : '';
      message += `• ${h.name}: ${pnlSign}${h.pnl}%\n`;
    });
  }
  
  message += '\n---\n';
  message += `_此报告由Super Brain自动生成_`;
  
  return message;
}

/**
 * Send to Feishu (using OpenClaw message tool in automation context)
 * This outputs the formatted message for the cron job to pick up
 */
async function sendToFeishu() {
  const report = getLatestReport();
  
  if (!report) {
    console.log('⚠️ No report found to send');
    return false;
  }
  
  const message = formatFeishuMessage(report);
  
  // Save formatted message for delivery
  const outputPath = path.join(BASE_DIR, 'automation', 'output', 'feishu_message.txt');
  fs.writeFileSync(outputPath, message);
  
  console.log('✅ Feishu message prepared');
  console.log(message);
  
  return message;
}

// Run if called directly
if (require.main === module) {
  sendToFeishu().then(msg => {
    if (msg) console.log('\n✅ Ready for delivery!');
  });
}

module.exports = { sendToFeishu, formatFeishuMessage, getLatestReport };
