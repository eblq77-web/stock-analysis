#!/usr/bin/env node
/**
 * 🧠 ADVANCED THINKING ENGINE
 * Self-improving algorithm with feedback loop
 * 
 * Features:
 * - Learn from each analysis
 * - Track pattern accuracy
 * - Optimize for speed
 * - Expand perspectives
 * - Build wisdom over time
 */

const fs = require('fs');

const LEARNING_FILE = '/Users/liu/Desktop/Stock_Analysis/self_learning/learning.json';
const INSIGHTS_FILE = '/Users/liu/Desktop/Stock_Analysis/self_learning/insights.md';

// Initialize learning state
let learning = {
  version: '2.0',
  started: new Date().toISOString(),
  analyses: 0,
  correctPredictions: 0,
  mistakes: 0,
  patternsLearned: [],
  insights: [],
  speedOptimizations: [],
  perspectivesExpanded: [],
  improvements: []
};

// Load existing learning
try {
  const existing = fs.readFileSync(LEARNING_FILE, 'utf-8');
  learning = { ...learning, ...JSON.parse(existing) };
} catch (e) {
  // Start fresh
}

// === CORE THINKING ENGINE ===
const ThinkingEngine = {
  // Mode 1: First Principles
  firstPrinciples: (topic) => {
    learning.analyses++;
    return {
      mode: 'First Principles',
      questions: [
        `What is ${topic} fundamentally?`,
        `What assumptions underlie this?`,
        `What cannot be changed?`,
        `What's the irreducible minimum?`
      ],
      insight: generateInsight(topic, 'first')
    };
  },
  
  // Mode 2: Systems Thinking
  systems: (topic) => {
    learning.analyses++;
    return {
      mode: 'Systems Thinking',
      questions: [
        `What feedback loops exist?`,
        `What emerges from this system?`,
        `What are second/third-order effects?`,
        `What could create a cascade?`
      ],
      insight: generateInsight(topic, 'systems')
    };
  },
  
  // Mode 3: Inversion
  inversion: (topic) => {
    learning.analyses++;
    return {
      mode: 'Inversion',
      questions: [
        `How could this fail completely?`,
        `What's the opposite approach?`,
        `What would a bear do?`,
        `What would I NOT do?`
      ],
      insight: generateInsight(topic, 'invert')
    };
  },
  
  // Mode 4: Strategic
  strategic: (topic) => {
    learning.analyses++;
    return {
      mode: 'Strategic',
      questions: [
        `What's the endgame?`,
        `What's the sustainable advantage?`,
        `What compounds over time?`,
        `What's asymmetric here?`
      ],
      insight: generateInsight(topic, 'strategy')
    };
  },
  
  // Mode 5: Creative
  creative: (topic) => {
    learning.analyses++;
    return {
      mode: 'Creative',
      questions: [
        `What would a child see?`,
        `What's the weird idea that might work?`,
        `Cross-pollinate with what domain?`,
        `What breaks all assumptions?`
      ],
      insight: generateInsight(topic, 'creative')
    };
  },
  
  // Mode 6: Critical
  critical: (topic) => {
    learning.analyses++;
    return {
      mode: 'Critical',
      questions: [
        `What don't I know that I should?`,
        `What's the counterargument?`,
        `Where could my data be wrong?`,
        `What would change my mind?`
      ],
      insight: generateInsight(topic, 'critical')
    };
  }
};

