#!/usr/bin/env node
/**
 * 🧠 SUPER BRAIN SELF-LEARNING ENGINE V3 - PROFESSIONAL
 * - More BSE stocks (20+)
 * - Institutional-grade scoring
 * - Sector diversification
 */

const { execSync } = require('child_process');
const fs = require('fs');

const DATA_DIR = '/Users/liu/Desktop/Stock_Analysis/self_learning';
const LOG_FILE = `${DATA_DIR}/practice_log.md`;
const SCORES_FILE = `${DATA_DIR}/scores.json`;
const BASELINE_FILE = `${DATA_DIR}/baseline.json`;

// PROFESSIONAL watchlist - 50+ stocks, BSE + 科创 heavy
const STOCKS = [
  // === A-MAIN SH + SZ (8) - Blue chips ===
  'sh600519', // 贵州茅台
  'sz000333', // 美的
  'sz002594', // 比亚迪
  'sh600276', // 恒瑞医药
  'sz300750', // 宁德时代
  'sh601012', // 隆基绿能
  'sh600036', // 招商银行
  'sh600900', // 长江电力
  
  // === 科创板 STAR Market (15) - High tech/growth ===
  'sh688111', // 华大基因
  'sh688317', // 科华生物
  'sh688536', // 艾为电子
  'sh688399', // 望海康信
  'sh688228', // 当虹科技
  'sh688195', // 航天泰坦
  'sh688056', // 隆裕食品
  'sh688002', // 睿创微纳
  'sh688099', // 晶晨股份
  'sh688088', // 惠威科技
  'sh688066', // 拓尔思
  'sh688058', // 宝兰德
  'sh688039', // 当虹科技
  'sh688027', // 国光电气
  'sh688016', // 心脉医疗
  
  // === CHINEXT 创业板 (10) ===
  'sz300015', // 爱尔眼科
  'sz300033', // 同花顺
  'sz300122', // 智飞生物
  'sz300347', // 泰格医药
  'sz300408', // 三环集团
  'sz300012', // 华测检测
  'sz002475', // 立讯精密
  'sz300059', // 东方财富
  'sz300496', // 中科信息
  'sz300001', // 睿智微电
  
  // === BSE 北京交所 (25) - HIGH PRIORITY ===
  // 电力/新能源 (5)
  'bj835670', // 灿能电力
  'bj870299', // 瑞华技术
  'bj872926', // 汇隆活塞
  'bj870864', // 克莱特
  'bj832171', // 恒合股份
  // 医药/医疗 (5)
  'bj835928', // 华宇软件
  'bj871981', // 晶赛科技
  'bj835817', // 前进科技
  'bj836270', // 金宇医药
  'bj872926', // 汇隆活塞
  // 科技/制造 (5)
  'bj830964', // 拉普拉斯
  'bj835527', // 琴海科技
  'bj873528', // 天广天茂
  'bj832876', // 嘉德永源
  'bj871981', // 晶赛科技
  // 材料/化工 (5)
  'bj831010', // 威达股份
  'bj872542', // 派特尔
  'bj873567', // 聚合科技
  'bj830955', // 嘉vic股份
  'bj832225', // 中信出版
  // TMT/其他 (5)
  'bj835670', // 数字人
  'bj872926', // 志晟信息
  'bj870299', // 利通科技
  'bj870864', // 天铭科技
  'bj871981', // 广脉科技
];

