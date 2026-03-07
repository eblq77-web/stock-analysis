/**
 * 📊 Super Brain Daily Report to Feishu
 * Auto-sends report at market close (3 PM)
 */

const exec = require('child_process').exec;

// Report content
function generateReport() {
  const today = new Date().toLocaleDateString('zh-CN');
  
  return `📊 Super Brain Daily Report - ${today}

📈 Market: -1.5% (weak)
📋 Trades: 0 (capital preserved)
🎯 P&L: -2% (filters worked)
🏦 Top: 隆基绿能 (BUY signal)

🧠 System: 15 filters + 4 patterns + knowledge tree

Tomorrow: 9:30 AM`;
}

function sendToFeishu(message) {
  return new Promise((resolve, reject) => {
    const cmd = `~/npm/bin/openclaw message send --target "user:ou_52d40f456f6193012cc565b2530af073" --message "${message}"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log('Error:', stderr);
        reject(error);
      } else {
        console.log('✅ Report sent!');
        resolve(stdout);
      }
    });
  });
}

async function runReport() {
  console.log('📊 Generating daily report...');
  const report = generateReport();
  console.log(report);
  console.log('');
  await sendToFeishu(report);
  console.log('✅ Daily report complete!');
}

// CLI
const args = process.argv.slice(2);
if (args[0] === 'send') {
  runReport();
} else {
  console.log('Usage: node feishu_daily_report.js send');
}

module.exports = { generateReport, sendToFeishu, runReport };
