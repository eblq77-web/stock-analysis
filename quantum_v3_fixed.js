/**
 * CHARLES'S QUANTUM SUPER BRAIN V3 - FIXED
 * ==========================================
 * Proper JSON parsing | Real live data | Dynamic daily
 */

const http = require('http');
const fs = require('fs');

// Simple stock universe
const STOCKS = [
    { code: '600519', name: '贵州茅台', sector: '消费' },
    { code: '300750', name: '宁德时代', sector: '新能源' },
    { code: '002594', name: '比亚迪', sector: '新能源' },
    { code: '300476', name: '中际旭创', sector: 'AI' },
    { code: '0700', name: '腾讯控股', sector: '科技' },
    { code: '9988', name: '阿里巴巴', sector: '科技' },
    { code: '601012', name: '隆基绿能', sector: '光伏' },
    { code: '600276', name: '恒瑞医药', sector: '医药' },
    { code: '300122', name: '智飞生物', sector: '医药' },
    { code: '3690', name: '美团', sector: '科技' },
    { code: '1024', name: '快手', sector: '科技' },
    { code: '835670', name: '数字人', sector: 'BSE' },
    { code: '872926', name: '贝特瑞', sector: '新能源' },
    { code: '300033', name: '同花顺', sector: '科技' },
    { code: '300014', name: '亿纬锂能', sector: '新能源' }
];

// Proper Tencent API parser
function fetchStock(code) {
    return new Promise((resolve) => {
        const url = `http://qt.gtimg.cn/q=sh${code}`;
        http.get(url, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    // Parse: v_sh600519="1~贵州茅台~600519~1466.21~..."
                    const match = raw.match(/v_sh\d+="([^"]+)"/);
                    if (!match) { resolve(null); return; }
                    
                    const parts = match[1].split('~');
                    if (parts.length < 10) { resolve(null); return; }
                    
                    resolve({
                        code: code,
                        name: parts[1] || '',
                        price: parseFloat(parts[2]) || 0,
                        change: parseFloat(parts[3]) || 0,
                        changePct: parseFloat(parts[4]) || 0,
                        volume: parseInt(parts[5]) || 0,
                        amount: parseInt(parts[6]) || 0
                    });
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function main() {
    console.log('🧠 QUANTUM V3 - FIXED');
    console.log('=====================\n');
    
    // Fetch all live
    const results = [];
    for (const s of STOCKS) {
        const d = await fetchStock(s.code);
        if (d) results.push({ ...s, ...d });
        await new Promise(r => setTimeout(r, 50));
    }
    
    console.log(`✅ Live data: ${results.length} stocks\n`);
    
    // Show real prices
    console.log('📊 REAL LIVE PRICES:');
    results.forEach(s => {
        console.log(`   ${s.code} ${s.name}: ¥${s.price} (${s.changePct > 0 ? '+' : ''}${s.changePct}%)`);
    });
    
    // Dynamic scoring based on actual change
    const scored = results.map(s => {
        let score = 50;
        if (s.changePct > 2) score += 20;
        else if (s.changePct > 0) score += 10;
        else if (s.changePct < -3) score += 15; // oversold
        
        if (s.volume > 10000000) score += 15;
        
        return { ...s, score: Math.min(100, score) };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    console.log('\n🎯 TOP PICKS:');
    scored.slice(0, 5).forEach((s, i) => {
        console.log(`   ${i+1}. ${s.code} ${s.name}: Score ${s.score}`);
    });
    
    // Save
    const today = new Date().toISOString().split('T')[0];
    const json = JSON.stringify({ date: today, stocks: scored }, null, 2);
    fs.writeFileSync(`/Users/liu/Desktop/Stock_Analysis/daily_overview/qv3_${today}.json`, json);
    console.log('\n✅ Saved!');
}

main().catch(e => console.error(e));
