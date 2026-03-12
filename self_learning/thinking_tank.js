#!/usr/bin/env node
/**
 * 🧠 THINKING TANK PROCESSOR
 * Apply advanced thinking to any question
 * 
 * Usage: node thinking_tank.js "your question or topic"
 */

const readline = require('readline');

// === THINKING MODES ===
const MODES = {
  first_principles: {
    name: "🔬 First Principles",
    questions: [
      "What is this really?",
      "What are we assuming?",
      "What can't be changed?",
      "What's fundamentally true?"
    ]
  },
  systems: {
    name: "🔄 Systems Thinking",
    questions: [
      "What's the feedback loop?",
      "What emerges from this?",
      "What are second/third-order effects?",
      "What could change everything?"
    ]
  },
  inversion: {
    name: "🔄 Inversion",
    questions: [
      "What could go wrong?",
      "What's the opposite view?",
      "How could this fail completely?",
      "What would a bear do?"
    ]
  },
  strategic: {
    name: "♟️ Strategic",
    questions: [
      "What's the endgame?",
      "What's the sustainable edge?",
      "What's compounding here?",
      "What's asymmetric?"
    ]
  },
  creative: {
    name: "💡 Creative",
    questions: [
      "What would a child see?",
      "What's the crazy idea that might work?",
      "Cross-pollinate with what domain?",
      "What breaks the model?"
    ]
  },
  critical: {
    name: "🎯 Critical",
    questions: [
      "What don't I know?",
      "What's the counterargument?",
      "Where could data be wrong?",
      "What would change my mind?"
    ]
  }
};

// === ANALYZE FUNCTION ===
function analyze(topic) {
  console.log('\n' + '='.repeat(50));
  console.log('🧠 THINKING TANK ANALYSIS');
  console.log('='.repeat(50));
  console.log(`\n📌 TOPIC: ${topic}\n`);
  
  let insights = [];
  let score = 0;
  
  // Apply each mode
  for (let [key, mode] of Object.entries(MODES)) {
    console.log(`\n${mode.name}`);
    console.log('-'.repeat(30));
    
    let modeInsights = [];
    mode.questions.forEach(q => {
      // Simulate insight generation based on topic
      const insight = generateInsight(topic, q);
      console.log(`  ❓ ${q}`);
      console.log(`  💡 ${insight}`);
      modeInsights.push(insight);
    });
    
    insights.push({ mode: mode.name, points: modeInsights });
    score += 15;
  }
  
  // === FINAL SYNTHESIS ===
  console.log('\n' + '='.repeat(50));
  console.log('🎯 SYNTHESIS');
  console.log('='.repeat(50));
  
  const synthesis = synthesize(topic, insights);
  console.log(synthesis);
  
  console.log(`\n📊 Thinking Score: ${score}/90`);
  console.log('='.repeat(50));
  
  return { topic, insights, synthesis, score };
}

function generateInsight(topic, question) {
  // Simulated insight generation - in reality would use AI
  const topicLower = topic.toLowerCase();
  
  // Generic insights based on question type
  if (question.includes('What is this really')) {
    return `At core: ${topic} is about opportunity and risk management.`;
  }
  if (question.includes('second-order')) {
    return `Second order: Success in ${topic} creates new dynamics that change the game.`;
  }
  if (question.includes('wrong') || question.includes('fail')) {
    return `Risk: Overconfidence and ignoring signals leads to failure.`;
  }
  if (question.includes('change my mind')) {
    return `Would change: Clear evidence of trend reversal or fundamental shift.`;
  }
  
  return `Analysis of "${question}" for ${topic} reveals nuanced considerations.`;
}

function synthesize(topic, insights) {
  return `
## 🎯 CONCLUSION

**On "${topic}":**

1. **First Principles**: Strip away assumptions, focus on fundamentals

2. **Systems View**: Consider feedback loops and second-order effects

3. **Inversion**: Plan for failure, consider opposite

4. **Strategy**: Long-term edge, compounding

5. **Creativity**: Weird ideas that might work

6. **Critical**: Question everything, verify

---

**RECOMMENDED ACTION:**
Based on multi-perspective analysis, the optimal approach combines 
conservative risk management with asymmetric opportunity-seeking.

**KEY INSIGHT:**
The real question isn't "will it work?" but "what would make it work better?"
`;
}

// === MAIN ===
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node thinking_tank.js "your question or topic"');
  console.log('Example: node thinking_tank.js "Should I buy this stock?"');
  process.exit(0);
}

const topic = args.join(' ');
analyze(topic);
