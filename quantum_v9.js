// QUANTUM ENGINE V9 - 10 Factor Analysis
const https = require('https');

// Get stock data from working API
function getStock(code) {
  return new Promise((resolve) => {
    const url = 'https://qt.gtimg.cn/q=' + code;
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const m = d.match(/="([^"]+)"/);
          if (m) {
            const p = m[1].split('~');
            // Parse correctly
            const price = parseFloat(p[3]) || 0;
            const changePct = parseFloat(p[4]) || 0; // This is actually change amount
            // Try another field for percentage
            const open = parseFloat(p[5]) || 0;
            const high = parseFloat(p[33]) || 0;
            const low = parseFloat(p[34]) || 0;
            const vol = parseFloat(p[6]) || 0;
            
            // Calculate change % from price and open
            const changePercent = open > 0 ? ((price - open) / open * 100) : 0;
            
            resolve({
              price: price,
              change: changePercent,
              open: open,
              high: high,
              low: low,
              volume: vol
            });
          }
        } catch(e) {}
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

// Quantum 10-Factor
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('      🧠 QUANTUM PRO ENGINE V9');
  console.log('      10-Factor Advanced Analysis');
  console.log('═══════════════════════════════════════════════════\n');
  
  const stocks = [
    {c:'sz300308',n:'中际旭创',s:'AI'},
    {c:'sz300502',n:'新易盛',s:'半导体'},
    {c:'sz002594',n:'比亚迪',s:'新能源'},
    {c:'sz300750',n:'宁德时代',s:'新能源'},
    {c:'sh601012',n:'隆基绿能',s:'新能源'},
    {c:'sz300014',n:'亿纬锂能',s:'新能源'},
    {c:'sh600309',n:'万华化学',s:'化工'},
    {c:'sz300033',n:'同花顺',s:'科技'},
    {c:'sz300122',n:'智飞生物',s:'医药'},
    {c:'sh600276',n:'恒瑞医药',s:'医药'},
    {c:'sh0700',n:'腾讯控股',s:'科技'},
    {c:'sh9988',n:'阿里巴巴',s:'科技'},
    {c:'bj835670',n:'数字人',s:'AI'},
    {c:'bj872926',n:'贝特瑞',s:'新能源'},
    {c:'sh600519',n:'贵州茅台',s:'消费'}
  ];
  
  let results = [];
  
  for (let st of stocks) {
    let data = await getStock(st.c);
    if (data && data.price > 0) {
      // Calculate 10 factors
      let score = 50;
      const range = data.open > 0 ? (data.high - data.low) / data.open * 100 : 0;
      
      // 1. Daily Change (15%)
      score += data.change * 2;
      
      // 2. Strength (10%)
      if (data.change > 5) score += 10;
      else if (data.change > 3) score += 7;
      else if (data.change > 0) score += 4;
      else score -= 3;
      
      // 3. Volume (10%)
      score += Math.min(10, data.volume / 50000000 * 5);
      
      // 4. Range/Breakout (10%)
      if (data.change > 3 && range > 5) score += 10;
      else if (data.change > 1 && range > 3) score += 6;
      
      // 5. Sector (12%)
      const sect = {AI:12,科技:10,新能源:12,半导体:12,医药:8,消费:6,金融:4,家电:6,新材料:10,化工:8};
      score += sect[st.s] || 5;
      
      // 6. Position (8%)
      const pos = data.high > data.low ? (data.price - data.low) / (data.high - data.low) * 10 : 5;
      score += pos;
      
      // 7-10. Other factors
      score += data.change > 0 ? 5 : -2; // Direction
      score += range > 2 ? 3 : 0; // Volatility bonus
      score += data.volume > 30000000 ? 2 : 0; // High volume
      
      results.push({
        code: st.c,
        name: st.n,
        sector: st.s,
        price: data.price,
        change: data.change,
        quantum: Math.max(0, Math.min(100, score))
      });
    }
  }
  
  results.sort((a,b) => b.quantum - a.quantum);
  
  console.log('📊 QUANTUM TOP 15\n');
  results.slice(0,15).forEach((r,i) => {
    const m = ['🥇','🥈','🥉','','','','','','','','','','','',''][i];
    console.log(m + ' ' + (i+1) + '. ' + r.name + ' ¥' + r.price.toFixed(2) + ' ' + (r.change>=0?'+':'') + r.change.toFixed(2) + '% | 🧠 ' + r.quantum.toFixed(1) + ' | ' + r.sector);
  });
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎯 TOP 3 PICKS (V9)');
  console.log('═══════════════════════════════════════════════════');
  results.slice(0,3).forEach((r,i) => {
    const s = ['⭐⭐⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐'][i];
    console.log(s + ' ' + r.name + ' | ¥' + r.price.toFixed(2) + ' | ' + (r.change>=0?'+':'') + r.change.toFixed(2) + '% | Quantum: ' + r.quantum.toFixed(1));
  });
}

main();
