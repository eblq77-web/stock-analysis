// CHARLES SUPER BRAIN - PORTFOLIO PACKS
// Daily / Mid-term / Long-term分类
// Price Range: ¥25-40 (affordable mid-cap)

const stocks = [
  // === DAILY (日内交易) - High Momentum, same day/1-3 days ===
  {code:'600066',name:'宇通客车',cat:'DAILY',sector:'汽车'},
  {code:'600089',name:'特变电工',cat:'DAILY',sector:'新能源'},
  {code:'000792',name:'盐湖股份',cat:'DAILY',sector:'化工'},
  
  // === MID-TERM (中期交易) - 2-4 weeks hold ===
  {code:'600030',name:'中信证券',cat:'MID',sector:'金融'},
  {code:'000513',name:'丽珠集团',cat:'MID',sector:'医药'},
  {code:'600009',name:'上海机场',cat:'MID',sector:'交运'},
  {code:'600085',name:'同仁堂',cat:'MID',sector:'医药'},
  
  // === LONG-TERM (长期交易) - 1-3 months ===
  {code:'000651',name:'格力电器',cat:'LONG',sector:'家电'},
  {code:'600036',name:'招商银行',cat:'LONG',sector:'金融'},
  {code:'600038',name:'中直股份',cat:'LONG',sector:'军工'},
  {code:'000999',name:'华润三九',cat:'LONG',sector:'医药'},
  {code:'300045',name:'奥普光电',cat:'LONG',sector:'科技'}
];

const https = require('https');
let done = 0;

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          CHARLES SUPER BRAIN - STOCK PORTFOLIO               ║');
console.log('║                    2026-03-05                                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

stocks.forEach(s => {
  const prefix = s.code.startsWith('0') ? 'sz' : 'sh';
  https.get('https://qt.gtimg.cn/q='+prefix+s.code, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const p = data.split('~');
      s.price = parseFloat(p[3]) || 0;
      s.pct = parseFloat(p[32]) || 0;
      done++;
      if (done === stocks.length) {
        
        // Daily
        console.log('');
        console.log('📅 DAILY TRADING (日内交易) - High Momentum ⭐');
        console.log('   Hold: 1-3 days | Target: +5% | Stop: -3%');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        stocks.filter(x=>x.cat==='DAILY').sort((a,b)=>b.pct-a.pct).forEach(x => {
          const sign = x.pct>=0?'+':'';
          const star = x.pct>3?'🚀':'';
          console.log('   ' + x.code + ' ' + x.name.padEnd(8) + ' ¥' + x.price.toFixed(2).padStart(6) + '  ' + sign + x.pct.toFixed(2) + '% ' + star);
        });
        
        // Mid
        console.log('');
        console.log('📅 MID-TERM (中期交易) - 2-4 Weeks');
        console.log('   Hold: 2-4 weeks | Target: +10% | Stop: -5%');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        stocks.filter(x=>x.cat==='MID').sort((a,b)=>b.pct-a.pct).forEach(x => {
          const sign = x.pct>=0?'+':'';
          console.log('   ' + x.code + ' ' + x.name.padEnd(8) + ' ¥' + x.price.toFixed(2).padStart(6) + '  ' + sign + x.pct.toFixed(2) + '%');
        });
        
        // Long
        console.log('');
        console.log('📅 LONG-TERM (长期交易) - 1-3 Months');
        console.log('   Hold: 1-3 months | Target: +20% | Stop: -7%');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        stocks.filter(x=>x.cat==='LONG').sort((a,b)=>b.pct-a.pct).forEach(x => {
          const sign = x.pct>=0?'+':'';
          console.log('   ' + x.code + ' ' + x.name.padEnd(8) + ' ¥' + x.price.toFixed(2).padStart(6) + '  ' + sign + x.pct.toFixed(2) + '%');
        });
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const daily = stocks.filter(x=>x.cat==='DAILY'&&x.pct>0);
        const mid = stocks.filter(x=>x.cat==='MID'&&x.pct>0);
        const long = stocks.filter(x=>x.cat==='LONG'&&x.pct>0);
        console.log('✅ ACTIVE PICKS: Daily ' + daily.length + ' | Mid ' + mid.length + ' | Long ' + long.length);
        console.log('💰 All prices in ¥25-40 range (affordable for smaller capital)');
      }
    });
  }).on('error', () => { done++; });
});