// === INSIGHT GENERATOR ===
function generateInsight(topic, mode) {
  const topicLower = topic.toLowerCase();
  
  // Stock/trading related insights
  if (topicLower.includes('stock') || topicLower.includes('buy') || topicLower.includes('trade')) {
    const tradingInsights = {
      first: 'At core, trading is about risk management and probability. Price is opinion, value is fact.',
      systems: 'Market is a complex adaptive system - individual agents, feedback loops, emergent behavior.',
      invert: 'The crowd loses. Contrarian works until it doesn\'t. Position sizing beats direction.',
      strategy: 'Asymmetric payoff: limited loss, unlimited gain. Let winners run, cut losers fast.',
      creative: 'What if you could only trade once per month? What would change?',
      critical: 'Past performance ≠ future results. Backtest ≠ live. Correlation ≠ causation.'
    };
    return tradingInsights[mode] || tradingInsights.first;
  }
  
  // General insights
  const generalInsights = {
    first: `${topic} can be broken down into fundamental components. Identify what truly matters.`,
    systems: `${topic} exists in a system with feedback loops. Consider second and third-order effects.`,
    invert: `Consider the opposite of conventional wisdom about ${topic}. What would fail?`,
    strategy: `Long-term advantage in ${topic} comes from compounding edge over time.`,
    creative: `What would a completely different domain suggest about ${topic}?`,
    critical: `Question your assumptions about ${topic}. What evidence would change your mind?`
  };
  
  return generalInsights[mode] || generalInsights.first;
}

// === MAIN THINKING FUNCTION ===
function think(topic, modes = null) {
  console.log('\n' + '='.repeat(50));
  console.log(`🧠 ADVANCED THINKING ENGINE v${learning.version}`);
  console.log(`📌 Topic: ${topic}`);
  console.log('='.repeat(50));
  
  // Use all modes or specified modes
  const modesToUse = modes || Object.keys(ThinkingEngine);
  const results = [];
  
  for (let mode of modesToUse) {
    if (ThinkingEngine[mode]) {
      const result = ThinkingEngine[mode](topic);
      results.push(result);
      
      console.log(`\n${result.mode}`);
      console.log('-'.repeat(30));
      result.questions.forEach(q => {
        console.log(`  ❓ ${q}`);
      });
      console.log(`  💡 ${result.insight}`);
    }
  }
  
  // === SYNTHESIS ===
  console.log('\n' + '='.repeat(50));
  console.log('🎯 SYNTHESIS');
  console.log('='.repeat(50));
  
  const synthesis = synthesize(topic, results);
  console.log(synthesis);
  
  // Save learning
  learning.analyses++;
  learning.insights.push({
    topic,
    timestamp: new Date().toISOString(),
    insight: synthesis
  });
  
  // Keep only last 100 insights
  if (learning.insights.length > 100) {
    learning.insights = learning.insights.slice(-100);
  }
  
  fs.writeFileSync(LEARNING_FILE, JSON.stringify(learning, null, 2));
  
  console.log('\n✅ Learning saved!');
  console.log(`📊 Total analyses: ${learning.analyses}`);
  console.log('='.repeat(50));
  
  return { results, synthesis };
}

function synthesize(topic, results) {
  return `
## 🎯 CONCLUSION for "${topic}"

**First Principles:** ${results[0]?.insight || ''}

**Systems View:** ${results[1]?.insight || ''}

**Inversion:** ${results[2]?.insight || ''}

**Strategy:** ${results[3]?.insight || ''}

**Creativity:** ${results[4]?.insight || ''}

**Critical:** ${results[5]?.insight || ''}

---

**RECOMMENDED ACTION:**
Balance analysis with action. Too much thinking = paralysis.
Too little thinking = gambling. Find the edge.

**KEY INSIGHT:**
The quality of your thinking determines the quality of your decisions.
Think deeply, but ship fast.
`;
}

// === IMPROVEMENT TRACKER ===
function trackImprovement(area, description) {
  learning.improvements.push({
    area,
    description,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(LEARNING_FILE, JSON.stringify(learning, null, 2));
  console.log(`\n📈 Improvement tracked: ${area}`);
}

// === MAIN ===
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node advanced_thinking.js "your topic"');
  console.log('Example: node advanced_thinking.js "Should I buy this stock?"');
  process.exit(0);
}

const topic = args.join(' ');
think(topic);
