const https = require('https');

function fetchStock(code) {
  return new Promise((resolve) => {
    https.get('https://qt.gtimg.cn/q=' + code, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonStr = data.match(/="([^"]+)"/);
          if (jsonStr) {
            const parts = jsonStr[1].split('~');
            resolve({ price: parseFloat(parts[3]), change: parseFloat(parts[4]) });
          } else resolve({ price: 0, change: 0 });
        } catch(e) resolve({ price: 0, change: 0 });
      });
    }).on('error', () => resolve({ price: 0, change: 0 }));
  });
}

async function main() {
  const stocks = [
    { code: 'sh0700', name: '腾讯控股', entry: 417.2 },
    { code: 'sz002594', name: '比亚迪', entry: 140.77 },
    { code: 'sh9988', name: '阿里巴巴', entry: 106.53 },
    { code: 'sh300308', name: '中际旭创', entry: 88.5 },
    { code: 'bj835670', name: '数字人', entry: 45.2 },
    { code: 'bj872926', name: '贝特瑞', entry: 38.5 }
  ];
  
  console.log('📊 LIVE PRICES & P&L\n' + '='.repeat(50));
  
  for (const s of stocks) {
    const now = await fetchStock(s.code);
    if (now.price > 0) {
      const pnl = ((now.price - s.entry) / s.entry * 100).toFixed(2);
      const icon = pnl >= 0 ? '📈' : '📉';
      console.log(`${s.name}: ¥${now.price.toFixed(2)} (${(now.change||0)>0?'+':''}${(now.change||0).toFixed(2)}%) | Entry: ¥${s.entry} | P&L: ${pnl}% ${icon}`);
    } else {
      console.log(`${s.name}: Fetching...`);
    }
  }
}

main();
