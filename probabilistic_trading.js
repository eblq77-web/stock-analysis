/**
 * PROBABILISTIC TRADING V4
 * Fixed change calculation
 */

const { execSync } = require('child_process');

const STOCKS = 'sz300750,sz002475,sz002594,sz300059,sh600519,sh600036,sh601012,sh601318,sz000001,sz000333,bj835670,bj870864,bj872926,bj870299,sz300214,sz300015,sz002340,sz000630';

function parseQuote(data) {
  const results = [];
  const regex = /v_(\w+)="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(data)) !== null) {
    const code = match[1];
    const f = match[2].split('~');
    
    if (f.length > 38) {
      results.push({
        code,
        name: f[1],
        price: parseFloat(f[3]) || 0,
        yesterday: parseFloat(f[2]) || 0,
        change: parseFloat(f[38]) || 0,  // Direct change %
        high: parseFloat(f[5]) || 0,
        low: parseFloat(f[6]) || 0,
        open: parseFloat(f[4]) || 0,
        volume: parseFloat(f[7]) || 0,
        amount: parseFloat(f[8]) || 0,
        turnover: parseFloat(f[37]) || 0,
      });
    }
  }
  return results;
}

function calcProb(s) {
  let score = 40;
  const factors = [];
  
  // Momentum
  if (s.change >= 3 && s.change <= 8) { score += 20; factors.push('Momentum +20'); }
  else if (s.change > 8) { score += 15; factors.push('Breakout +15'); }
  else if (s.change >= 0 && s.change < 3) { score += 5; factors.push('Mild +5'); }
  else if (s.change < -3) { score -= 10; factors.push('Down -10'); }
  
  // Volume (in hands = 100 shares)
  if (s.volume > 5000000) { score += 15; factors.push('HighVol +15'); }
  else if (s.volume > 2000000) { score += 8; factors.push('Vol +8'); }
  
  // Position
  if (s.high > s.low) {
    const pos = ((s.price - s.low) / (s.high - s.low)) * 100;
    if (pos >= 80) { score += 15; factors.push('NearHigh +15'); }
    else if (pos >= 60) { score += 8; factors.push('MidHigh +8'); }
  }
  
  // Turnover
  if (s.turnover >= 5 && s.turnover <= 25) { score += 10; factors.push('HealthyT/O +10'); }
  else if (s.turnover > 25) { score += 5; factors.push('HighT/O +5'); }
  
  // Gap
  if (s.open > s.low * 1.02 && s.change > 0) { score += 10; factors.push('GapUp +10'); }
  
  // Flow
  if (s.amount > 100000000) { score += 10; factors.push('LargeFlow +10'); }
  
  const prob = Math.min(Math.max(score, 15), 92);
  const conf = prob >= 70 ? 'HIGH' : prob >= 55 ? 'MED' : 'LOW';
  const rec = prob >= 70 ? 'BUY' : prob >= 55 ? 'WATCH' : 'WAIT';
  
  return { ...s, prob, conf, rec, factors };
}

try {
  const output = execSync(`curl -s "http://qt.gtimg.cn/q=${STOCKS}" | iconv -f GB18030 -t UTF-8`, { timeout: 15000 });
  const quotes = parseQuote(output.toString());
  const results = quotes.map(calcProb).sort((a, b) => b.prob - a.prob);
  
  console.log('\n🎯 PROBABILISTIC TRADING ANALYSIS');
  console.log('═══════════════════════════════════════════════════');
  console.log(new Date().toLocaleString('zh-CN') + '\n');
  
  results.forEach((r, i) => {
    const e = r.rec === 'BUY' ? '🚀' : r.rec === 'WATCH' ? '👀' : '⏳';
    console.log(`${e} #${i+1} ${r.code.toUpperCase()} | ${r.prob}% | ${r.rec}`);
    console.log(`   ${r.name} | ¥${r.price.toFixed(2)} | ${r.change > 0 ? '+' : ''}${r.change.toFixed(2)}% | V:${(r.volume/10000).toFixed(0)}W | T/O:${r.turnover.toFixed(1)}%`);
    if (r.factors.length > 0) console.log(`   → ${r.factors.join(' | ')}`);
    console.log('');
  });
  
  const buys = results.filter(r => r.rec === 'BUY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📊 ${results.length} stocks | ${buys.length} BUY | ${results.filter(r => r.rec === 'WATCH').length} WATCH\n`);
  
  if (buys.length > 0) {
    buys.forEach(b => {
      const pos = b.prob >= 75 ? '20%' : b.prob >= 65 ? '15%' : '10%';
      console.log(`🎯 ${b.code.toUpperCase()} (${b.name}) - ${b.prob}% WIN PROB`);
      console.log(`   Entry: ¥${b.price.toFixed(2)} | Stop: ¥${(b.price*0.93).toFixed(2)} | Targets: ¥${(b.price*1.05).toFixed(2)} / ¥${(b.price*1.10).toFixed(2)}`);
      console.log(`   Position: ${pos} | Kelly: ${(b.prob/100*2-0.7).toFixed(2)}`);
      console.log('');
    });
  }
} catch(e) {
  console.log('Error:', e.message);
}
