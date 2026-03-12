/**
 * Super Brain Video Generator
 * Creates promotional videos for stock picks using MiniMax API
 * 
 * Usage: node video_generator.js [prompt] [model] [duration]
 * Example: node video_generator.js "Stock market rising, bullish trend" MiniMax-Hailuo-2.3 6
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.MINIMAX_API_KEY || 'your-api-key-here';
const API_BASE = 'https://api.minimaxi.com';

// Available models
const MODELS = {
  'hailuo2.3': 'MiniMax-Hailuo-2.3',
  'hailuo02': 'MiniMax-Hailuo-02',
  'director': 'T2V-01-Director',
  't2v01': 'T2V-01'
};

// Stock-themed video prompts
const STOCK_PROMPTS = {
  bullish: 'Stock market trending upward, bullish momentum, green candles rising, financial district skyline, professional trading environment',
  breakout: 'Stock breaking through resistance level, explosive growth, rocket launching, celebration confetti, success achievement',
  momentum: 'Fast-paced stock trading, dynamic lines, energy flowing, modern technology, digital data streams',
  stable: 'Stable market growth, steady upward line, blue and green gradient, calm professional atmosphere',
  warning: 'Stock market warning sign, caution, yellow and orange tones, alert symbol, careful analysis'
};

class VideoGenerator {
  constructor() {
    this.taskId = null;
    this.outputDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Generate video
  async generate(prompt, model = 'MiniMax-Hailuo-2.3', duration = 6, resolution = '768P') {
    console.log('🎬 Generating Video...');
    console.log('   Prompt:', prompt);
    console.log('   Model:', model);
    console.log('   Duration:', duration + 's');
    console.log('   Resolution:', resolution);

    const data = JSON.stringify({
      model: model,
      prompt: prompt,
      duration: duration,
      resolution: resolution,
      prompt_optimizer: true,
      aigc_watermark: false
    });

    const options = {
      hostname: 'api.minimaxi.com',
      path: '/v1/video_generation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.task_id) {
              this.taskId = result.task_id;
              console.log('✅ Task created:', this.taskId);
              resolve(result);
            } else {
              console.log('❌ Error:', result.base_resp?.status_msg || body);
              reject(new Error(result.base_resp?.status_msg || 'Failed to create task'));
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

  // Query task status
  async queryStatus(taskId) {
    const options = {
      hostname: 'api.minimaxi.com',
      path: `/v1/video_generation/query?task_id=${taskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Download video
  async download(fileId, filename) {
    const options = {
      hostname: 'api.minimaxi.com',
      path: `/v1/video_generation/download?file_id=${fileId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const outputPath = path.join(this.outputDir, filename);

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        const file = fs.createWriteStream(outputPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('✅ Video saved:', outputPath);
          resolve(outputPath);
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Wait for task completion
  async waitForCompletion(taskId, maxAttempts = 60) {
    console.log('⏳ Waiting for video generation...');
    
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.queryStatus(taskId);
      console.log(`   Status: ${status.status} (${i + 1}/${maxAttempts})`);
      
      if (status.status === 'success') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error('Video generation failed');
      }
      
      await new Promise(r => setTimeout(r, 5000));
    }
    
    throw new Error('Timeout waiting for video generation');
  }

  // Create stock promotion video
  async createStockVideo(stockName, stockCode, price, change, type = 'bullish') {
    const prompt = STOCK_PROMPTS[type] || STOCK_PROMPTS.bullish;
    const fullPrompt = `${stockName} (${stockCode}) trading at ¥${price}, ${change}% ${change > 0 ? 'gain' : 'loss'}. ${prompt}`;
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${stockCode}_${timestamp}.mp4`;
    
    await this.generate(fullPrompt);
    const result = await this.waitForCompletion(this.taskId);
    await this.download(result.file_id, filename);
    
    return filename;
  }

  // Interactive mode
  async interactive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (q) => new Promise(r => rl.question(q, r));

    console.log('\n🎬 Super Brain Video Generator\n');
    console.log('1. Bullish (上涨)');
    console.log('2. Breakout (突破)');
    console.log('3. Momentum (动量)');
    console.log('4. Stable (稳定)');
    console.log('5. Warning (警告)');

    const typeNum = await question('\nSelect video type (1-5): ');
    const types = ['bullish', 'breakout', 'momentum', 'stable', 'warning'];
    const type = types[typeNum - 1] || 'bullish';

    const stockName = await question('Stock name (e.g., 宁德时代): ');
    const stockCode = await question('Stock code (e.g., 300750): ');
    const price = await question('Current price (e.g., 380): ');
    const change = await question('Change % (e.g., +5.2): ');

    try {
      await this.createStockVideo(stockName, stockCode, price, change, type);
      console.log('\n✅ Video generation complete!');
    } catch (e) {
      console.log('\n❌ Error:', e.message);
    }

    rl.close();
  }
}

// CLI
const args = process.argv.slice(2);
const generator = new VideoGenerator();

if (args.length > 0) {
  // Command line mode
  const prompt = args[0];
  const model = args[1] || 'MiniMax-Hailuo-2.3';
  const duration = parseInt(args[2]) || 6;
  
  generator.generate(prompt, model, duration)
    .then(() => generator.waitForCompletion(generator.taskId))
    .then(result => {
      console.log('✅ Video ready!', result);
      process.exit(0);
    })
    .catch(e => {
      console.log('❌ Error:', e.message);
      process.exit(1);
    });
} else {
  // Interactive mode
  generator.interactive();
}

module.exports = VideoGenerator;
