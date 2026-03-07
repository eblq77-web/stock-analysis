/**
 * 🧠 SUPER BRAIN PRO - 6-EXCHANGE MOMENTUM SCANNER
 * ================================================
 * Covers: 上海(SH), 深圳(SZ), 创业(CY), 北京(BSE), 恒生(HK), 恒生科技(HS)
 * Based on momentum algorithms
 * Version: 2.0
 */

const https = require('https');
const http = require('http');

// ======================
// STOCK DATABASES
// ======================

// Shanghai Main Board (上海主板)
const SH_STOCKS = [
    { code: "600036", name: "招商银行", sector: "金融" },
    { code: "600030", name: "中信证券", sector: "金融" },
    { code: "600009", name: "上海机场", sector: "交运" },
    { code: "600089", name: "特变电工", sector: "新能源" },
    { code: "600519", name: "贵州茅台", sector: "消费" },
    { code: "600000", name: "浦发银行", sector: "金融" },
    { code: "600016", name: "民生银行", sector: "金融" },
    { code: "600030", name: "中信证券", sector: "金融" },
    { code: "600028", name: "中国石化", sector: "能源" },
    { code: "600026", name: "中远海运", sector: "交运" },
    { code: "600028", name: "中国石化", sector: "能源" },
    { code: "600048", name: "保利发展", sector: "地产" },
    { code: "600050", name: "中国联通", sector: "科技" },
    { code: "600104", name: "上汽集团", sector: "汽车" },
    { code: "600309", name: "万华化学", sector: "化工" },
    { code: "600585", name: "海螺水泥", sector: "建材" },
    { code: "600887", name: "伊利股份", sector: "消费" },
    { code: "600900", name: "长江电力", sector: "电力" },
    { code: "601012", name: "隆基绿能", sector: "新能源" },
    { code: "601066", name: "中信建投", sector: "金融" },
    { code: "601088", name: "山西汾酒", sector: "消费" },
    { code: "601166", name: "兴业银行", sector: "金融" },
    { code: "601288", name: "农业银行", sector: "金融" },
    { code: "601318", name: "中国平安", sector: "金融" },
    { code: "601328", name: "交通银行", sector: "金融" },
    { code: "601398", name: "工商银行", sector: "金融" },
    { code: "601857", name: "中国石油", sector: "能源" },
    { code: "601888", name: "中国中免", sector: "消费" },
    { code: "601989", name: "中国重工", sector: "军工" },
    { code: "603259", name: "药明康德", sector: "医药" },
    { code: "603501", name: "韦尔股份", sector: "半导体" },
    { code: "603986", name: "兆易创新", sector: "半导体" }
];

// Shenzhen Main Board (深圳主板)
const SZ_STOCKS = [
    { code: "000001", name: "平安银行", sector: "金融" },
    { code: "000002", name: "万科A", sector: "地产" },
    { code: "000333", name: "美的集团", sector: "家电" },
    { code: "000425", name: "建投能源", sector: "电力" },
    { code: "000651", name: "格力电器", sector: "家电" },
    { code: "000725", name: "京东方A", sector: "科技" },
    { code: "000768", name: "中航飞机", sector: "军工" },
    { code: "000858", name: "五粮液", sector: "消费" },
    { code: "000876", name: "新希望", sector: "农业" },
    { code: "000895", name: "系数公司", sector: "消费" },
    { code: "000938", name: "紫光股份", sector: "科技" },
    { code: "000999", name: "华润三九", sector: "医药" },
    { code: "002001", name: "新和成", sector: "化工" },
    { code: "002027", name: "分众传媒", sector: "传媒" },
    { code: "002044", name: "江苏国泰", sector: "化工" },
    { code: "002049", name: "紫光国微", sector: "半导体" },
    { code: "002050", name: "浙江龙盛", sector: "化工" },
    { code: "002230", name: "科大讯飞", sector: "科技" },
    { code: "002236", name: "大华股份", sector: "科技" },
    { code: "002252", name: "莱宝高科", sector: "科技" },
    { code: "002304", name: "南山控股", sector: "地产" },
    { code: "002311", name: "海大集团", sector: "农业" },
    { code: "002371", name: "北方华创", sector: "半导体" },
    { code: "002415", name: "海康威视", sector: "科技" },
    { code: "002475", name: "立讯精密", sector: "科技" },
    { code: "002493", name: "荣盛石化", sector: "化工" },
    { code: "002594", name: "比亚迪", sector: "新能源" },
    { code: "002601", name: "龙佰集团", sector: "化工" },
    { code: "002714", name: "牧原股份", sector: "农业" },
    { code: "002736", name: "国光电器", sector: "科技" },
    { code: "002812", name: "恩捷股份", sector: "新能源" },
    { code: "002841", name: "视源股份", sector: "科技" }
];

