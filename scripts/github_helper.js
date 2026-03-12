#!/usr/bin/env node
/**
 * GitHub Helper - Programming tools
 */

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📦 GitHub Helper
================

Commands:
  search <query>     Search GitHub code
  repos              List my repos
  clone <repo>       Clone a repo
  status             Git status
  log                Recent commits

Examples:
  node github_helper.js search "async await"
  node github_helper.js repos
  node github_helper.js clone eblq77-web/stock-analysis
  `);
  process.exit(0);
}

const cmd = args[0];

if (cmd === 'search' && args[1]) {
  console.log(`🔍 Searching GitHub for: "${args.slice(1).join(' ')}"`);
  try {
    const results = execSync(`gh search code "${args.slice(1).join(' ')}" --limit 5 --json url,name`, { encoding: 'utf-8' });
    const json = JSON.parse(results);
    json.forEach((r, i) => console.log(`${i+1}. ${r.name}: ${r.url}`));
  } catch(e) {
    console.log('Search via web instead:');
    console.log(`https://github.com/search?q=${encodeURIComponent(args.slice(1).join(' '))}`);
  }
} else if (cmd === 'repos') {
  console.log('📁 Your repositories:');
  try {
    execSync('gh repo list --limit 10', { stdio: 'inherit' });
  } catch(e) {
    console.log('Run: gh auth login first');
  }
} else if (cmd === 'clone' && args[1]) {
  const repo = args[1];
  console.log(`📥 Cloning ${repo}...`);
  execSync(`git clone https://github.com/${repo}.git`, { stdio: 'inherit' });
  console.log('✅ Done!');
} else if (cmd === 'status') {
  try {
    execSync('git status', { stdio: 'inherit' });
  } catch(e) {}
} else if (cmd === 'log') {
  try {
    execSync('git log --oneline -10', { stdio: 'inherit' });
  } catch(e) {}
} else {
  console.log('Unknown command. Try: node github_helper.js');
}
