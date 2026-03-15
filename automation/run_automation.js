#!/usr/bin/env node
/**
 * Combined Automation Runner
 * Generates report + sends to Feishu + emails subscribers
 * 
 * Usage: node run_automation.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

console.log('🚀 Starting Super Brain Automation...\n');

// Step 1: Generate daily report
console.log('📊 Step 1: Generating daily report...');
try {
  execSync('node automation/daily_automation.js daily', { 
    cwd: BASE_DIR, 
    stdio: 'inherit' 
  });
} catch (e) {
  console.error('Report generation failed:', e.message);
  process.exit(1);
}

// Step 2: Prepare Feishu message
console.log('\n📝 Step 2: Preparing Feishu message...');
try {
  execSync('node automation/feishu_delivery.js', { 
    cwd: BASE_DIR, 
    stdio: 'inherit' 
  });
} catch (e) {
  console.error('Feishu prep failed:', e.message);
}

// Step 3: Send email
console.log('\n📧 Step 3: Sending email...');
try {
  execSync('node automation/email_delivery.js', { 
    cwd: BASE_DIR, 
    stdio: 'inherit' 
  });
} catch (e) {
  console.error('Email failed:', e.message);
}

console.log('\n✅ Automation complete!');
