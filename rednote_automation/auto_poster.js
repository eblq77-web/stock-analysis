#!/usr/bin/env node

/**
 * Xiaohongshu Auto-Poster
 * Posts generated content to Xiaohongshu using browser automation
 * 
 * Usage: node auto_poster.js --video <path> --caption <text>
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Captions for different content types
const CAPTION_TEMPLATES = {
  salary: [
    "Salary is like water in a sieve 💸 #meme #worklife #salary",
    "Day 1: I'm saving money. Day 30: Who stole my wallet? 😂 #relatable #finance",
    "When your wallet looks like your motivation on Monday #meme #monday"
  ],
  work: [
    "The real employee benefits 💼 #workmeme #office #sarcasm",
    "They said work-life balance. I said work-work-stress-stress 😂 #relatable",
    "When your boss says 'growth opportunity' = 'no money' 🔥 #interview #sarcasm"
  ],
  excuses: [
    "My dog ate my homework... report 🥺 #workexcuses #meme #funny",
    "The art of making excuses 🐺🐑 #animation #workmeme #funny"
  ],
  chat: [
    "The text that ended my career 😂 #chatfail #meme #embarrassing",
    "When you accidentally reply to your boss...RIP 🔥 #relatable #work"
  ],
  monday: [
    "Monday mood be like 🧟‍♂️ #monday #meme #relatable #worklife",
    "Why is Monday so far from Friday? 😩 #meme #monday #TGIF",
    "My bed said stay, my alarm said rise... I chose crying 😂 #monday #relatable"
  ],
  meeting: [
    "Meeting: Where work goes to die 📉 #meeting #meme #work #sarcasm",
    "Pretending to pay attention in meetings be like... 🎭 #relatable #office",
    "My longest relationship was a weekly team meeting 💀 #meetingmeme #work"
  ],
  deadline: [
    "Deadline: 1 week = relax | 1 day = panic 😰 #deadline #meme #procrastination",
    "I'll do it tomorrow... said me 10 days ago 😂 #deadline #procrastination #meme",
    "The deadline is tomorrow and I started 5 minutes ago 💪 #meme #deadline #relatable"
  ],
  coffee: [
    "Coffee: Because adulting is hard ☕ #coffee #meme #morning #relatable",
    "I don't function until I've had my coffee ☕😤 #coffee #meme #monday",
    "Espresso yourself! ☕✨ #coffee #meme #funny"
  ],
  budget: [
    "Budget: $50 | Receipt: $200 💸 #budget #meme #finance #relatable",
    "I bought nothing but somehow spent $300 😰 #shopping #meme #budget #fail",
    "My budget is just suggestions my bank ignores 😂 #budget #meme #money"
  ],
  vacation: [
    "Out of office mode: ACTIVATED 🏝️ #vacation #outofoffice #meme #work",
    "Working while on vacation? In my dreams only 😴 #vacation #meme #relatable",
    "My out-of-office reply does more work than I do 📧✨ #outofoffice #meme #genius"
  ]
};

/**
 * Generate random caption
 */
function generateCaption(type = 'salary') {
  const templates = CAPTION_TEMPLATES[type] || CAPTION_TEMPLATES.salary;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Get latest generated video
 */
function getLatestVideo() {
  if (!fs.existsSync(OUTPUT_DIR)) return null;
  
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({
      name: f,
      path: path.join(OUTPUT_DIR, f),
      time: fs.statSync(path.join(OUTPUT_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  return files[0]?.path || null;
}

/**
 * List pending posts
 */
function listPending() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('📭 No pending posts');
    return;
  }
  
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.mp4') || f.endsWith('.jpg'));
  
  if (files.length === 0) {
    console.log('📭 No pending posts');
    return;
  }
  
  console.log(`\n📋 Pending Posts (${files.length}):\n`);
  files.forEach((f, i) => {
    console.log(`  ${i+1}. ${f}`);
  });
  console.log();
}

// CLI
const args = process.argv.slice(2);

if (args[0] === '--list' || args[0] === '-l') {
  listPending();
} else if (args[0] === '--caption' && args[1]) {
  console.log(generateCaption(args[1]));
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
📝 Xiaohongshu Auto-Poster

Usage:
  node auto_poster.js --list              List pending posts
  node auto_poster.js --caption <type>    Generate caption (salary/work/excuses/chat)
  node auto_poster.js --latest            Get latest generated video path
  node auto_poster.js --help              Show this help

Examples:
  node auto_poster.js --list
  node auto_poster.js --caption salary
  `);
} else if (args[0] === '--latest') {
  const latest = getLatestVideo();
  if (latest) {
    console.log(latest);
  } else {
    console.log('No videos found');
  }
} else {
  console.log(`
📝 Xiaohongshu Auto-Poster

Usage: node auto_poster.js [command]

Commands:
  --list              List pending posts
  --caption <type>    Generate caption (salary/work/excuses/chat)
  --latest            Get latest generated video path
  --help              Show help
  `);
}
