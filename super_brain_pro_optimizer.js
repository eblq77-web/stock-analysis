// SUPER BRAIN PRO - AUTO OPTIMIZER
// Runs daily to optimize portfolio picks
// Continuously learns and improves

const fs = require('fs');
const https = require('https');

// Master stock list - all candidates
const MASTER_LIST = [
  // Financial
  {code:'600036',name:'招商银行',sector:'金融',minPrice:25,maxPrice:45},
  {code:'600030',name:'中信证券',sector:'金融',minPrice:20,maxPrice:35},
  {code:'601166',name:'兴业银行',sector:'金融',minPrice:15,maxPrice:30},
  {code:'000001',name:'平安银行',sector:'金融',minPrice:10,maxPrice:20},
  {code:'601398',name:'工商银行',sector:'金融',minPrice:40,maxPrice:60},
  // Consumer
  {code:'000651',name:'格力电器',sector:'家电',minPrice:30,maxPrice:50},
  {code:'000333',name:'美的集团',sector:'家电',minPrice:50,maxPrice:80},
  {code:'600009',name:'上海机场',sector:'交运',minPrice:25,maxPrice:40},
  // Medical
  {code:'600085',name:'同仁堂',sector:'医药',minPrice:25,maxPrice:40},
  {code:'000513',name:'丽珠集团',sector:'医药',minPrice:28,maxPrice:45},
  {code:'000999',name:'华润三九',sector:'医药',minPrice:25,maxPrice:40},
  {code:'600276',name:'恒瑞医药',sector:'医药',minPrice:40,maxPrice:70},
  // Industrial
  {code:'600066',name:'宇通客车',sector:'汽车',minPrice:20,maxPrice:40},
  {code:'600089',name:'特变电工',sector:'新能源',minPrice:25,maxPrice:45},
  {code:'000792',name:'盐湖股份',sector:'化工',minPrice:25,maxPrice:50},
  {code:'600038',name:'中直股份',sector:'军工',minPrice:30,maxPrice:50},
  {code:'000938',name:'紫光股份',sector:'科技',minPrice:20,maxPrice:35},
  {code:'300045',name:'奥普光电',sector:'科技',minPrice:20,maxPrice:40},
  {code:'300046',name:'台基股份',sector:'科技',minPrice:25,maxPrice:45},
  {code:'600096',name:'云天化',sector:'化工',minPrice:25,maxPrice:50},
  // More candidates
  {code:'600519',name:'贵州茅台',sector:'消费',minPrice:1500,maxPrice:2500},
  {code:'000858',name:'五粮液',sector:'消费',minPrice:120,maxPrice:200},
  {code:'002594',name:'比亚迪',sector:'新能源',minPrice:150,maxPrice:300},
  {code:'300750',name:'宁德时代',sector:'新能源',minPrice:150,maxPrice:400},
];

const getPrice = (code) => new Promise(resolve => {
  const prefix = code.startsWith('0') ? 'sz' : 'sh';
  https.get('https://qt.gtimg.cn/q='+prefix+code, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const p = data.split('~');
      resolve({price: parseFloat(p[3])||0, pct: parseFloat(p[32])||0, vol: parseFloat(p[4])||0});
    });
  }).on('error', () => resolve({price:0,pct:0,vol:0}));
});

async function optimize() {
  console.log('🧠 SUPER BRAIN PRO - AUTO OPTIMIZER');
  console.log('=====================================');
  console.log('Date:', new Date().toLocaleDateString());
  console.log('');
  
  // Get live prices
  for (let s of MASTER_LIST) {
    const d = await getPrice(s.code);
    s.price = d.price;
    s.pct = d.pct;
    s.vol = d.vol;
  }
  
  // Filter to valid price range
  const valid = MASTER_LIST.filter(s => s.price >= s.minPrice && s.price <= s.maxPrice && s.price > 0);
  
  // Score each stock
  valid.forEach(s => {
    // Momentum score (0-40)
    s.momentumScore = Math.max(0, 40 - Math.abs(s.pct) * 5);
    // Volume score (0-30) - higher volume = more liquid
    s.volumeScore = Math.min(30, Math.log10(s.vol || 1) * 3);
    // Price range score (0-20) - prefer mid-range
    const midPrice = (s.minPrice + s.maxPrice) / 2;
    s.priceScore = Math.max(0, 20 - Math.abs(s.price - midPrice) / (s.maxPrice - s.minPrice) * 10);
    // Sector score (0-10)
    const goodSectors = ['新能源','医药','科技','军工'];
    s.sectorScore = goodSectors.includes(s.sector) ? 10 : 5;
    // Total
    s.totalScore = Math.round(s.momentumScore + s.volumeScore + s.priceScore + s.sectorScore);
  });
  
  // Sort by score
  valid.sort((a,b) => b.totalScore - a.totalScore);
  
  // Categorize
  const daily = valid.filter(s => s.pct > 2).slice(0,5);
  const mid = valid.filter(s => s.pct > 0 && s.pct <= 2).slice(0,8);
  const long = valid.filter(s => s.pct <= 0 && s.totalScore > 50).slice(0,10);
  
  // Save optimized portfolio
  const portfolio = {
    version: 'V4',
    updated: new Date().toISOString(),
    daily, mid, long,
    top20: valid.slice(0,20),
    stats: {
      totalScanned: valid.length,
      daily: daily.length,
      mid: mid.length,
      long: long.length,
      avgScore: Math.round(valid.reduce((s,x)=>s+x.totalScore,0)/valid.length)
    }
  };
  
  fs.writeFileSync('SUPER_BRAIN_PRO_PORTFOLIO.json', JSON.stringify(portfolio, null, 2));
  
  console.log('✅ OPTIMIZED PORTFOLIO SAVED');
  console.log('============================');
  console.log('Total Scanned:', portfolio.stats.totalScanned);
  console.log('Daily Picks:', daily.length);
  console.log('Mid Picks:', mid.length);
  console.log('Long Picks:', long.length);
  console.log('Avg Score:', portfolio.stats.avgScore);
  console.log('');
  console.log('📊 TOP 10 STOCKS:');
  valid.slice(0,10).forEach((s,i) => {
    const sign = s.pct >= 0 ? '+' : '';
    console.log((i+1) + '. ' + s.code + ' ' + s.name + ' ¥' + s.price.toFixed(2) + ' ' + sign + s.pct.toFixed(2) + '% Score:' + s.totalScore);
  });
  
  return portfolio;
}

optimize();