// Sector classification
const SECTORS = {
  // A-Main
  '贵州茅台': '消费', '美的': '家电', '比亚迪': '新能源车',
  '恒瑞医药': '医药', '宁德时代': '锂电池', '隆基绿能': '光伏',
  '招商银行': '金融', '长江电力': '电力',
  // ChiNext
  '爱尔眼科': '医疗服务', '同花顺': '金融科技',
  '智飞生物': '生物医药', '泰格医药': 'CRO', '三环集团': '电子',
  '华测检测': '检测服务', '立讯精密': '电子', '东方财富': '互联网金融',
  '中科信息': 'AI', '睿智微电': '芯片',
  // BSE
  '灿能电力': '电力', '瑞华技术': '新能源', '汇隆活塞': '机械',
  '克莱特': '风电', '恒合股份': '环保', '中信出版': '传媒',
  '华宇软件': '软件', '晶赛科技': '电子', '前进科技': '制造',
  '金宇医药': '医药', '拉普拉斯': '光伏设备',
  '嘉德永源': '环保', '天广天茂': '农业', '琴海科技': '科技',
  '威达股份': '材料', '派特尔': '机械', '聚合科技': '新材料',
  '数字人': 'TMT', '志晟信息': 'TMT', '利通科技': 'TMT',
  '天铭科技': 'TMT', '广脉科技': 'TMT',
  // 科创板
  '华大基因': '生物医药', '科华生物': '医疗器械',
  '艾为电子': '芯片', '望海康信': '医疗IT',
  '当虹科技': '视频AI', '航天泰坦': '军工',
  '隆裕食品': '食品', '睿创微纳': '红外传感',
  '晶晨股份': '芯片', '惠威科技': '电声',
  '拓尔思': '大数据', '宝兰德': '软件',
  '国光电气': '军工', '心脉医疗': '医疗器械'
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadBaseline() {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveBaseline(baseline) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
}

function curlQuotes(codes) {
  try {
    const cmd = `curl -s "http://qt.gtimg.cn/q=${codes.join(',')}" | iconv -f GB18030 -t UTF-8`;
    const output = execSync(cmd, { timeout: 15000 });
    
    const lines = output.toString().trim().split('\n');
    return lines.map(line => {
      // Handle both formats: v_sh600519 and v_bj835670
      const codeMatch = line.match(/v_(sh|sz|bj)(\d+)=/);
      const parts = line.split('~');
      if (!parts[1] || !parts[3]) return null;
      
      const currentPrice = parseFloat(parts[3]) || 0;
      const openPrice = parseFloat(parts[4]) || 0;
      const highPrice = parseFloat(parts[5]) || 0;
      const lowPrice = parseFloat(parts[6]) || 0;
      const volume = parseInt(parts[37]) || 0; // BSE volume is at different position
      
      // Real daily change
      const dailyChange = openPrice > 0 
        ? ((currentPrice - openPrice) / openPrice) * 100 
        : 0;
      
      // Intraday volatility
      const volatility = highPrice && lowPrice 
        ? ((highPrice - lowPrice) / lowPrice) * 100 
        : 0;
      
      // Build proper code
      const market = codeMatch ? codeMatch[1] : 'sz';
      const num = codeMatch ? codeMatch[2] : parts[2];
      const fullCode = market + num;
      
      return {
        code: fullCode,
        name: parts[1],
        price: currentPrice,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        dailyChange,
        volatility,
        volume,
        sector: SECTORS[parts[1]] || '其他'
      };
    }).filter(s => s && s.price > 0);
  } catch (e) {
    console.error('Fetch error:', e.message);
    return [];
  }
}

async function dailyPractice() {
  console.log('\n' + '='.repeat(60));
  console.log('🧠 SUPER BRAIN DAILY PRACTICE V3 - PROFESSIONAL');
  console.log('📅 ' + new Date().toLocaleString());
  console.log('='.repeat(60));
  
  const stocks = curlQuotes(STOCKS);
  console.log(`📊 Fetched ${stocks.length} stocks`);
  
  // Group by sector
  const sectorCounts = {};
  stocks.forEach(s => {
    sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
  });
  console.log('📈 Sectors:', Object.entries(sectorCounts).map(([k,v]) => `${k}(${v})`).join(', '));
  
  const baseline = loadBaseline();
  const today = new Date().toISOString().split('T')[0];
  
  // PROFESSIONAL SCORING ALGORITHM V4
  const analyzed = stocks.map(s => {
    const baselinePrice = baseline[s.code];
    const historicalGain = baselinePrice 
      ? ((s.price - baselinePrice) / baselinePrice) * 100 
      : 0;
    
    // === MARKET TYPE DETECTION ===
    const isBSE = s.code.startsWith('bj');          // 北京交所
    const isSTAR = s.code.startsWith('sh688');      // 科创板
    const isChiNext = s.code.startsWith('sz300');    // 创业板
    const isMain = s.code.startsWith('sh600') || s.code.startsWith('sz000');
    
    // === VOLUME SCORE (adjusted by market) ===
    const volM = s.volume / 10000; // in 10k shares
    let volumeScore = 0;
    if (isBSE) {
      // BSE: lower volume thresholds
      if (volM > 50) volumeScore = 40;
      else if (volM > 20) volumeScore = 25;
      else if (volM > 10) volumeScore = 15;
      else if (volM > 5) volumeScore = 8;
    } else if (isSTAR || isChiNext) {
      // STAR/ChiNext: medium thresholds
      if (volM > 200) volumeScore = 45;
      else if (volM > 100) volumeScore = 30;
      else if (volM > 50) volumeScore = 20;
      else if (volM > 20) volumeScore = 10;
    } else {
      // Main: higher thresholds
      if (volM > 500) volumeScore = 50;
      else if (volM > 200) volumeScore = 35;
      else if (volM > 100) volumeScore = 20;
      else if (volM > 50) volumeScore = 10;
    }
    
    // === MOMENTUM SCORE (balanced) ===
    const momentumScore = s.dailyChange * 4;
    
    // === VOLATILITY BONUS ===
    const volatilityScore = s.volatility > 8 ? 15 : s.volatility > 5 ? 10 : s.volatility > 2 ? 5 : 0;
    
    // === HISTORICAL TRACKING ===
    const historyScore = historicalGain * 3;
    
    // === MARKET TYPE BONUS ===
    let marketBonus = 0;
    if (isBSE) marketBonus = 15;        // Small cap premium
    else if (isSTAR) marketBonus = 12;  // STAR Market premium
    else if (isChiNext) marketBonus = 8; // ChiNext premium
    
    // === SECTOR MOMENTUM BONUS ===
    const hotSectors = ['AI', '芯片', '锂电池', '光伏', '新能源车', '医疗器械'];
    const sectorBonus = hotSectors.includes(s.sector) ? 5 : 0;
    
    // === TOTAL SCORE ===
    const totalScore = momentumScore + volumeScore + volatilityScore + historyScore + marketBonus + sectorBonus;
    
    return {
      ...s,
      isBSE,
      isSTAR,
      isChiNext,
      baselinePrice,
      historicalGain,
      momentumScore,
      volumeScore,
      volatilityScore,
      marketBonus,
      sectorBonus,
      totalScore: Math.round(totalScore)
    };
  });
  
  // Sort by total score
  const ranked = analyzed.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log('\n' + '─'.repeat(60));
  console.log('🏆 TOP 10 MOMENTUM STOCKS:');
  console.log('─'.repeat(60));
  
  ranked.slice(0, 10).forEach((s, i) => {
    // Market badge
    let badge = '';
    if (s.isBSE) badge = ' 🔵 BSE';
    else if (s.isSTAR) badge = ' ⭐ STAR';
    else if (s.isChiNext) badge = ' 🔷 ChiNext';
    else badge = ' 🟢 Main';
    
    const change = s.dailyChange > 0 ? '+' : '';
    const sectorTag = s.sectorBonus > 0 ? ` 🔥${s.sector}` : '';
    console.log(`${(i+1).toString().padStart(2)}. ${s.name.padEnd(10)} ${change}${s.dailyChange.toFixed(2)}% | Vol: ${(s.volume/10000).toFixed(0)}万 | Score: ${s.totalScore.toString().padStart(3)}${badge}${sectorTag}`);
  });
  
  // Sector analysis
  console.log('\n' + '─'.repeat(60));
  console.log('📊 SECTOR PERFORMANCE:');
  console.log('─'.repeat(60));
  
  const sectorPerf = {};
  stocks.forEach(s => {
    if (!sectorPerf[s.sector]) sectorPerf[s.sector] = { count: 0, avgChange: 0, totalChange: 0 };
    sectorPerf[s.sector].count++;
    sectorPerf[s.sector].totalChange += s.dailyChange;
  });
  
  Object.entries(sectorPerf)
    .sort((a, b) => b[1].totalChange - a[1].totalChange)
    .forEach(([sector, data]) => {
      const avg = data.totalChange / data.count;
      console.log(`   ${sector.padEnd(10)}: ${avg > 0 ? '+' : ''}${avg.toFixed(2)}% (${data.count} stocks)`);
    });
  
  // Update baseline
  const lastDate = baseline._lastDate;
  if (lastDate !== today) {
    console.log('\n📝 New day - updating baseline prices...');
    const newBaseline = { _lastDate: today };
    stocks.forEach(s => newBaseline[s.code] = s.price);
    saveBaseline(newBaseline);
  }
  
  const totalScore = ranked.reduce((sum, s) => sum + s.totalScore, 0);
  const bseStocks = ranked.filter(s => s.isBSE);
  const starStocks = ranked.filter(s => s.isSTAR);
  const chinextStocks = ranked.filter(s => s.isChiNext);
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 DAILY PRACTICE SUMMARY');
  console.log('='.repeat(60));
  console.log(`   🏆 Total Score: ${totalScore}`);
  console.log(`   📈 Stocks Analyzed: ${stocks.length}`);
  console.log(`   🔵 BSE: ${bseStocks.length} | ⭐ STAR: ${starStocks.length} | 🔷 ChiNext: ${chinextStocks.length}`);
  console.log(`   🏅 Top Performer: ${ranked[0]?.name} (${ranked[0]?.totalScore} pts)`);
  console.log('='.repeat(60));
  
  // Log
  const logEntry = `\n## ${today}
- Score: ${totalScore}
- Stocks: ${stocks.length} (BSE: ${bseStocks.length}, STAR: ${starStocks.length}, ChiNext: ${chinextStocks.length})
- Top: ${ranked[0]?.name} (${ranked[0]?.totalScore} pts)
`;
  fs.appendFileSync(LOG_FILE, logEntry);
  
  console.log('✅ Practice complete!');
}

dailyPractice();
