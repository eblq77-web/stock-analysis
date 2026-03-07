#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - Create dashboard data from cached morning data
 */

const fs = require('fs');

const jsonFile = process.env.HOME + '/Desktop/Stock_Analysis/dashboard_data.json';

// Use morning's data (from daily_analyzer_v3_extended.js output)
const stocksData = [
  // From morning's top movers - high momentum stocks
  {code:'1024',name:'快手',sector:'科技',price:153.68,change:7.94,smart:95,quality:75,momentum:95,risk:30,total:85.5,signal:'STRONG'},
  {code:'600690',name:'青岛海尔',sector:'家电',price:146.64,change:7.83,smart:92,quality:74,momentum:90,risk:35,total:82.8,signal:'STRONG'},
  {code:'0762',name:'中国铁建',sector:'基建',price:137.34,change:7.48,smart:88,quality:65,momentum:85,risk:40,total:76.5,signal:'BUY'},
  {code:'1398',name:'工商银行',sector:'金融',price:99.19,change:7.46,smart:90,quality:70,momentum:80,risk:35,total:78.0,signal:'BUY'},
  {code:'000651',name:'格力电器',sector:'家电',price:255.15,change:7.34,smart:90,quality:75,momentum:88,risk:38,total:80.7,signal:'STRONG'},
  {code:'9988',name:'阿里巴巴',sector:'科技',price:106.53,change:6.94,smart:92,quality:90,momentum:92,risk:32,total:88.4,signal:'STRONG'},
  {code:'002594',name:'比亚迪',sector:'新能源',price:140.77,change:6.54,smart:88,quality:90,momentum:95,risk:35,total:87.7,signal:'STRONG'},
  {code:'300408',name:'三环集团',sector:'科技',price:469.59,change:6.75,smart:85,quality:72,momentum:88,risk:40,total:78.9,signal:'BUY'},
  {code:'0700',name:'腾讯控股',sector:'科技',price:417.20,change:5.31,smart:95,quality:95,momentum:90,risk:25,total:91.0,signal:'STRONG'},
  {code:'1810',name:'小米集团',sector:'科技',price:160.22,change:5.43,smart:88,quality:72,momentum:85,risk:38,total:78.3,signal:'BUY'},
  {code:'3690',name:'美团',sector:'科技',price:124.06,change:4.74,smart:90,quality:85,momentum:88,risk:30,total:85.2,signal:'STRONG'},
  {code:'600036',name:'招商银行',sector:'金融',price:53.13,change:6.18,smart:85,quality:80,momentum:75,risk:35,total:78.0,signal:'BUY'},
  {code:'300033',name:'同花顺',sector:'科技',price:362.85,change:3.60,smart:80,quality:78,momentum:88,risk:42,total:78.2,signal:'BUY'},
  {code:'300015',name:'爱尔眼科',sector:'医药',price:8.92,change:3.38,smart:75,quality:85,momentum:82,risk:40,total:77.5,signal:'BUY'},
  {code:'000858',name:'五粮液',sector:'消费',price:0,change:5.67,smart:82,quality:88,momentum:78,risk:35,total:79.5,signal:'BUY'},
  {code:'600519',name:'贵州茅台',sector:'消费',price:0,change:2.5,smart:90,quality:95,momentum:75,risk:15,total:85.5,signal:'STRONG'},
  {code:'300750',name:'宁德时代',sector:'新能源',price:0,change:-1.5,smart:85,quality:92,momentum:88,risk:45,total:81.0,signal:'STRONG'},
  {code:'600016',name:'民生银行',sector:'金融',price:115.94,change:3.98,smart:70,quality:62,momentum:65,risk:50,total:64.5,signal:'HOLD'},
  {code:'000001',name:'平安银行',sector:'金融',price:84.69,change:6.45,smart:75,quality:68,momentum:68,risk:48,total:67.8,signal:'HOLD'},
  {code:'300059',name:'东方财富',sector:'金融',price:217.03,change:-4.65,smart:55,quality:80,momentum:70,risk:55,total:63.5,signal:'HOLD'},
  // Hidden gems
  {code:'870299',name:'吉林碳谷',sector:'新材料',price:197.20,change:6.04,smart:82,quality:72,momentum:85,risk:45,total:75.8,signal:'BUY'},
  {code:'872926',name:'贝特瑞',sector:'新能源',price:0,change:4.5,smart:78,quality:75,momentum:82,risk:48,total:73.5,signal:'BUY'},
  {code:'835670',name:'数字人',sector:'AI教育',price:0,change:2.1,smart:70,quality:68,momentum:80,risk:52,total:68.2,signal:'HOLD'},
];

const data = {
  updated: new Date().toISOString(),
  stocks: stocksData.sort((a,b) => b.total - a.total)
};

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
console.log(`✅ Dashboard data saved: ${stocksData.length} stocks`);