// ChiNext (创业板)
const CY_STOCKS = [
    { code: "300001", name: "睿创微纳", sector: "半导体" },
    { code: "300015", name: "爱尔眼科", sector: "医药" },
    { code: "300033", name: "同花顺", sector: "科技" },
    { code: "300059", name: "东方财富", sector: "科技" },
    { code: "300122", name: "智飞生物", sector: "医药" },
    { code: "300124", name: "汇川技术", sector: "科技" },
    { code: "300142", name: "沃森生物", sector: "医药" },
    { code: "300212", name: "易瑞生物", sector: "医药" },
    { code: "300308", name: "中际旭创", sector: "科技" },
    { code: "300347", name: "泰格医药", sector: "医药" },
    { code: "300408", name: "石英股份", sector: "新材料" },
    { code: "300450", name: "宁德时代", sector: "新能源" },
    { code: "300454", name: "网宿科技", sector: "科技" },
    { code: "300496", name: "中科创达", sector: "科技" },
    { code: "300529", name: "健帆生物", sector: "医药" },
    { code: "300595", name: "欧普康视", sector: "医药" },
    { code: "300601", name: "康泰生物", sector: "医药" },
    { code: "300628", name: "金溢科技", sector: "科技" },
    { code: "300750", name: "宁德时代", sector: "新能源" },
    { code: "300759", name: "理财金字塔", sector: "金融" },
    { code: "300760", name: "迈瑞医疗", sector: "医药" },
    { code: "300841", name: "芒果超媒", sector: "传媒" },
    { code: "300896", name: "爱美容", sector: "医药" },
    { code: "300998", name: "阿拉丁", sector: "科技" },
    { code: "301029", name: "怡和嘉业", sector: "医药" }
];

// Beijing Stock Exchange (北京交所)
const BSE_STOCKS = [
    { code: "835670", name: "数字人", sector: "AI教育" },
    { code: "835992", name: "连云港", sector: "交运" },
    { code: "870299", name: "百川高低", sector: "化工" },
    { code: "870864", name: "中科路由", sector: "科技" },
    { code: "872925", name: "延长石油", sector: "能源" },
    { code: "872926", name: "贝特瑞", sector: "新能源" },
    { code: "873019", name: "济南高新", sector: "科技" },
    { code: "873027", name: "华曦药业", sector: "医药" },
    { code: "873122", name: "瑞华技术", sector: "化工" },
    { code: "873167", name: "新赣江", sector: "医药" },
    { code: "873339", name: "恒泰科技", sector: "科技" },
    { code: "873527", name: "航安股份", sector: "军工" },
    { code: "873583", name: "华联股份", sector: "消费" },
    { code: "873663", name: "同方股份", sector: "科技" },
    { code: "873678", name: "天辰股份", sector: "建材" }
];

// Hong Kong Main (港股主板)
const HK_STOCKS = [
    { code: "0700", name: "腾讯控股", sector: "科技" },
    { code: "9988", name: "阿里巴巴", sector: "科技" },
    { code: "1024", name: "快手", sector: "科技" },
    { code: "0941", name: "中国移动", sector: "通信" },
    { code: "2318", name: "中国平安", sector: "金融" },
    { code: "2388", name: "港交所", sector: "金融" },
    { code: "2628", name: "中国人寿", sector: "金融" },
    { code: "3690", name: "美团", sector: "科技" },
    { code: "3968", name: "招商银行", sector: "金融" },
    { code: "3988", name: "中国银行", sector: "金融" },
    { code: "6618", name: "京东健康", sector: "医药" },
    { code: "6630", name: "脑洞科技", sector: "科技" },
    { code: "9618", name: "京东集团", sector: "科技" },
    { code: "9818", name: "网易", sector: "科技" },
    { code: "9983", name: "海尔智家", sector: "家电" }
];

// Hang Seng Tech (恒生科技)
const HS_STOCKS = [
    { code: "1810", name: "小米集团", sector: "科技" },
    { code: "1833", name: "平安好医生", sector: "医药" },
    { code: "1861", name: "携程集团", sector: "旅游" },
    { code: "1876", name: "百济神州", sector: "医药" },
    { code: "2255", name: "贝壳", sector: "地产" },
    { code: "2618", name: "京东物流", sector: "物流" },
    { code: "2689", name: "华润燃气", sector: "能源" },
    { code: "3500", name: "360数科", sector: "金融" },
    { code: "3638", name: "微盟集团", sector: "科技" },
    { code: "3800", name: "商汤科技", sector: "AI" },
    { code: "3898", name: "中芯国际", sector: "半导体" },
    { code: "6066", name: "中信证券", sector: "金融" },
    { code: "6606", name: "奈雪的茶", sector: "消费" },
    { code: "9618", name: "京东集团", sector: "科技" },
    { code: "9961", name: "携程", sector: "旅游" }
];

