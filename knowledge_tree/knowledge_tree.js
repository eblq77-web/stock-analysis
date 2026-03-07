/**
 * 🌳 KNOWLEDGE TREE - Self Learning System
 * Organizes scraped knowledge into tree structure
 * Auto-updates and learns from new information
 * 
 * Version 1.0 - Intelligent Knowledge Base
 */

const fs = require('fs');
const path = require('path');

// Knowledge data directory
const DATA_DIR = './knowledge_data';

// Initialize knowledge tree structure
const KNOWLEDGE_TREE = {
  meta: {
    name: 'Super Brain Knowledge Tree',
    version: '1.0',
    created: new Date().toISOString(),
    lastUpdate: null
  },
  
  // Main categories
  categories: {
    finance: {
      subcategories: ['stocks', 'bonds', 'forex', 'commodities', 'crypto'],
      keywords: [],
      sources: []
    },
    geopolitics: {
      subcategories: ['us_china', 'fed', 'trade_war', 'global'],
      keywords: [],
      sources: []
    },
    sectors: {
      subcategories: ['科技', '医药', '新能源', '消费', '金融', '地产'],
      keywords: [],
      sources: []
    },
    patterns: {
      subcategories: ['accumulation', 'breakout', 'bottom', 'contrarian'],
      keywords: [],
      sources: []
    },
    indicators: {
      subcategories: ['technical', 'fundamental', 'sentiment', 'volume'],
      keywords: [],
      sources: []
    }
  },
  
  // Learned insights
  insights: [],
  
  // Source credibility scores
  sourceScores: {},
  
  // Pattern success rates
  patternSuccess: {}
};

// ============================================
// KNOWLEDGE TREE MANAGEMENT
// ============================================

function loadTree() {
  const treeFile = path.join(DATA_DIR, 'knowledge_tree.json');
  if (fs.existsSync(treeFile)) {
    return JSON.parse(fs.readFileSync(treeFile, 'utf-8'));
  }
  return KNOWLEDGE_TREE;
}

function saveTree(tree) {
  const treeFile = path.join(DATA_DIR, 'knowledge_tree.json');
  tree.meta.lastUpdate = new Date().toISOString();
  fs.writeFileSync(treeFile, JSON.stringify(tree, null, 2));
}

// Add knowledge to tree
function addKnowledge(category, subcategory, data) {
  const tree = loadTree();
  
  if (!tree.categories[category]) {
    tree.categories[category] = { subcategories: {}, keywords: [], sources: [] };
  }
  
  // Add keywords
  if (data.keywords) {
    tree.categories[category].keywords.push(...data.keywords);
    tree.categories[category].keywords = [...new Set(tree.categories[category].keywords)];
  }
  
  // Add source
  if (data.source) {
    if (!tree.categories[category].sources.includes(data.source)) {
      tree.categories[category].sources.push(data.source);
    }
  }
  
  // Update subcategory
  if (subcategory && tree.categories[category].subcategories) {
    if (!Array.isArray(tree.categories[category].subcategories)) {
      tree.categories[category].subcategories = Object.keys(tree.categories[category].subcategories);
    }
  }
  
  saveTree(tree);
  return tree;
}

// Add insight
function addInsight(insight) {
  const tree = loadTree();
  
  tree.insights.push({
    id: tree.insights.length + 1,
    ...insight,
    createdAt: new Date().toISOString()
  });
  
  // Keep only last 100 insights
  if (tree.insights.length > 100) {
    tree.insights = tree.insights.slice(-100);
  }
  
  saveTree(tree);
  return tree;
}

// Update pattern success
function updatePatternSuccess(pattern, success) {
  const tree = loadTree();
  
  if (!tree.patternSuccess[pattern]) {
    tree.patternSuccess[pattern] = { wins: 0, total: 0 };
  }
  
  tree.patternSuccess[pattern].total++;
  if (success) {
    tree.patternSuccess[pattern].wins++;
  }
  
  tree.patternSuccess[pattern].rate = Math.round(
    (tree.patternSuccess[pattern].wins / tree.patternSuccess[pattern].total) * 100
  );
  
  saveTree(tree);
  return tree;
}

// ============================================
// QUERY KNOWLEDGE
// ============================================

