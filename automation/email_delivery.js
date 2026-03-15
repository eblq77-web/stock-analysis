#!/usr/bin/env node
/**
 * Email Delivery Module
 * Sends reports via SMTP (Outlook/Office365)
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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
 * Format HTML email
 */
function formatHtmlEmail(report) {
  const { date, market, signals, portfolio } = report;
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
    .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .section h3 { margin-top: 0; color: #667eea; }
    .stock { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .stock:last-child { border-bottom: none; }
    .positive { color: #27ae60; }
    .negative { color: #e74c3c; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Super Brain 每日交易报告</h1>
    <p>${date}</p>
  </div>
  
  <div class="section">
    <h3>🌊 市场概况</h3>
    ${Object.entries(market).map(([key, data]) => `
      <div class="stock">
        <span>${data.name}</span>
        <span>${data.price.toFixed(2)} <span class="${data.change >= 0 ? 'positive' : 'negative'}">(${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%)</span></span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h3>🎯 今日信号</h3>
    ${signals && signals.length > 0 ? signals.slice(0, 3).map(s => `
      <div class="stock">
        <div>
          <strong>${s.name}</strong> (${s.code})<br>
          <small>${s.sector} | ${s.reason || ''}</small>
        </div>
        <div>
          目标: ¥${s.target}<br>
          止损: ¥${s.stopLoss}
        </div>
      </div>
    `).join('') : '<p>暂无新信号</p>'}
  </div>
  
  <div class="section">
    <h3>📦 持仓情况</h3>
    <div class="stock">
      <span>现金</span>
      <span>¥${portfolio.cash.toLocaleString()}</span>
    </div>
    <div class="stock">
      <span>总市值</span>
      <span>¥${portfolio.totalValue.toLocaleString()}</span>
    </div>
    <div class="stock">
      <span>持仓</span>
      <span>${portfolio.holdings?.length || 0}只股票</span>
    </div>
    ${portfolio.holdings && portfolio.holdings.length > 0 ? `
      <hr>
      ${portfolio.holdings.map(h => `
        <div class="stock">
          <span>${h.name}</span>
          <span class="${parseFloat(h.pnl) >= 0 ? 'positive' : 'negative'}">${parseFloat(h.pnl) >= 0 ? '+' : ''}${h.pnl}%</span>
        </div>
      `).join('')}
    ` : ''}
  </div>
  
  <div class="footer">
    <p>此报告由 Super Brain 自动生成 | 仅供参考，不构成投资建议</p>
  </div>
</body>
</html>
`;
  
  return html;
}

/**
 * Send email
 */
async function sendEmail() {
  const config = loadConfig();
  
  if (!config || !config.email || !config.email.enabled) {
    console.log('⚠️ Email not configured');
    return false;
  }
  
  const report = getLatestReport();
  if (!report) {
    console.log('⚠️ No report found');
    return false;
  }
  
  // Create transporter for Outlook/Office365
  const transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth: {
      user: config.email.sender,
      pass: process.env.SMTP_PASSWORD || config.email.password
    }
  });
  
  const html = formatHtmlEmail(report);
  
  const mailOptions = {
    from: `"Super Brain" <${config.email.sender}>`,
    to: config.email.recipients.join(', '),
    subject: `📊 Super Brain 每日交易报告 - ${report.date}`,
    html: html
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  sendEmail().then(success => {
    if (success) {
      console.log('✅ Email delivery complete!');
    } else {
      console.log('❌ Email delivery failed');
      process.exit(1);
    }
  });
}

module.exports = { sendEmail, formatHtmlEmail };
