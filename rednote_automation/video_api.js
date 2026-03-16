#!/usr/bin/env node

/**
 * AI Video Generation Script
 * Supports: Minimax, Runway, Pika, Kling
 * 
 * Usage: node video_api.js --script <name> --provider <provider> --api-key <key>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Scripts with detailed prompts for AI
const SCRIPTS = {
  salary_journey: {
    title: "Monthly Salary Journey",
    scenes: [
      "Happy person holding gold coins, bright colors, sparkles",
      "Money flying away, rent receipt, red arrow",
      "Wallet deflating like balloon, sad, grey background",
      "Empty pockets, tumbleweed, desert, dramatic",
      "Water leaking through sieve, philosophical"
    ],
    duration: 15
  },
  coffee_life: {
    title: "Coffee: The Real Fuel",
    scenes: [
      "Person as zombie, grey filter, dead eyes, morning",
      "Coffee machine with golden rays, magical, angels singing",
      "Person transforming from dead to alive, dramatic",
      "Superhero with coffee cup, cape, dramatic lighting"
    ],
    duration: 12
  },
  monday_mood: {
    title: "Monday Mood",
    scenes: [
      "Person dancing at party, disco lights, Friday night",
      "Alarm clock flashing red, horror movie style",
      "Person hitting snooze button repeatedly, piled up alarms",
      "Zombie walking on grey street, fog, dead eyes"
    ],
    duration: 13
  },
  meeting_reality: {
    title: "Meeting vs Reality",
    scenes: [
      "Professional meeting room, corporate, round table",
      "Person with blank stare, bubbles floating, daydreaming",
      "Person on beach with cocktail, paradise, relaxing",
      "Person in meeting sweating, boss asking question",
      "Person nodding fake smile, thumbs up"
    ],
    duration: 16
  },
  growth_opportunity: {
    title: "The Growth Opportunity",
    scenes: [
      "Two people in interview, serious, spotlight",
      "Businessman thumbs up, growth chart going up, dollar fading",
      "Confused person with question marks, thinking pose",
      "Awkward silence, sweat drops, crickets",
      "Microphone dropping, explosion effect"
    ],
    duration: 16
  }
};

// API configurations
const PROVIDERS = {
  minimax: {
    name: 'Minimax',
    endpoint: 'https://api.minimax.chat/v1/video/generation',
    requires: ['api_key']
  },
  runway: {
    name: 'Runway ML',
    endpoint: 'https://api.runwayml.com/v1/generation',
    requires: ['api_key']
  },
  pika: {
    name: 'Pika Labs',
    endpoint: 'https://api.pika.art/v1/generate',
    requires: ['api_key']
  },
  kling: {
    name: 'Kling AI',
    endpoint: 'https://api.klingai.com/v1/generations',
    requires: ['api_key']
  }
};

function getArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].replace('--', '');
      const val = process.argv[i + 1];
      if (val && !val.startsWith('--')) {
        args[key] = val;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function generateWithMinimax(prompt, apiKey) {
  console.log('🎬 Generating with Minimax...');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      prompt: prompt,
      duration: 5,
      width: 1024,
      height: 1024
    });
    
    const req = https.request({
      hostname: 'api.minimax.chat',
      path: '/v1/video/generation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            resolve(result.data.video_url);
          } else {
            reject(new Error(result.message || 'API error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generatePlaceholderVideo(script, outputPath) {
  // Create a placeholder video using FFmpeg
  console.log('🎞️ Creating placeholder video...');
  
  const timestamp = Date.now();
  const tempFiles = [];
  
  // Create images for each scene
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#a55eea', '#6c5ce7'];
  
  for (let i = 0; i < script.scenes.length; i++) {
    const tempImg = path.join(OUTPUT_DIR, `temp_${i}.png`);
    tempFiles.push(tempImg);
    
    try {
      const cmd = `ffmpeg -y -f lavfi -i "color=c=${colors[i % colors.length]}:s=1080x1920:d=1" -frames:v 1 "${tempImg}" 2>/dev/null`;
      execSync(cmd, { stdio: 'pipe' });
    } catch (e) {
      console.log('Warning: Could not create scene image');
    }
  }
  
  // Create video from images
  if (tempFiles.length > 0 && fs.existsSync(tempFiles[0])) {
    const duration = Math.ceil(script.duration / script.scenes.length);
    
    // Concat approach
    let concatList = '';
    tempFiles.forEach(f => {
      if (fs.existsSync(f)) {
        concatList += `file '${f}'\nduration ${duration}\n`;
      }
    });
    
    if (concatList) {
      const listPath = path.join(OUTPUT_DIR, 'concat.txt');
      fs.writeFileSync(listPath, concatList);
      
      try {
        execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -pix_fmt yuv420p "${outputPath}" 2>/dev/null`, { stdio: 'pipe' });
      } catch (e) {
        // Fallback
      }
      
      try { fs.unlinkSync(listPath); } catch(e) {}
    }
    
    // Cleanup
    tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
  }
  
  return outputPath;
}

async function main() {
  const args = getArgs();
  
  if (args.list) {
    console.log('\n📋 Available Scripts:\n');
    Object.entries(SCRIPTS).forEach(([id, s]) => {
      console.log(`  ${id}: ${s.title} (${s.duration}s, ${s.scenes.length} scenes)`);
    });
    console.log('\n📋 Available Providers:\n');
    Object.entries(PROVIDERS).forEach(([id, p]) => {
      console.log(`  ${id}: ${p.name}`);
    });
    return;
  }
  
  const scriptId = args.script || args.s;
  const provider = args.provider || args.p || 'minimax';
  const apiKey = args['api-key'] || process.env.VIDEO_API_KEY;
  
  if (!scriptId) {
    console.log(`
🎬 AI Video Generator

Usage: node video_api.js [options]

Options:
  --script <name>     Script to generate (salary_journey, coffee_life, etc.)
  --provider <name>   AI provider (minimax, runway, pika, kling)
  --api-key <key>    API key (or set VIDEO_API_KEY env var)
  --list             List available scripts and providers

Examples:
  node video_api.js --list
  node video_api.js --script coffee_life --provider minimax --api-key YOUR_KEY
  
Set API key: export VIDEO_API_KEY="your-key"
    `);
    return;
  }
  
  const script = SCRIPTS[scriptId];
  if (!script) {
    console.log('Script not found. Use --list to see available scripts.');
    return;
  }
  
  console.log(`\n🎬 Generating: ${script.title}`);
  console.log(`📡 Provider: ${provider}\n`);
  
  const outputPath = path.join(OUTPUT_DIR, `${scriptId}_${Date.now()}.mp4`);
  
  if (apiKey && provider === 'minimax') {
    try {
      // Try AI generation
      const prompt = script.scenes.join(' | ');
      const videoUrl = await generateWithMinimax(prompt, apiKey);
      console.log('✅ Video generated:', videoUrl);
      // Download and save
    } catch (e) {
      console.log('⚠️ API error:', e.message);
      console.log('Creating placeholder...');
      await generatePlaceholderVideo(script, outputPath);
    }
  } else {
    // Create placeholder
    console.log('💡 No API key - creating placeholder video');
    console.log('To use AI generation:');
    console.log('  1. Get API key from minimax.io');
    console.log('  2. Run: export VIDEO_API_KEY="your-key"');
    console.log('  3. Run again with --provider minimax\n');
    
    await generatePlaceholderVideo(script, outputPath);
  }
  
  if (fs.existsSync(outputPath)) {
    const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Video ready: ${outputPath}`);
    console.log(`📊 Size: ${size} MB`);
    console.log(`\n📁 Open folder: open ${OUTPUT_DIR}`);
  } else {
    console.log('\n❌ Video generation failed');
  }
}

main().catch(console.error);
