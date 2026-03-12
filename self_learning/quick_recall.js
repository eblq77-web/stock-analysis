#!/usr/bin/env node
/**
 * ⚡ QUICK MEMORY RECALL
 * Fast access to relevant memories
 * 
 * Usage: node quick_recall.js [topic]
 * 
 * Topics:
 * - trading
 * - analysis
 * - system
 * - today
 * - improvements
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/liu/.openclaw/workspace';
const MEMORY_INDEX = `${WORKSPACE}/MEMORY_INDEX.md`;
const TODAY_MEMORY = `${WORKSPACE}/memory/2026-03-12.md`;

// Topic mappings
const TOPICS = {
  trading: {
    files: [
      `${WORKSPACE}/MEMORY.md`,
      `${WORKSPACE}/MARKET_FRAMEWORK.md`
    ],
    keywords: ['trading', 'position', 'stop loss', 'profit', 'risk']
  },
  analysis: {
    files: [
      `${WORKSPACE}/THINKING_TANK.md`,
      `${WORKSPACE}/THINKING_FRAMEWORK.md`
    ],
    keywords: ['analysis', 'thinking', 'pattern', 'perspective']
  },
  system: {
    files: [
      '/Users/liu/.openclaw/workspace/HEARTBEAT.md',
      '/Users/liu/Desktop/Stock_Analysis/SUPER_BRAIN_V3_IMPROVEMENT_PLAN.md'
    ],
    keywords: ['system', 'script', 'cron', 'backup']
  },
  today: {
    files: [
      TODAY_MEMORY
    ],
    keywords: ['today', 'current', 'now']
  },
  improvements: {
    files: [
      '/Users/liu/Desktop/Stock_Analysis/self_learning/gallery/today.md',
      '/Users/liu/Desktop/Stock_Analysis/self_learning/assessment.json'
    ],
    keywords: ['improve', 'skill', 'learning', 'gallery']
  }
};

// Quick search
function search(keyword) {
  console.log(`\n🔍 Searching for: "${keyword}"`);
  console.log('='.repeat(40));
  
  const results = [];
  
  // Search in memory index
  try {
    const index = fs.readFileSync(MEMORY_INDEX, 'utf-8');
    const lines = index.split('\n');
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ file: 'MEMORY_INDEX.md', line: i + 1, text: line.trim() });
      }
    });
  } catch (e) {}
  
  // Search in today's memory
  try {
    const today = fs.readFileSync(TODAY_MEMORY, 'utf-8');
    const lines = today.split('\n');
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ file: 'today.md', line: i + 1, text: line.trim() });
      }
    });
  } catch (e) {}
  
  if (results.length === 0) {
    console.log('❌ No results found');
    return;
  }
  
  console.log(`✅ Found ${results.length} results:\n`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.file}:${r.line}]`);
    console.log(`   ${r.text.substring(0, 80)}${r.text.length > 80 ? '...' : ''}`);
    console.log('');
  });
}

// Show topic overview
function showTopic(topic) {
  console.log(`\n📚 Topic: ${topic.toUpperCase()}`);
  console.log('='.repeat(40));
  
  const t = TOPICS[topic.toLowerCase()];
  if (!t) {
    console.log(`❌ Unknown topic: ${topic}`);
    console.log(`Available: ${Object.keys(TOPICS).join(', ')}`);
    return;
  }
  
  t.files.forEach(f => {
    try {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf-8');
        console.log(`\n📄 ${path.basename(f)}`);
        console.log('-'.repeat(30));
        // Show first 500 chars
        console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      }
    } catch (e) {
      console.log(`❌ Could not read: ${f}`);
    }
  });
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
⚡ QUICK MEMORY RECALL
======================
Usage: node quick_recall.js [command]

Commands:
  trading    - Show trading rules and memory
  analysis   - Show thinking frameworks
  system     - Show system scripts and setup
  today      - Show today's memory
  improvements - Show learning gallery
  search [word] - Search memories

Examples:
  node quick_recall.js trading
  node quick_recall.js search "stop loss"
  `);
} else if (args[0] === 'search' && args[1]) {
  search(args.slice(1).join(' '));
} else if (TOPICS[args[0].toLowerCase()]) {
  showTopic(args[0]);
} else {
  search(args.join(' '));
}
