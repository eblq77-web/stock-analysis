#!/usr/bin/env node
/**
 * Email Delivery Module - PRO V2
 * Sends professional HTML reports via SMTP (Outlook/Gmail)
 * Uses daily_report_XXXX-XX-XX_pro_v2.html as master template
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const BASE_DIR = path.join(__dirname, '..');
const REPORTS_DIR = path.join(BASE_DIR, 'daily_reports');

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
 * Get latest PRO V2 report (master format)
 */
function getLatestProReport() {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('daily_report_') && f.endsWith('_pro_v2.html'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    const filePath = path.join(REPORTS_DIR, files[0]);
    const html = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Using report: ${files[0]}`);
    return { html, filename: files[0] };
  }
  return null;
}

/**
 * Get today's date for subject
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Send email with PRO V2 HTML
 */
async function sendEmail() {
  const config = loadConfig();
  
  if (!config || !config.email || !config.email.enabled) {
    console.log('⚠️ Email not configured');
    return false;
  }
  
  // Get latest PRO V2 report
  const report = getLatestProReport();
  if (!report) {
    console.log('⚠️ No PRO V2 report found');
    return false;
  }
  
  // Create transporter
  let transporter;
  const smtpConfig = config.email.smtp || {};
  
  // Detect provider and configure
  const senderEmail = config.email.sender || '';
  const isGmail = senderEmail.includes('@gmail.com');
  const isOutlook = senderEmail.includes('@outlook.com') || senderEmail.includes('@hotmail.com');
  
  if (isGmail) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: senderEmail,
        pass: process.env.SMTP_PASSWORD || config.email.password
      }
    });
  } else {
    // Default to Outlook/Office365
    transporter = nodemailer.createTransport({
      host: smtpConfig.host || 'smtp.office365.com',
      port: smtpConfig.port || 587,
      secure: smtpConfig.secure || false,
      auth: {
        user: senderEmail,
        pass: process.env.SMTP_PASSWORD || config.email.password
      }
    });
  }
  
  const today = getTodayDate();
  const mailOptions = {
    from: `"🧠 Super Brain" <${senderEmail}>`,
    to: config.email.recipients ? config.email.recipients.join(', ') : senderEmail,
    subject: `📊 Super Brain Daily Report - ${today} (Institutional Grade)`,
    html: report.html
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    console.log('📧 To:', mailOptions.to);
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
      console.log('✅ PRO V2 Email delivery complete!');
    } else {
      console.log('❌ Email delivery failed');
      process.exit(1);
    }
  });
}

module.exports = { sendEmail };
