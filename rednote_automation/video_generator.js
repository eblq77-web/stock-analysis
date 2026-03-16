#!/usr/bin/env node

/**
 * Rednote Video Automation Generator
 * Generates meme videos from scripts using AI video APIs
 * 
 * Usage: node video_generator.js [options]
 * Options:
 *   --script <id>     Specific script to generate (salary_journey, growth_opportunity, etc.)
 *   --random          Generate random script
 *   --api <provider>   API to use (minimax, runway, pika, kling)
 *   --preview         Generate preview images only (no video)
 *   --post            Auto-post to Xiaohongshu after generation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Load config
let config = {
  video_api: { provider: 'minimax_video', api_key: '' },
  content_profile: { theme: 'black_humor_worklife', language: 'english' },
  scripts: { templates: [] }
};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
} catch (e) {
  console.error('Error loading config:', e.message);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate image using AI API
 * Currently supports text-to-image prompts for manual use
 * Can be extended to actual API calls
 */
async function generateImage(prompt, outputPath) {
  console.log(`🎨 Generating image for: ${prompt.substring(0, 50)}...`);
  
  // For now, create a placeholder - in production, call AI image API
  // This would integrate with APIs like:
  // - Minimax Image API
  // - DALL-E
  // - Midjourney
  // - Stable Diffusion
  
  // Create a simple text-based placeholder image using ImageMagick or similar
  // For now, return the prompt for use with Xiaohongshu's built-in text-to-image
  
  return {
    success: true,
    prompt: prompt,
    outputPath: outputPath,
    note: 'Use this prompt in Xiaohongshu text-to-image feature'
  };
}

/**
 * Generate video from images using FFmpeg
 */
async function generateVideoFromImages(images, outputPath, duration = 10) {
  console.log('🎬 Generating video from images...');
  
  // Create a file list for FFmpeg
  const durationPerImage = duration / images.length;
  
  let concatList = '';
  const tempFiles = [];
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const tempPath = path.join(OUTPUT_DIR, `temp_${i}.mp4`);
    tempFiles.push(tempPath);
    
    try {
      // Create video from image with duration
      execSync(`ffmpeg -loop 1 -i "${img}" -c:v libx264 -t ${durationPerImage} -pix_fmt yuv420p -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -movflags +faststart "${tempPath}" -y 2>/dev/null`, { stdio: 'pipe' });
      concatList += `file '${tempPath}'\n`;
    } catch (e) {
      console.log(`⚠️ Could not process image ${i}, using placeholder`);
    }
  }
  
  if (tempFiles.length > 0 && fs.existsSync(tempFiles[0])) {
    // Concatenate videos
    const listPath = path.join(OUTPUT_DIR, 'concat.txt');
    fs.writeFileSync(listPath, concatList);
    
    execSync(`ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y 2>/dev/null`, { stdio: 'pipe' });
    
    // Cleanup temp files
    tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });
    try { fs.unlinkSync(listPath); } catch(e) {}
    
    return outputPath;
  }
  
  return null;
}

/**
 * Add text overlay to video
 */
function addTextOverlay(videoPath, text, outputPath) {
  console.log(`📝 Adding text: ${text}`);
  
  // Escape text for FFmpeg
  const escapedText = text.replace(/'/g, "'").replace(/:/g, '\\:');
  
  try {
    execSync(`ffmpeg -i "${videoPath}" -vf "drawtext=text='${escapedText}':fontcolor=white:fontsize=48:fontfile=/System/Library/Fonts/Helvetica.ttc:x=(w-text_w)/2:y=h-200:shadowcolor=black:shadowdx=2:shadowdy=2" -codec:a copy "${outputPath}" -y 2>/dev/null`, { stdio: 'pipe' });
    return outputPath;
  } catch (e) {
    console.log('⚠️ Text overlay failed, returning original');
    return videoPath;
  }
}

/**
 * Generate complete video from script
 */
async function generateVideoFromScript(scriptId) {
  const script = config.scripts.templates.find(s => s.id === scriptId);
  
  if (!script) {
    console.error(`❌ Script not found: ${scriptId}`);
    console.log('Available scripts:', config.scripts.templates.map(s => s.id).join(', '));
    return;
  }
  
  console.log(`\n🎬 Generating: ${script.title}`);
  console.log(`⏱️ Duration: ${script.duration}s\n`);
  
  const images = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Generate images for each scene
  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const imgPath = path.join(OUTPUT_DIR, `scene_${i}_${timestamp}.jpg`);
    
    await generateImage(scene.prompt, imgPath);
    images.push(imgPath);
  }
  
  // Generate video
  const videoPath = path.join(OUTPUT_DIR, `${scriptId}_${timestamp}.mp4`);
  const resultVideo = await generateVideoFromImages(images, videoPath, script.duration);
  
  if (resultVideo) {
    console.log(`\n✅ Video generated: ${resultVideo}`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
  } else {
    console.log('\n⚠️ Video generation incomplete - images not processed');
    console.log('💡 Use Xiaohongshu text-to-image with these prompts:\n');
    script.scenes.forEach((s, i) => {
      console.log(`Scene ${i+1} (${s.time}): ${s.prompt}\n`);
    });
  }
  
  return resultVideo;
}

/**
 * List available scripts
 */
function listScripts() {
  console.log('\n📋 Available Scripts:\n');
  config.scripts.templates.forEach(s => {
    console.log(`  ${s.id}: ${s.title} (${s.duration}s, ${s.scenes.length} scenes)`);
  });
  console.log();
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (command === '--list' || command === '-l') {
  listScripts();
} else if (command === '--script' && args[1]) {
  generateVideoFromScript(args[1]);
} else if (command === '--random' || command === '-r') {
  const scripts = config.scripts.templates;
  const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
  generateVideoFromScript(randomScript.id);
} else if (command === '--help' || command === '-h') {
  console.log(`
🎬 Rednote Video Generator

Usage:
  node video_generator.js --script <id>    Generate specific script
  node video_generator.js --random         Generate random script
  node video_generator.js --list          List available scripts
  node video_generator.js --help           Show this help

Examples:
  node video_generator.js --script salary_journey
  node video_generator.js --random
  `);
} else {
  console.log(`
🎬 Rednote Video Automation Generator

Usage: node video_generator.js [command]

Commands:
  --script <id>   Generate specific script
  --random        Generate random script  
  --list          List available scripts
  --help          Show help

Example:
  node video_generator.js --random
  `);
}
