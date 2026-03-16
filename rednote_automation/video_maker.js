#!/usr/bin/env node

/**
 * Real Video Clip Generator using FFmpeg
 * Creates actual video files from scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'output');
const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// Ensure directories exist
[OUTPUT_DIR, SCRIPTS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Video generation presets
const SCENE_DURATION = 3; // seconds per scene
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920; // 9:16 vertical for Xiaohongshu
const FONT = '/System/Library/Fonts/PingFang.ttc';

// Color schemes for different scenes
const COLORS = {
  salary: { bg: '#1a1a2e', text: '#feca57', accent: '#ff6b6b' },
  work: { bg: '#2d3436', text: '#ffffff', accent: '#74b9ff' },
  funny: { bg: '#6c5ce7', text: '#ffffff', accent: '#feca57' },
  meeting: { bg: '#00cec9', text: '#2d3436', accent: '#ff6b6b' },
  coffee: { bg: '#d63031', text: '#ffffff', accent: '#feca57' },
  vacation: { bg: '#0984e3', text: '#ffffff', accent: '#00cec9' }
};

// Generate a video from a script
function generateVideo(scriptId) {
  const scripts = getScripts();
  const script = scripts.find(s => s.id === scriptId);
  
  if (!script) {
    console.log('❌ Script not found:', scriptId);
    console.log('Available:', scripts.map(s => s.id).join(', '));
    return;
  }
  
  console.log(`\n🎬 Generating video: ${script.title}\n`);
  
  const timestamp = Date.now();
  const sceneFiles = [];
  
  // Generate each scene as an image, then combine into video
  script.scenes.forEach((scene, i) => {
    const sceneImgPath = path.join(SCRIPTS_DIR, `scene_${i}.png`);
    sceneFiles.push(sceneImgPath);
    
    // Create image with text using sips + text overlay
    createSceneImage(scene, i, script.theme || 'work');
    console.log(`  ✓ Scene ${i+1}: ${scene.substring(0, 40)}...`);
  });
  
  // Combine into video
  const outputPath = path.join(OUTPUT_DIR, `${scriptId}_${timestamp}.mp4`);
  console.log('\n🎞️  Combining scenes into video...');
  
  combineScenesToVideo(sceneFiles, outputPath, script.scenes.length * SCENE_DURATION);
  
  // Cleanup temp files
  sceneFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
  
  console.log(`\n✅ Video ready: ${outputPath}`);
  console.log(`📁 Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB\n`);
  
  return outputPath;
}

function createSceneImage(text, index, theme) {
  const colors = COLORS[theme] || COLORS.work;
  const outputPath = path.join(SCRIPTS_DIR, `scene_${index}.png`);
  
  // Create a simple colored background image
  const tempDir = path.join(SCRIPTS_DIR, 'temp_' + index);
  
  // Use FFmpeg to create a colored background with text
  const escapedText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
  
  // Draw text on background
  const cmd = `ffmpeg -y -f lavfi -i color=c=${colors.bg}:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:d=1 ` +
    `-vf "drawtext=fontfile='${FONT}':text='${escapedText}':fontcolor=${colors.text}:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:borderw=2:bordercolor=${colors.accent}:shadowcolor=black:shadowdx=2:shadowdy=2" ` +
    `-frames:v 1 "${outputPath}" 2>/dev/null`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (e) {
    // Fallback: create simple colored image
    const fallbackCmd = `ffmpeg -y -f lavfi -i color=c=${colors.bg}:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:d=1 -frames:v 1 "${outputPath}" 2>/dev/null`;
    execSync(fallbackCmd, { stdio: 'pipe' });
  }
  
  return outputPath;
}

function combineScenesToVideo(sceneFiles, outputPath, duration) {
  if (sceneFiles.length === 0) return;
  
  // Create concat file
  const concatFile = path.join(SCRIPTS_DIR, 'concat.txt');
  const durationPerScene = SCENE_DURATION;
  
  let concatContent = '';
  sceneFiles.forEach(f => {
    concatContent += `file '${f}'\nduration ${durationPerScene}\n`;
  });
  // Last frame stays
  concatContent += `file '${sceneFiles[sceneFiles.length-1]}'\n`;
  
  fs.writeFileSync(concatFile, concatContent);
  
  // Combine using FFmpeg
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 ` +
    `-movflags +faststart "${outputPath}" 2>&1`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (e) {
    console.log('⚠️ FFmpeg error, trying simpler method...');
    // Simple fallback
    const simpleCmd = `ffmpeg -y -loop 1 -i "${sceneFiles[0]}" -t ${duration} -c:v libx264 -pix_fmt yuv420p "${outputPath}" 2>/dev/null`;
    execSync(simpleCmd, { stdio: 'pipe' });
  }
  
  // Cleanup
  try { fs.unlinkSync(concatFile); } catch(e) {}
}

function getScripts() {
  return [
    {
      id: 'salary_journey',
      title: 'Monthly Salary Journey',
      theme: 'salary',
      scenes: [
        "DAY 1: I'm gonna save money!",
        "DAY 3: Rent paid. Still good!",
        "DAY 15: Why is my wallet crying??",
        "DAY 30: WHO SPENT THIS???",
        "Salary is like water in a sieve..."
      ]
    },
    {
      id: 'growth_opportunity',
      title: 'The Growth Opportunity',
      theme: 'funny',
      scenes: [
        "Interviewer: We value growth over money!",
        "Me: Cool. How much growth?",
        "You'll grow... professionally!",
        "So... zero money?",
        "Are you in?"
      ]
    },
    {
      id: 'monday_mood',
      title: 'Monday Mood',
      theme: 'work',
      scenes: [
        "FRIDAY: Party mode!",
        "MONDAY 6AM: ALARM FROM HELL",
        "Hitting snooze 10 times...",
        "Zombie walking to office"
      ]
    },
    {
      id: 'meeting_vs_reality',
      title: 'Meeting vs Reality',
      theme: 'meeting',
      scenes: [
        "Professional meeting...",
        "Actually: Pretending to care",
        "My thought: Beach + cocktail",
        "Back to meeting: What's the update?",
        "Fake nod + smile"
      ]
    },
    {
      id: 'coffee_life',
      title: 'Coffee: The Real Fuel',
      theme: 'coffee',
      scenes: [
        "Morning without coffee: ZOMBIE",
        "Coffee machine: Golden rays!",
        "Eyes opening: Dead to Alive",
        "Superhero with coffee!"
      ]
    },
    {
      id: 'boss_email',
      title: 'The 11PM Email',
      theme: 'work',
      scenes: [
        "Peaceful sleep...",
        "RED NOTIFICATION: 11PM EMAIL!",
        "Boss: Quick question...",
        "*sits up instantly* I'M AWAKE!"
      ]
    },
    {
      id: 'fake_busy',
      title: 'The Art of Looking Busy',
      theme: 'funny',
      scenes: [
        "Multiple monitors, serious face...",
        "Actually: Random spreadsheets",
        "Boss walks by... *types fast*",
        "Boss leaves... *stops* Victory!"
      ]
    },
    {
      id: 'deadline_vs_start',
      title: 'Deadline vs Start',
      theme: 'work',
      scenes: [
        "Deadline: 1 month away (OK)",
        "Days passing fast...",
        "Deadline: TOMORROW!",
        "3AM: Coffee IV, frantic typing"
      ]
    },
    {
      id: 'budget_vs_receipt',
      title: 'Budget vs Receipt',
      theme: 'salary',
      scenes: [
        "Budget: $50 for food",
        "Receipt: $200!!!",
        "What I bought: Coffee, snacks...",
        "Me: Crying in corner"
      ]
    },
    {
      id: 'out_of_office',
      title: 'Out of Office Genius',
      theme: 'vacation',
      scenes: [
        "Me on vacation: Beach!",
        "Work email notification...",
        "Auto-reply: I'm out!",
        "Ignoring email, diving in!"
      ]
    }
  ];
}

function listScripts() {
  const scripts = getScripts();
  console.log('\n📋 Available Video Scripts:\n');
  scripts.forEach(s => {
    console.log(`  ${s.id}: ${s.title} (${s.scenes.length} scenes, ~${s.scenes.length * 3}s)`);
  });
  console.log();
}

function generateAll() {
  const scripts = getScripts();
  console.log('\n🎬 Generating all videos...\n');
  
  scripts.forEach((script, i) => {
    console.log(`\n[${i+1}/${scripts.length}] ${script.title}`);
    try {
      generateVideo(script.id);
    } catch(e) {
      console.log('❌ Failed:', e.message);
    }
  });
  
  console.log('\n✅ All videos generated!');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === '--list' || cmd === '-l') {
  listScripts();
} else if (cmd === '--all' || cmd === '-a') {
  generateAll();
} else if (cmd && !cmd.startsWith('-')) {
  generateVideo(cmd);
} else {
  console.log(`
🎬 Real Video Clip Generator

Usage: node video_maker.js [command]

Commands:
  node video_maker.js --list           List all scripts
  node video_maker.js --all            Generate ALL videos
  node video_maker.js <script-id>     Generate specific video

Examples:
  node video_maker.js --list
  node video_maker.js salary_journey
  node video_maker.js --all

Output: ${OUTPUT_DIR}
  `);
}