// ======================
// MOMENTUM CALCULATOR
// ======================
function calculateMomentumScore(stock, price, change, volume) {
    let score = 50; // Base score
    
    // Price momentum (30 points)
    if (change > 5) score += 30;
    else if (change > 3) score += 20;
    else if (change > 1) score += 10;
    else if (change > 0) score += 5;
    else if (change < -5) score -= 20;
    else if (change < -3) score -= 10;
    
    // Volume momentum (20 points) - simulated
    const volScore = Math.random() * 20;
    score += volScore;
    
    // Add some randomness for demo
    score += (Math.random() - 0.5) * 10;
    
    return Math.min(100, Math.max(0, Math.round(score)));
}

// ======================
// FETCH STOCK DATA
// ======================
function fetchStockData(stock) {
    return new Promise((resolve) => {
        // Simulated data for demo
        // In production, use real API
        const change = (Math.random() - 0.5) * 10;
        const volume = Math.floor(Math.random() * 10000000) + 1000000;
        
        resolve({
            ...stock,
            price: (Math.random() * 100 + 10).toFixed(2),
            change: change.toFixed(2),
            volume: volume,
            momentumScore: calculateMomentumScore(stock, 0, change, volume)
        });
    });
}

// ======================
// MAIN SCANNER
// ======================
async function scanAllExchanges() {
    console.log("\n🧠 SUPER BRAIN PRO - 6-EXCHANGE MOMENTUM SCANNER");
    console.log("====================================================\n");
    
    const exchanges = [
        { name: "上海主板 (SH)", code: "SH", stocks: SH_STOCKS },
        { name: "深圳主板 (SZ)", code: "SZ", stocks: SZ_STOCKS },
        { name: "创业板 (CY)", code: "CY", stocks: CY_STOCKS },
        { name: "北京交所 (BSE)", code: "BSE", stocks: BSE_STOCKS },
        { name: "港股主板 (HK)", code: "HK", stocks: HK_STOCKS },
        { name: "恒生科技 (HS)", code: "HS", stocks: HS_STOCKS }
    ];
    
    let allResults = [];
    
    for (const exchange of exchanges) {
        console.log(`📊 Scanning ${exchange.name}...`);
        
        const results = await Promise.all(
            exchange.stocks.map(stock => fetchStockData(stock))
        );
        
        // Sort by momentum score
        results.sort((a, b) => b.momentumScore - a.momentumScore);
        
        // Get top 5
        const top5 = results.slice(0, 5);
        
        console.log(`   Top 5 from ${exchange.name}:`);
        for (const s of top5) {
            console.log(`   ${s.code} ${s.name}: ${s.momentumScore} | ${s.change}%`);
            allResults.push({ ...s, exchange: exchange.name, exchangeCode: exchange.code });
        }
    }
    
    // Overall top 15
    allResults.sort((a, b) => b.momentumScore - a.momentumScore);
    const top15 = allResults.slice(0, 15);
    
    console.log("\n" + "=".repeat(60));
    printRainbowLine("🎯 TOP 15 STOCKS ACROSS ALL 6 EXCHANGES");
    console.log("=".repeat(60));
    
    for (let i = 0; i < top15.length; i++) {
        const s = top15[i];
        const emoji = s.momentumScore >= 75 ? "🟢" : s.momentumScore >= 60 ? "🟡" : "🔴";
        console.log(`${i+1}. ${emoji} ${s.code} ${s.name} [${s.exchangeCode}]`);
        console.log(`   Score: ${s.momentumScore} | Change: ${s.change}% | Sector: ${s.sector}`);
    }
    
    // Summary by exchange
    console.log("\n" + "=".repeat(60));
    printBlueLine("📈 SUMMARY BY EXCHANGE");
    console.log("=".repeat(60));
    
    for (const exchange of exchanges) {
        const exchangeResults = allResults.filter(r => r.exchangeCode === exchange.code);
        const avgScore = exchangeResults.reduce((a, b) => a + b.momentumScore, 0) / exchangeResults.length;
        const topStock = exchangeResults[0];
        console.log(`${exchange.name}:`);
        console.log(`   Avg Score: ${avgScore.toFixed(1)} | Top: ${topStock.code} ${topStock.name} (${topStock.momentumScore})`);
    }
    
    return top15;
}

function printRainbowLine(text) {
    console.log(`\n${'🌈'.repeat(3)} ${text} ${'🌈'.repeat(3)}\n`);
}

function printBlueLine(text) {
    console.log(`\n🔵 ${text}\n`);
}

// Run scanner
scanAllExchanges().then(results => {
    console.log("\n✅ Scan complete!\n");
});
