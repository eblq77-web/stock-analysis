#!/usr/bin/env node
/**
 * 🧠 SUPER BRAIN SELF-LEARNING ENGINE (Fixed)
 * Uses curl for data fetching
 */

const { execSync } = require('child_process');
const fs = require('fs');

const DATA_DIR = '/Users/liu/Desktop/Stock_Analysis/self_learning';
const LOG_FILE = `${DATA_DIR}/practice_log.md`;
const SCORES_FILE = `${DATA_DIR}/scores.json`;

function curlQuotes(codes) {
  try {
    const cmd = `curl -s "http://qt.gtimg.cn/q=${codes.join(',')}" | iconv -f GB18030 -t UTF-8`;
    const output = execSync(cmd, { timeout: 10000 });
    
    const lines = output.toString().trim().split('\n');
    return lines.map(line => {
      const parts = line.split('~');
      if (!parts[1] || !parts[3]) return null;
      return {
        code: parts[0].replace('v=', ''),
        name: parts[1],
        price: parseFloat(parts[3]) || 0,
        change: parseFloat(parts[4]) || 0,
        volume: parseInt(parts[5]) || 0
      };
    }).filter(s => s && s.price > 0);
  } catch (e) {
    console.error('Fetch error:', e.message);
    return [];
  }
}

async function dailyPractice() {
  console.log('\n' + '='.repeat(50));
  console.log('🧠 SUPER BRAIN DAILY PRACTICE');
  console.log('📅 ' + new Date().toLocaleString());
  console.log('='.repeat(50));
  
  const stocks = curlQuotes([
    'sh600519','sh000333','sz002594','sh600276','sz300750',
    'sh601012','sh600036','sh601398','sh601288','sz000001'
  ]);
  
  console.log(`📊 Fetched ${stocks.length} stocks`);
  
  // Quick momentum analysis
  const momentum = stocks
    .map(s => ({ ...s, score: Math.abs(s.change) * 5 + (s.volume > 10000000 ? 20 : 0) }))
    .sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 TOP MOMENTUM:');
  momentum.slice(0, 5).forEach((s, i) => {
    console.log(`   ${i+1}. ${s.name}: ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% | Score: ${s.score}`);
  });
  
  const totalScore = momentum.reduce((sum, s) => sum + s.score, 0);
  
  console.log('\n📊 DAILY PRACTICE SUMMARY');
  console.log('='.repeat(50));
  console.log(`   🏆 Total Score: ${totalScore.toFixed(0)}`);
  console.log(`   📈 Stocks Analyzed: ${stocks.length}`);
  console.log('='.repeat(50));
  
  const logEntry = `\n## ${new Date().toISOString().split('T')[0]}
- Score: ${totalScore.toFixed(0)}
- Stocks: ${stocks.length}
`;
  fs.appendFileSync(LOG_FILE, logEntry);
  
  console.log('✅ Practice complete!');
}

dailyPractice();
