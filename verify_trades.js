/**
 * QUANTUM TRADE VERIFIER
 * =====================
 * Check yesterday's trades, calculate P&L, learn
 */

const fs = require('fs');
const http = require('http');

// Get yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const tradeDate = yesterday.toISOString().split('T')[0];

const TRADES_FILE = `/Users/liu/Desktop/Stock_Analysis/daily_overview/QUANTUM_TRADES_${tradeDate}.json`;

// Fetch current price
function fetchPrice(code) {
    return new Promise((resolve) => {
        const url = `http://qt.gtimg.cn/q=sh${code},sz${code}`;
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parts = data.split('~');
                    if (parts.length > 10) {
                        resolve({
                            price: parseFloat(parts[3]) || 0,
                            changePercent: parseFloat(parts[5]) || 0
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    });
}

async function verifyTrades() {
    console.log('🔍 QUANTUM TRADE VERIFIER');
    console.log('==========================\n');
    console.log(`Checking trades from: ${tradeDate}\n`);
    
    // Load yesterday's trades
    if (!fs.existsSync(TRADES_FILE)) {
        console.log('❌ No trades found for', tradeDate);
        return;
    }
    
    const trades = JSON.parse(fs.readFileSync(TRADES_FILE, 'utf8'));
    
    console.log(`Found ${trades.recommendations.length} recommendations\n`);
    
    // Fetch current prices and verify
    let totalPnL = 0;
    let wins = 0;
    let losses = 0;
    let pending = 0;
    
    console.log('📊 TRADE VERIFICATION:');
    console.log('======================\n');
    
    for (const trade of trades.recommendations) {
        const current = await fetchPrice(trade.code);
        
        if (!current) {
            console.log(`${trade.code} ${trade.name}: ❌ Price data unavailable`);
            continue;
        }
        
        const entryPrice = parseFloat(trade.entryPrice);
        const currentPrice = current.price;
        const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        // Determine status
        let status = 'PENDING';
        if (pnlPercent >= 15) {
            status = '🎯 TARGET HIT';
            wins++;
            totalPnL += 15;
        } else if (pnlPercent <= -7) {
            status = '🛑 STOP HIT';
            losses++;
            totalPnL += -7;
        } else if (pnlPercent > 0) {
            status = '📈 IN PROFIT';
            pending++;
            totalPnL += pnlPercent;
        } else {
            status = '📉 IN LOSS';
            pending++;
            totalPnL += pnlPercent;
        }
        
        console.log(`${trade.code} ${trade.name}`);
        console.log(`   Entry: ¥${entryPrice} → Current: ¥${currentPrice}`);
        console.log(`   P&L: ${pnlPercent.toFixed(2)}%`);
        console.log(`   Status: ${status}\n`);
        
        await new Promise(r => setTimeout(r, 50));
    }
    
    // Summary
    console.log('📈 PERFORMANCE SUMMARY');
    console.log('=====================');
    console.log(`Wins (15%+): ${wins}`);
    console.log(`Losses (-7%): ${losses}`);
    console.log(`Pending: ${pending}`);
    console.log(`Total P&L: ${totalPnL.toFixed(2)}%\n`);
    
    // Save verification
    const verification = {
        date: tradeDate,
        verifiedAt: new Date().toISOString(),
        totalTrades: trades.recommendations.length,
        wins,
        losses,
        pending,
        totalPnL: totalPnL.toFixed(2),
        status: totalPnL > 0 ? 'PROFIT' : 'LOSS'
    };
    
    const verifyPath = `/Users/liu/Desktop/Stock_Analysis/daily_overview/VERIFICATION_${tradeDate}.json`;
    fs.writeFileSync(verifyPath, JSON.stringify(verification, null, 2), 'utf8');
    
    console.log(`✅ Verification saved: VERIFICATION_${tradeDate}.json`);
    
    return verification;
}

verifyTrades().catch(console.error);
