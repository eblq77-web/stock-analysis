#!/usr/bin/env node

/**
 * Simple Video Generator
 * Creates slideshow videos from text scenes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SCRIPTS = {
  salary_journey: {
    title: "Monthly Salary Journey",
    scenes: [
      "💰 DAY 1: I'm gonna save money!",
      "💸 DAY 3: Rent paid. Still good!",
      "😰 DAY 15: Why is my wallet crying??",
      "💀 DAY 30: WHO SPENT THIS???",
      "💧 Salary = water in a sieve..."
    ]
  },
  coffee_life: {
    title: "Coffee: The Real Fuel",
    scenes: [
      "🌅 Morning: ZOMBIE MODE",
      "☕ Coffee: Golden rays!",
      "👁️ Eyes opening: Dead → Alive",
      "🦸 Coffee superhero!"
    ]
  },
  monday_mood: {
    title: "Monday Mood",
    scenes: [
      "🎉 FRIDAY: Party mode!",
      "⏰ MONDAY 6AM: ALARM!",
      "😴 Snooze button: 10 times...",
      "🧟 Zombie walking to office"
    ]
  },
  meeting_vs_reality: {
    title: "Meeting vs Reality",
    scenes: [
      "🏢 Professional meeting...",
      "🫧 Pretending to pay attention",
      "🏖️ My thought: Beach + cocktail",
      "😰 Boss: What's the update?",
      "👍 Fake nod + smile"
    ]
  },
  growth_opportunity: {
    title: "The Growth Opportunity",
    scenes: [
      "👔 We value growth over money!",
      "❓ Me: Cool. How much growth?",
      "📈 You'll grow... professionally!",
      "💰 Me: So... zero money?",
      "🎤 *drops mic* Are you in?"
    ]
  }
};

const DURATION_PER_SCENE = 3;

function generateVideo(scriptId) {
  const script = SCRIPTS[scriptId];
  if (!script) {
    console.log('Available:', Object.keys(SCRIPTS).join(', '));
    return;
  }
  
  console.log(`\n🎬 Generating: ${script.title}`);
  
  const timestamp = Date.now();
  const outputFile = path.join(OUTPUT_DIR, `${scriptId}_${timestamp}.mp4`);
  
  // Create a simple solid color video with text using FFmpeg
  // This is a basic approach - creates colored slides
  
  // First, create a simple text file with drawtext
  const scenes = script.scenes.map((text, i) => {
    const bgColor = ['#ff6b6b', '#feca57', '#48dbfb', '#a55eea', '#6c5ce7'][i % 5];
    const textColor = '#ffffff';
    return { text, bgColor };
  });
  
  // Generate video using FFmpeg with color sources and text
  const filters = scenes.map((s, i) => {
    const escaped = s.text.replace(/'/g, "'").replace(/:/g, '\\:').replace(/💰/g, '').replace(/💸/g, '').replace(/💀/g, '');
    return `color=c=${s.bgColor}:s=1080x1920:d=${DURATION_PER_SCENE},drawtext=text='${escaped}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black:shadowdx=3:shadowdy=3`;
  }).join(',');
  
  try {
    // Simple approach: just create solid color videos and concat
    const tempFiles = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const tempFile = path.join(OUTPUT_DIR, `temp_${i}.mp4`);
      tempFiles.push(tempFile);
      
      const escaped = scenes[i].text.replace(/'/g, "\\'").replace(/:/g, "\\:");
      
      const cmd = `ffmpeg -y -f lavfi -i "color=c=${scenes[i].bgColor}:s=1080x1920:d=${DURATION_PER_SCENE}" ` +
        `-vf "drawtext=text='${escaped}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black:shadowdx=2:shadowdy=2" ` +
        `-c:v libx264 -t ${DURATION_PER_SCENE} -pix_fmt yuv420p "${tempFile}" 2>/dev/null`;
      
      execSync(cmd, { stdio: 'pipe' });
      console.log(`  ✓ Scene ${i+1}/${scenes.length}`);
    }
    
    // Concat all scenes
    const listFile = path.join(OUTPUT_DIR, 'concat.txt');
    fs.writeFileSync(listFile, tempFiles.map(f => `file '${f}'`).join('\n'));
    
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}" 2>/dev/null`;
    execSync(concatCmd, { stdio: 'pipe' });
    
    // Cleanup
    tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
    try { fs.unlinkSync(listFile); } catch(e) {}
    
    if (fs.existsSync(outputFile)) {
      const size = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
      console.log(`\n✅ Done! Video: ${outputFile}`);
      console.log(`📊 Size: ${size} MB`);
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  return outputFile;
}

// List
if (process.argv[2] === '--list') {
  console.log('\n📋 Scripts:\n');
  Object.entries(SCRIPTS).forEach(([id, s]) => {
    console.log(`  ${id}: ${s.title} (${s.scenes.length} scenes)`);
  });
} else if (process.argv[2]) {
  generateVideo(process.argv[2]);
} else {
  console.log('\n🎬 Video Generator\nUsage: node make_video.js <script-id>\n');
  console.log('Scripts:');
  Object.entries(SCRIPTS).forEach(([id, s]) => {
    console.log(`  ${id}: ${s.title}`);
  });
  console.log('\nExample: node make_video.js coffee_life');
}
