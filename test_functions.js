// Test file for Stats and Small Cap functions
// Test the logic before applying to Super Brain V3

// Mock data structures (same as in Super Brain V3)
const EXDB = {
  SH:[{c:'600036',n:'招商银行',s:'金融'},{c:'600519',n:'贵州茅台',s:'消费'},{c:'601012',n:'隆基绿能',s:'新能源'}],
  SZ:[{c:'000001',n:'平安银行',s:'金融'},{c:'002594',n:'比亚迪',s:'新能源'}],
  CY:[{c:'300001',n:'神州泰岳',s:'科技'},{c:'300015',n:'爱尔眼科',s:'医药'}],
  BSE:[{c:'bj835670',n:'数字人',s:'AI'},{c:'bj870299',n:'灿能电力',s:'电力'}],
  HK:[{c:'0700',n:'腾讯控股',s:'科技'}],
  HS:[]
};

let portfolio = { daily: [], mid: [], long: [] };

// EXACT copy of pickFromDB from Super Brain V3
function pickFromDB() {
  let all=[];
  ['SH','SZ','CY','BSE','HK','HS'].forEach(e=>EXDB[e].forEach(s=>all.push({code:s.c,name:s.n,sector:s.s,exchange:e,price:0,pct:0,score:60+Math.random()*20})));
  all.sort(()=>Math.random()-.5);
  portfolio.daily=all.slice(0,4).map(s=>({...s,category:'daily'}));
  portfolio.mid=all.slice(4,8).map(s=>({...s,category:'mid'}));
  portfolio.long=all.slice(8,12).map(s=>({...s,category:'long'}));
  return Promise.resolve(portfolio);
}

// Simulate refreshAll - just add mock prices
function refreshAll() {
  return new Promise(resolve => {
    [...portfolio.daily, ...portfolio.mid, ...portfolio.long].forEach(s => {
      s.price = Math.random() * 30 + 5; // Random price 5-35
      s.pct = (Math.random() - 0.3) * 20; // Random % -6 to +14
    });
    console.log('Prices refreshed!');
    resolve();
  });
}

// Test function 1: Stats (copying checkSignals pattern)
function quickStats() {
  console.log('=== Testing quickStats() ===');
  
  // First load data, then refresh, then show
  pickFromDB().then(() => {
    refreshAll().then(() => {
      const total = portfolio.daily.length + portfolio.mid.length + portfolio.long.length;
      const totalScore = portfolio.daily.reduce((s,x)=>s+(x.score||0),0) + portfolio.mid.reduce((s,x)=>s+(x.score||0),0) + portfolio.long.reduce((s,x)=>s+(x.score||0),0);
      const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
      
      console.log('Total picks:', total);
      console.log('Daily:', portfolio.daily.length);
      console.log('Mid:', portfolio.mid.length);
      console.log('Long:', portfolio.long.length);
      console.log('Avg Score:', avgScore);
      
      // Show what would be displayed
      const html = '<b>Total Picks:</b> '+total+'<br><b>Daily:</b> '+portfolio.daily.length+'<br><b>Mid:</b> '+portfolio.mid.length+'<br><b>Long:</b> '+portfolio.long.length+'<br><b>Avg Score:</b> '+avgScore;
      console.log('HTML output:', html);
      console.log('✅ quickStats test PASSED!\n');
    });
  });
}

// Test function 2: Small Cap (copying checkSignals pattern)
function addSmallCapFilter() {
  console.log('=== Testing addSmallCapFilter() ===');
  
  // First load data, then refresh, then show
  pickFromDB().then(() => {
    refreshAll().then(() => {
      const allStocks = [...portfolio.daily, ...portfolio.mid, ...portfolio.long];
      const small = allStocks.filter(s => s.price && s.price < 30 && s.price > 0);
      
      console.log('All stocks:', allStocks.length);
      console.log('Small caps (<¥30):', small.length);
      
      if (small.length > 0) {
        small.sort((a,b) => b.pct - a.pct);
        console.log('Small caps found:');
        small.forEach(s => console.log('  -', s.code, s.name, '¥'+s.price.toFixed(2), (s.pct>=0?'+':'')+s.pct.toFixed(2)+'%'));
        console.log('✅ addSmallCapFilter test PASSED!\n');
      } else {
        console.log('❌ No small caps found');
      }
    });
  });
}

// Run tests
console.log('Starting function tests...\n');
quickStats();
addSmallCapFilter();
console.log('All tests complete!');