function queryKnowledge(query) {
  const tree = loadTree();
  const results = {
    categories: [],
    insights: [],
    patterns: [],
    keywords: []
  };
  
  // Search categories
  Object.keys(tree.categories).forEach(cat => {
    const category = tree.categories[cat];
    const keywords = category.keywords || [];
    
    keywords.forEach(kw => {
      if (kw.toLowerCase().includes(query.toLowerCase())) {
        results.categories.push({ category: cat, keyword: kw });
        results.keywords.push(kw);
      }
    });
  });
  
  // Search insights
  tree.insights.forEach(insight => {
    const text = JSON.stringify(insight).toLowerCase();
    if (text.includes(query.toLowerCase())) {
      results.insights.push(insight);
    }
  });
  
  // Search patterns
  Object.keys(tree.patternSuccess).forEach(pattern => {
    if (pattern.toLowerCase().includes(query.toLowerCase())) {
      results.patterns.push({
        pattern,
        ...tree.patternSuccess[pattern]
      });
    }
  });
  
  return results;
}

// ============================================
// AUTO LEARN FROM ANALYSIS
// ============================================

function autoLearn(stockData, tradeResult) {
  const tree = loadTree();
  
  // Learn from trade
  if (tradeResult) {
    const pattern = tradeResult.pattern || 'unknown';
    const success = tradeResult.profit > 0;
    updatePatternSuccess(pattern, success);
    
    addInsight({
      type: 'trade_learn',
      stock: stockData.code,
      pattern,
      success,
      profit: tradeResult.profit,
      note: `Learned from ${success ? 'winning' : 'losing'} trade`
    });
  }
  
  // Learn from market regime
  if (stockData.marketRegime) {
    addInsight({
      type: 'regime_learn',
      regime: stockData.marketRegime,
      action: stockData.action,
      success: tradeResult?.success,
      note: `Market regime: ${stockData.marketRegime}`
    });
  }
  
  // Learn from geopolitical
  if (stockData.geopolitical) {
    addInsight({
      type: 'geo_learn',
      factor: stockData.geopolitical,
      note: `Geopolitical factor: ${stockData.geopolitical}`
    });
  }
  
  return tree;
}

// ============================================
// DISPLAY TREE
// ============================================

function displayTree() {
  const tree = loadTree();
  
  console.log('\n' + '='.repeat(60));
  console.log('🌳 KNOWLEDGE TREE - Super Brain');
  console.log('='.repeat(60));
  console.log(`\n📅 Last Update: ${tree.meta.lastUpdate || 'Never'}`);
  
  console.log('\n📂 CATEGORIES:');
  Object.keys(tree.categories).forEach(cat => {
    const c = tree.categories[cat];
    const keywords = c.keywords?.length || 0;
    const sources = c.sources?.length || 0;
    console.log(`   📁 ${cat}: ${keywords} keywords, ${sources} sources`);
  });
  
  console.log('\n🎯 PATTERN SUCCESS RATES:');
  Object.keys(tree.patternSuccess).forEach(p => {
    const s = tree.patternSuccess[p];
    console.log(`   ${p}: ${s.rate}% (${s.wins}/${s.total})`);
  });
  
  console.log('\n💡 RECENT INSIGHTS:');
  tree.insights.slice(-5).forEach(i => {
    console.log(`   - ${i.type}: ${i.note || ''}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  return tree;
}

// ============================================
// MAIN
// ============================================

console.log('🌳 KNOWLEDGE TREE SYSTEM');
console.log('='.repeat(50));

// Add sample knowledge
addKnowledge('finance', 'stocks', {
  keywords: ['A股', '创业板', '科创板', '北交所', '新能源', '半导体'],
  source: 'EastMoney'
});

addKnowledge('geopolitics', 'us_china', {
  keywords: ['中美关系', '贸易战', '关税', '科技封锁', '台海'],
  source: 'Reuters'
});

addKnowledge('patterns', 'accumulation', {
  keywords: ['建仓', '吸筹', '机构买入', '成交量放大'],
  source: 'Internal'
});

// Update pattern success
updatePatternSuccess('accumulation', true);
updatePatternSuccess('accumulation', true);
updatePatternSuccess('accumulation', false);
updatePatternSuccess('breakout', true);

// Add insight
addInsight({
  type: 'observation',
  note: 'Institutional money flowing into 新能源 despite market weakness',
  confidence: 80
});

addInsight({
  type: 'pattern',
  note: 'Bottom fishing works best when RSI < 30 and volume surges',
  confidence: 75
});

// Display
displayTree();

// Query demo
console.log('\n🔍 Query "新能源":');
const results = queryKnowledge('新能源');
console.log('   Keywords found:', results.keywords.slice(0, 5));
console.log('   Insights:', results.insights.length);

console.log('\n✅ Knowledge Tree Ready!');

module.exports = {
  addKnowledge,
  addInsight,
  updatePatternSuccess,
  queryKnowledge,
  autoLearn,
  displayTree,
  loadTree
};
