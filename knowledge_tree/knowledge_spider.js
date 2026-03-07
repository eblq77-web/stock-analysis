/**
 * 🌐 KNOWLEDGE TREE - Auto Scraper
 * Automatically scrapes finance news and resources worldwide
 * Builds knowledge base for Super Brain
 * 
 * Version 1.0 - Auto Learning
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================
// KNOWLEDGE SOURCES CONFIGURATION
// ============================================

const SOURCES = {
  // Chinese Sources
  chinese: [
    { name: '东方财富', url: 'https://finance.eastmoney.com', category: 'finance' },
    { name: '新浪财经', url: 'https://finance.sina.com.cn', category: 'finance' },
    { name: '凤凰网财经', url: 'https://finance.ifeng.com', category: 'finance' },
    { name: 'Wind资讯', url: 'https://www.wind.com.cn', category: 'data' },
    { name: '财新', url: 'https://www.caixin.com', category: 'news' }
  ],
  
  // International Sources
  international: [
    { name: 'Bloomberg', url: 'https://www.bloomberg.com', category: 'finance' },
    { name: 'Reuters', url: 'https://www.reuters.com', category: 'finance' },
    { name: 'CNBC', url: 'https://www.cnbc.com', category: 'finance' },
    { name: 'WSJ', url: 'https://www.wsj.com', category: 'finance' },
    { name: 'Financial Times', url: 'https://www.ft.com', category: 'finance' }
  ],
  
  // Crypto Sources
  crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com', category: 'crypto' },
    { name: 'Binance', url: 'https://www.binance.com', category: 'crypto' },
    { name: 'CoinGecko', url: 'https://www.coingecko.com', category: 'crypto' }
  ],
  
  // News Sources
  news: [
    { name: '华尔街见闻', url: 'https://wallstreetcn.com', category: 'news' },
    { name: '36kr', url: 'https://36kr.com', category: 'tech' },
    { name: '虎嗅', url: 'https://huxiu.com', category: 'tech' }
  ]
};

// ============================================
// KNOWLEDGE STORAGE
// ============================================

const KNOWLEDGE_DIR = './knowledge_data';
if (!fs.existsSync(KNOWLEDGE_DIR)) {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

// ============================================
// SCRAPER FUNCTIONS
// ============================================

// Simple HTTP GET
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract keywords from content
function extractKeywords(content) {
  const keywords = [];
  const patterns = [
    /[\u4e00-\u9fa5]{2,8}/g,  // Chinese
    /[a-zA-Z]{3,20}/g          // English
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      keywords.push(...matches.slice(0, 50));
    }
  });
  
  return [...new Set(keywords)];
}

// Extract news titles (simple)
function extractNews(content) {
  const news = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (line.length > 20 && line.length < 200) {
      news.push(line.trim());
    }
  });
  
  return news.slice(0, 20);
}

// Save knowledge
function saveKnowledge(source, data) {
  const file = path.join(KNOWLEDGE_DIR, `${source}_${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify({
    source,
    timestamp: new Date().toISOString(),
    data
  }, null, 2));
  return file;
}

// ============================================
// AUTO SCRAPER
// ============================================

async function scrapeSource(source) {
  console.log(`\n🕷️ Scraping: ${source.name} (${source.url})`);
  
  try {
    const content = await httpGet(source.url);
    
    const keywords = extractKeywords(content);
    const news = extractNews(content);
    
    const knowledge = {
      source: source.name,
      category: source.category,
      url: source.url,
      keywords: keywords.slice(0, 30),
      newsCount: news.length,
      scrapedAt: new Date().toISOString()
    };
    
    const file = saveKnowledge(source.name, knowledge);
    console.log(`   ✅ Saved: ${file}`);
    console.log(`   📰 Keywords found: ${knowledge.keywords.length}`);
    
    return knowledge;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Scrape all sources
async function scrapeAll() {
  console.log('='.repeat(60));
  console.log('🌐 KNOWLEDGE TREE - AUTO SCRAPER');
  console.log('='.repeat(60));
  
  const allSources = [
    ...SOURCES.chinese,
    ...SOURCES.international,
    ...SOURCES.crypto,
    ...SOURCES.news
  ];
  
  console.log(`\n📡 Total sources: ${allSources.length}`);
  console.log('Starting scrape...\n');
  
  const results = [];
  
  for (const source of allSources.slice(0, 5)) { // Limit to 5 for demo
    const result = await scrapeSource(source);
    if (result) results.push(result);
    await new Promise(r => setTimeout(r, 1000)); // Delay between requests
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Scraped ${results.length} sources`);
  console.log('='.repeat(60));
  
  return results;
}

// ============================================
// KNOWLEDGE BASE MANAGEMENT
// ============================================

function buildKnowledgeTree() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.json'));
  
  const tree = {
    totalSources: files.length,
    lastUpdated: new Date().toISOString(),
    categories: {},
    keywords: [],
    sources: []
  };
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8'));
      if (data.data) {
        const cat = data.data.category || 'unknown';
        if (!tree.categories[cat]) tree.categories[cat] = 0;
        tree.categories[cat]++;
        tree.keywords.push(...data.data.keywords || []);
        tree.sources.push(data.data.source);
      }
    } catch (e) {}
  });
  
  // Deduplicate keywords
  tree.keywords = [...new Set(tree.keywords)];
  tree.sources = [...new Set(tree.sources)];
  
  return tree;
}

function displayKnowledgeTree() {
  const tree = buildKnowledgeTree();
  
  console.log('\n📚 KNOWLEDGE TREE');
  console.log('='.repeat(50));
  console.log(`Total Sources Scraped: ${tree.totalSources}`);
  console.log(`Total Keywords: ${tree.keywords.length}`);
  console.log('\n📂 Categories:');
  Object.keys(tree.categories).forEach(cat => {
    console.log(`   ${cat}: ${tree.categories[cat]}`);
  });
  console.log('\n📰 Sources:');
  tree.sources.forEach(s => console.log(`   - ${s}`));
  console.log('');
  
  return tree;
}

// ============================================
// MAIN
// ============================================

console.log('🌐 KNOWLEDGE TREE SYSTEM');
console.log('='.repeat(50));

// Run scrape
scrapeAll().then(() => {
  // Display knowledge tree
  displayKnowledgeTree();
});

module.exports = {
  SOURCES,
  scrapeSource,
  scrapeAll,
  buildKnowledgeTree,
  displayKnowledgeTree
};
