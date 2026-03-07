/**
 * QUANTUM V3 - FINAL FIX
 */

const http = require('http');
const fs = require('fs');

const STOCKS = [
    { code: '600519', name: '贵州茅台', sector: '消费' },
    { code: '300750', name: '宁德时代', sector: '新能源' },
    { code: '002594', name: '比亚迪', sector: '新能源' },
    { code: '300476', name: '中际旭创', sector: 'AI' },
    { code: '0700', name: '腾讯控股', sector: '科技' },
    { code: '601012', name: '隆基绿能', sector: '光伏' },
    { code: '600276', name: '恒瑞医药', sector: '医药' },
    { code: '835670', name: '数字人', sector: 'BSE' }
];

function fetchStock(code) {
    return new Promise((resolve) => {
        const url = `http://qt.gtimg.cn/q=sh${code}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Extract quoted content
                    const start = data.indexOf('="') + 2;
                    const end = data.indexOf('"', start);
                    const content = data.substring(start, end);
                    
                    const parts = content.split('~');
                    if (parts.length < 10) { resolve(null); return; }
                    
                    // Format: 0=1, 1=name, 2=code, 3=price, 4=yesterday?, 5=?, ..., timestamp..., change, change%
                    // Looking at the data: 1466.21~1491.66~1486.60~...~20260226161426~-25.45~-1.71~
                    
                    const price = parseFloat(parts[2]);  // This is price
                    
                    // Find change% - it's usually after the timestamp (around position 20+)
                    let changePct = 0;
                    for (let i = 20; i < parts.length && i < 30; i++) {
                        const val = parseFloat(parts[i]);
                        if (!isNaN(val) && Math.abs(val) < 15 && Math.abs(val) > 0.001) {
                            changePct = val;
                            break;
                        }
                    }
                    
                    const volume = parseInt(parts[5]) || 0;
                    
                    // Validate
                    if (!price || price < 0.1 || price > 100000) {
                        resolve(null);
                        return;
                    }
                    
                    resolve({
                        code: code,
                        price: price,
                        changePct: changePct,
                        volume: volume
                    });
                } catch (e) { 
                    resolve(null); 
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function main() {
    console.log('🧠 QUANTUM V3 - FINAL\n');
    
    const results = [];
    for (const s of STOCKS) {
        const d = await fetchStock(s.code);
        if (d) {
            results.push({ ...s, ...d });
            console.log(`✅ ${s.code}: ¥${d.price.toFixed(2)} (${d.changePct > 0 ? '+' : ''}${d.changePct.toFixed(2)}%) Vol: ${(d.volume/10000).toFixed(0)}万`);
        }
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`\n📊 Total: ${results.length} stocks`);
    
    if (results.length > 0) {
        results.forEach(s => {
            s.score = 50;
            if (s.changePct > 2) s.score += 20;
            else if (s.changePct > 0) s.score += 10;
            else if (s.changePct < -3) s.score += 15;
            if (s.volume > 5000000) s.score += 15;
        });
        
        results.sort((a, b) => b.score - a.score);
        
        console.log('\n🎯 TOP PICKS:');
        results.slice(0, 5).forEach((s, i) => {
            console.log(`   ${i+1}. ${s.code} ${s.name}: Score ${s.score} | Entry ¥${s.price.toFixed(2)} | Target +15% ¥${(s.price*1.15).toFixed(2)} | Stop -7% ¥${(s.price*0.93).toFixed(2)}`);
        });
    }
    
    const today = new Date().toISOString().split('T')[0];
    fs.writeFileSync(`/Users/liu/Desktop/Stock_Analysis/daily_overview/qv3_${today}.json`, JSON.stringify(results, null, 2));
    console.log('\n✅ Saved!');
}

main();
