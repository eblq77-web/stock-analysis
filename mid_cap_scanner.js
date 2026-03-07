// MID-CAP SCANNER - ¥25-40 Range
// Focus: Mid-cap stocks affordable for smaller capital

const stocks = [
  {code:'600036',name:'招商银行'},
  {code:'600030',name:'中信证券'},
  {code:'600009',name:'上海机场'},
  {code:'600089',name:'特变电工'},
  {code:'000999',name:'华润三九'},
  {code:'600085',name:'同仁堂'},
  {code:'000792',name:'盐湖股份'},
  {code:'600066',name:'宇通客车'},
  {code:'000938',name:'紫光股份'},
  {code:'600038',name:'中直股份'},
  {code:'000651',name:'格力电器'},
  {code:'300045',name:'奥普光电'},
  {code:'300046',name:'台基股份'},
  {code:'000513',name:'丽珠集团'},
  {code:'600096',name:'云天化'}
];

const https = require('https');
let done = 0;
let results = [];

console.log('📊 MID-CAP SCANNER (¥25-40)');
console.log('============================');
console.log('Time: ' + new Date().toLocaleTimeString());
console.log('');

stocks.forEach(s => {
  const prefix = s.code.startsWith('0') ? 'sz' : 'sh';
  https.get('https://qt.gtimg.cn/q='+prefix+s.code, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const p = data.split('~');
      const price = parseFloat(p[3]) || 0;
      const pct = parseFloat(p[32]) || 0;
      results.push({code:s.code, name:s.name, price:price, pct:pct});
      done++;
      if (done === stocks.length) {
        // Sort by % change
        results.sort((a,b) => b.pct - a.pct);
        
        // Filter to ¥25-40 range
        const inRange = results.filter(x => x.price >= 25 && x.price <= 40);
        
        console.log('Code    Name          Price    Change   Status');
        console.log('------------------------------------------------');
        inRange.forEach(x => {
          const sign = x.pct >= 0 ? '+' : '';
          const status = x.pct > 0 ? '✅ BUY' : '❌ SELL';
          console.log(x.code + '   ' + x.name.padEnd(10) + ' ¥' + x.price.toFixed(2).padStart(6) + '  ' + sign + x.pct.toFixed(2) + '%   ' + status);
        });
        
        const wins = inRange.filter(x => x.pct > 0).length;
        console.log('------------------------------------------------');
        console.log('Total in range: ' + inRange.length + ' | BUY signals: ' + wins);
        console.log('');
        
        // Top 3 recommendations
        const top3 = inRange.filter(x => x.pct > 0).slice(0,3);
        if (top3.length > 0) {
          console.log('🎯 TOP 3 RECOMMENDATIONS:');
          top3.forEach((x,i) => {
            console.log('  ' + (i+1) + '. ' + x.code + ' ' + x.name + ' ¥' + x.price.toFixed(2));
          });
        }
      }
    });
  }).on('error', () => { done++; });
});
