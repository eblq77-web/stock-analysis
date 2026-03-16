#!/usr/bin/env node

/**
 * MiniMax Video Generation API
 * Direct API integration for video generation
 */

const https = require('https');

const API_HOST = 'api.minimaxi.com';
const API_BASE = `/v1/video_generation`;

const API_KEY = process.env.MINIMAX_API_KEY || '';

const PROMPTS = {
  salary_journey: "A person receives salary on Day 1 looking happy with gold coins, then money flies away as rent is paid, wallet deflates like a balloon, empty pockets with tumbleweed, water leaking through a sieve - comedic meme style",
  coffee_life: "A person looking like a zombie in the morning without coffee, then a magical coffee machine with golden rays appears, the person transforms from dead to alive with eyes opening dramatically, ends as a superhero with coffee cup - comedic animation",
  monday_mood: "Friday night party with disco lights and happy dancing person, sudden alarm clock flashing red at 6AM Monday morning, person hitting snooze button repeatedly, zombie walking on grey street - relatable meme style",
  meeting_reality: "Professional meeting room with people around table, person staring blankly with bubbles floating, suddenly on beach with cocktail paradise, back to meeting sweating, fake nod and smile - sarcastic meme",
  growth_opportunity: "Job interview scene with businessman giving thumbs up, growth chart going up while dollar sign fades, confused person with question marks, awkward silence with sweat drops, microphone drops with explosion - funny corporate meme"
};

function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);
    const options = {
      hostname: API_HOST,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
}

async function createVideoTask(prompt, model = 'video-01') {
  console.log('📝 Creating video generation task...');
  const response = await makeRequest(API_BASE, { model, prompt });
  console.log('Response:', JSON.stringify(response, null, 2));
  if (response.base_resp?.status_code === 0) {
    return response.task_id;
  } else {
    throw new Error(response.base_resp?.status_msg || 'Failed to create task');
  }
}

async function queryVideoTask(taskId) {
  console.log(`\n🔍 Querying task: ${taskId}...`);
  return await makeRequest(`${API_BASE}/query`, { task_id: taskId });
}

async function generateVideo(prompt, model = 'video-01') {
  if (!API_KEY) {
    console.log('❌ No API key! Set: export MINIMAX_API_KEY="your-key"');
    return;
  }
  
  console.log('🎬 MiniMax Video Generation\n');
  
  try {
    const taskId = await createVideoTask(prompt, model);
    console.log(`✅ Task created: ${taskId}\n`);
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      const result = await queryVideoTask(taskId);
      
      if (result.base_resp?.status_code === 0) {
        const status = result.status || 'Processing';
        console.log(`Status: ${status} (${attempts + 1}/${maxAttempts})`);
        
        if (status === 'Success' || status === 'completed') {
          console.log('\n✅ Video generated!');
          console.log(`Task ID: ${taskId}`);
          return taskId;
        } else if (status === 'Fail' || status === 'failed') {
          throw new Error('Video generation failed');
        }
      }
      attempts++;
    }
    
    console.log(`\n⏰ Still processing... Task ID: ${taskId}`);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('\n📋 Scripts:\n');
  Object.keys(PROMPTS).forEach(k => console.log(`  ${k}`));
} else if (args.includes('--script') || args.includes('-s')) {
  const idx = args.indexOf('--script') + 1 || args.indexOf('-s') + 1;
  const name = args[idx];
  if (PROMPTS[name]) generateVideo(PROMPTS[name]);
  else console.log('Not found. Use --list');
} else if (args.includes('--prompt') || args.includes('-p')) {
  const idx = args.indexOf('--prompt') + 1 || args.indexOf('-p') + 1;
  generateVideo(args.slice(idx).join(' '));
} else {
  console.log('Usage: node minimax_video.js --script coffee_life');
}
