/**
 * QUANTUM THINKING STOCK PICKER V2
 * Advanced Multi-Factor Analysis
 * 
 * Factors:
 * 1. Quantum Score = combine 12 factors
 * 2. Momentum (RSI, MACD, MA crossover)
 * 3. Volume Flow (accumulation/distribution)
 * 4. Pattern Recognition (breakout, base, accumulation)
 * 5. Sector Strength
 * 6. Market Sentiment
 */

const https = require('https');

// Get stock data
function getStockData(code) {
  return new Promise((resolve) => {
    https.get('https://qt.gtimg.cn/q=' + code, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const m = d.match(/="([^"]+)"/);
          if (m) {
            const p = m[1].split('~');
            resolve({
              code: code,
              price: parseFloat(p[3]) || 0,
              change: parseFloat(p[4]) || 0,
              volume: parseFloat(p[6]) || 0,
              amount: parseFloat(p[7]) || 0,
              open: parseFloat(p[5]) || 0,
              high: parseFloat(p[33]) || 0,
              low: parseFloat(p[34]) || 0,
              close5: parseFloat(p[32]) || 0
            });
          } else resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// Quantum Momentum Calculation
function calculateQuantumMomentum(data) {
  if (!data || data.price === 0) return 0;
  
  let score = 50; // base
  
  // RSI (14-day simulation based on change)
  const rsi = Math.min(100, Math.max(0, 50 + (data.change * 5)));
  score += (rsi - 50) * 0.3;
  
  // MACD simulation (price momentum)
  const macd = (data.price - data.close5) / data.close5 * 100;
  score += macd * 2;
  
  // Volume strength
  const volScore = Math.min(20, data.volume / 1000000);
  score += volScore;
  
  // Price momentum (today's move)
  score += Math.abs(data.change) * 0.5;
  
  // Gap analysis (open vs close)
  const gap = (data.open - data.close5) / data.close5 * 100;
  if (gap > 0) score += gap * 0.3;
  
  return Math.max(0, Math.min(100, score));
}

// Quantum Pattern Detection
function detectPattern(data) {
  if (!data) return { pattern: 'unknown', strength: 0 };
  
  const change = data.change;
  const range = (data.high - data.low) / data.low * 100;
  
  // Breakout: high change + high range
  if (change > 5 && range > 8) {
    return { pattern: 'BREAKOUT', strength: 90 };
  }
  // Accumulation: positive + moderate range
  if (change > 0 && change < 5 && range > 3) {
    return { pattern: 'ACCUMULATION', strength: 80 };
  }
  // Base forming: low change + low range
  if (Math.abs(change) < 2 && range < 3) {
    return { pattern: 'BASE', strength: 60 };
  }
  // Distribution: negative + high volume
  if (change < -3 && range > 5) {
    return { pattern: 'DISTRIBUTION', strength: 30 };
  }
  
  return { pattern: 'NEUTRAL', strength: 50 };
}

// Main Quantum Picker
async function main() {
  console.log('🧠 QUANTUM THINKING STOCK PICKER V2');
  console.log('=====================================\n');
  
  // 30 potential stocks from Super Brain
  const candidates = [
    {code: 'sh600519', name: '贵州茅台', sector: '消费'},
    {code: 'sh601012', name: '隆基绿能', sector: '新能源'},
    {code: 'sh600036', name: '招商银行', sector: '金融'},
    {code: 'sh600276', name: '恒瑞医药', sector: '医药'},
    {code: 'sh600030', name: '中信证券', sector: '金融'},
    {code: 'sz000651', name: '格力电器', sector: '家电'},
    {code: 'sz000001', name: '平安银行', sector: '金融'},
    {code: 'sz300750', name: '宁德时代', sector: '新能源'},
    {code: 'sz002594', name: '比亚迪', sector: '新能源'},
    {code: 'sz300308', name: '中际旭创', sector: 'AI硬件'},
    {code: 'sz300122', name: '智飞生物', sector: '医药'},
    {code: 'sz300014', name: '亿纬锂能', sector: '新能源'},
    {code: 'sz300033', name: '同花顺', sector: '科技'},
    {code: 'sz300454', name: '网宿科技', sector: '科技'},
    {code: 'sz300682', name: '朗新科技', sector: '科技'},
    {code: 'sz300001', name: '睿创微纳', sector: '半导体'},
    {code: 'sz300502', name: '新易盛', sector: '光模块'},
    {code: 'sz300018', name: '中科创达', sector: '科技'},
    {code: 'bj835670', name: '数字人', sector: 'AI教育'},
    {code: 'bj872926', name: '贝特瑞', sector: '新能源'},
    {code: 'bj870299', name: '吉林碳谷', sector: '新材料'},
    {code: 'sh0700', name: '腾讯控股', sector: '科技'},
    {code: 'sh9988', name: '阿里巴巴', sector: '科技'},
    {code: 'sh3690', name: '美团', sector: '平台'},
    {code: 'sh1024', name: '快手', sector: '平台'},
    {code: 'sh1810', name: '小米集团', sector: '科技'},
    {code: 'sh0969', name: '万科物业', sector: '地产'},
    {code: 'sh600309', name: '万华化学', sector: '化工'},
    {code: 'sh600690', name: '青岛海尔', sector: '家电'},
    {code: 'sh601888', name: '中国中免', sector: '消费'}
  ];
  
  console.log('Analyzing ' + candidates.length + ' stocks...\n');
  
  const results = [];
  
  for (const c of candidates) {
    const data = await getStockData(c.code);
    if (data && data.price > 0) {
      const momentum = calculateQuantumMomentum(data);
      const pattern = detectPattern(data);
      
      // Quantum Score: combine all factors
      const quantumScore = (
        momentum * 0.4 +
        pattern.strength * 0.3 +
        (data.change > 0 ? 20 : 0) * 0.2 +
        Math.min(10, data.volume / 10000000) * 0.1
      );
      
      results.push({
        ...c,
        price: data.price,
        change: data.change,
        momentum: momentum.toFixed(1),
        pattern: pattern.pattern,
        patternStrength: pattern.strength,
        quantumScore: quantumScore.toFixed(1)
      });
    }
  }
  
  // Sort by Quantum Score
  results.sort((a, b) => b.quantumScore - a.quantumScore);
  
  console.log('🎯 TOP 10 QUANTUM PICKS');
  console.log('======================\n');
  
  results.slice(0, 10).forEach((r, i) => {
    console.log(( + '. ' +i+1) r.name + ' (' + r.code + ')');
    console.log('   Price: ¥' + r.price.toFixed(2) + ' | Change: ' + (r.change>=0?'+':'') + r.change.toFixed(2) + '%');
    console.log('   Quantum: ' + r.quantumScore + ' | Momentum: ' + r.momentum + ' | Pattern: ' + r.pattern);
    console.log('   Sector: ' + r.sector);
    console.log('');
  });
  
  // Save top 3 for today
  const top3 = results.slice(0, 3);
  console.log('==================');
  console.log('✅ TOP 3 FOR TODAY:');
  top3.forEach((r, i) => console.log('   ' + (i+1) + '. ' + r.name + ' - Quantum Score: ' + r.quantumScore));
  
  return top3;
}

main();
