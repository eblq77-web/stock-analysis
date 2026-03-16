#!/usr/bin/env node

/**
 * Rednote Content Automation Runner
 * Generates and posts content to Xiaohongshu automatically
 * 
 * Usage: node run.js [options]
 *   --generate    Generate new content
 *   --post        Post to Xiaohongshu (opens browser)
 *   --full        Generate + Post
 *   --schedule    Set up daily automation
 */

const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;

function generate() {
  console.log('\n🎬 Generating new content...\n');
  execSync(`node ${path.join(SCRIPT_DIR, 'video_generator.js')} --random`, { stdio: 'inherit' });
}

function post() {
  console.log('\n📝 Opening Xiaohongshu creator studio...\n');
  // This would open the posting interface
  console.log('To post manually:');
  console.log('1. Go to: https://creator.xiaohongshu.com/publish/publish');
  console.log('2. Upload your generated video');
  console.log('3. Use caption from: node auto_poster.js --caption <type>');
}

function full() {
  generate();
  console.log('\n⏳ Waiting 5 seconds before posting...');
  setTimeout(post, 5000);
}

const args = process.argv.slice(2);
const command = args[0];

if (command === '--generate' || command === '-g') {
  generate();
} else if (command === '--post' || command === '-p') {
  post();
} else if (command === '--full' || command === '-f') {
  full();
} else if (command === '--schedule') {
  console.log('\n📅 To schedule daily posts, add to crontab:');
  console.log('0 9 * * * cd ~/Desktop/Stock_Analysis/rednote_automation && node run.js --full');
  console.log('\nThis will run at 9 AM daily.');
} else {
  console.log(`
🎬 Rednote Content Automation

Usage: node run.js [command]

Commands:
  --generate, -g    Generate new video content
  --post, -p        Show posting instructions
  --full, -f        Generate + Show post instructions
  --schedule        Show cron schedule setup
  --help            Show this help

Example:
  node run.js --full
  `);
}
