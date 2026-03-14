/**
 * Signal Service Runner
 * Combines V3 scanning + Feishu distribution
 * Run via: node signal_service/run_signal_service.js
 */

const SignalGenerator = require('./signal_generator');
const FeishuSender = require('./feishu_sender');

class SignalService {
  constructor() {
    this.generator = new SignalGenerator();
    this.sender = new FeishuSender();
    this.config = {
      // Default target - can be overridden
      targetChat: process.env.FEISHU_CHAT_ID || 'me',
      // When to send
      morningSendTime: '08:30',
      middaySendTime: '11:30',
      eveningSendTime: '15:30'
    };
  }

  // Run full pipeline
  async run() {
    console.log('⚡ V3 Signal Service Starting...');
    console.log('='.repeat(50));
    
    try {
      // Step 1: Generate signals from V3
      console.log('\n📡 Step 1: Generating signals from V3...');
      const result = await this.generator.generate();
      
      if (result.raw.length === 0) {
        console.log('⚠️ No signals generated this run');
      } else {
        console.log(`✅ Generated ${result.raw.length} signals`);
      }
      
      // Step 2: Format for different channels
      console.log('\n📝 Step 2: Formatting for channels...');
      const feishuFormat = result.feishu;
      const telegramFormat = result.telegram;
      
      // Step 3: Output results
      console.log('\n📤 Step 3: Signal Summary');
      console.log('-'.repeat(30));
      console.log(feishuFormat.content);
      
      if (feishuFormat.fields) {
        feishuFormat.fields.forEach((f, i) => {
          console.log(`${i+1}. ${f.code} ${f.name} | ¥${f.price} | ${f.change}% | ${f.rec}`);
        });
      }
      
      // Step 4: Return formatted data for sending
      console.log('\n✅ Signal Service Complete!');
      
      return {
        success: true,
        signalCount: result.raw.length,
        feishu: feishuFormat,
        telegram: telegramFormat,
        timestamp: result.timestamp
      };
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send to Feishu
  async sendToFeishu() {
    const result = await this.run();
    
    if (result.success && result.signalCount > 0) {
      // Store for sending - actual send handled by cron job
      console.log('\n📤 Ready to send to Feishu:');
      console.log(result.feishu.title);
      return result.feishu;
    }
    
    return null;
  }

  // Check if it's time to send
  shouldSend() {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const sendTimes = [
      this.config.morningSendTime,
      this.config.middaySendTime,
      this.config.eveningSendTime
    ];
    
    return sendTimes.includes(time);
  }
}

// Main execution
if (require.main === module) {
  const service = new SignalService();
  
  // Check for CLI arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--send')) {
    // Run and prepare to send
    service.run().then(result => {
      console.log('\n🎯 Use feishu message to send:');
      console.log(result.feishu.content);
    });
  } else if (args.includes('--test')) {
    // Test mode - just show what would be sent
    console.log('🧪 Test Mode\n');
    service.run().then(result => {
      console.log('\n' + '='.repeat(50));
      console.log('This is what would be sent to subscribers:');
      console.log('='.repeat(50));
      console.log(result.telegram);
    });
  } else {
    // Default: run and display
    service.run().then(result => {
      console.log('\n📊 Run with:');
      console.log('  --test    : Preview what would be sent');
      console.log('  --send    : Run and prepare for sending');
    });
  }
}

module.exports = SignalService;
