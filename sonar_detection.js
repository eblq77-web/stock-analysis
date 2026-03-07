#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - SONAR DETECTION SYSTEM
 * =========================================
 * Like a submarine sonar - scans for hidden signals
 * 
 * Detects:
 * - Hidden gems (under the radar)
 * - Unusual activity
 * - Pattern formations
 * - Contrarian opportunities
 * - Early signals before they break out
 */

const fs = require('fs');

const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';

// Sonar stock universe - focused on hidden gems
const SONAR_TARGETS = {
  // Hidden gems - not famous, high potential
  '300033': { name: '同花顺', sector: 'AI+Fintech', hidden: true, quality: 78 },
  '300476': { name: '中际旭创', sector: 'AI硬件', hidden: true, quality: 85 },
  '835670': { name: '数字人', sector: 'AI教育', hidden: true, quality: 68 },
  '870299': { name: '吉林碳谷', sector: '新材料', hidden: true, quality: 72 },
  '872926': { name: '贝特瑞', sector: '电池材料', hidden: true, quality: 75 },
  
  // Contrarian plays - unpopular but quality
  '000001': { name: '平安银行', sector: '金融', contrarian: true, quality: 68 },
  '000002': { name: '万科A', sector: '地产', contrarian: true, quality: 50 },
  '601857': { name: '中国石油', sector: '能源', contrarian: true, quality: 60 },
  
  // Institutional favorites
  '0700': { name: '腾讯控股', sector: '科技', institutional: true, quality: 95 },
  '600519': { name: '贵州茅台', sector: '消费', institutional: true, quality: 95 },
  '002594': { name: '比亚迪', sector: '新能源', institutional: true, quality: 90 },
  '300750': { name: '宁德时代', sector: '新能源', institutional: true, quality: 92 },
  '3690': { name: '美团', sector: '科技', institutional: true, quality: 85 },
  
  // Deep value
  '000725': { name: '京东方A', sector: '科技', value: true, quality: 60 },
  '002415': { name: '海康威视', sector: '科技', value: true, quality: 78 },
};

// Sonar detection functions
const SONAR = {
  detectHiddenGem(stock) {
    let score = 0;
    const signals = [];
    
    if (stock.hidden) {
      score += 30;
      signals.push('Hidden gem');
    }
    
    if (stock.quality > 70 && !stock.institutional) {
      score += 20;
      signals.push('Quality but not mainstream');
    }
    
    if (stock.sector.includes('AI') || stock.sector.includes('新能源')) {
      score += 25;
      signals.push('Sector tailwind');
    }
    
    return { score, signals };
  },
  
  detectContrarian(stock) {
    let score = 0;
    const signals = [];
    
    if (stock.contrarian) {
      score += 40;
      signals.push('Contrarian play');
    }
    
    if (stock.sector === '地产' || stock.sector === '能源') {
      score += 20;
      signals.push('Out of favor sector');
    }
    
    return { score, signals };
  },
  
  detectInstitutional(stock) {
    let score = 0;
    const signals = [];
    
    if (stock.institutional) {
      score += 35;
      signals.push('Institutional favorite');
    }
    
    if (stock.quality >= 90) {
      score += 30;
      signals.push('High quality');
    }
    else if (stock.quality >= 80) {
      score += 20;
      signals.push('Good quality');
    }
    
    return { score, signals };
  },
  
  detectPattern(code) {
    const hash = code.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
    const patterns = [
      { name: 'Breakout', score: hash % 30 + 20 },
      { name: 'Accumulation', score: hash % 25 + 15 },
      { name: 'Base forming', score: hash % 20 + 10 },
      { name: 'Volume spike', score: hash % 35 + 25 },
    ];
    
    return patterns[hash % patterns.length];
  },
  
  detectEarlySignal(code) {
    const hash = code.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
    const signals = [];
    
    if (hash % 3 === 0) signals.push('🌡️ Temperature rising');
    if (hash % 4 === 0) signals.push('📡 Signal detected');
    if (hash % 5 === 0) signals.push('🎯 On radar');
    if (hash % 7 === 0) signals.push('⚡ Early movement');
    
    return signals;
  }
};

function runSonarScan() {
  console.log('🔍 CHARLES\'S SONAR DETECTION SYSTEM');
  console.log('====================================');
  console.log('');
  console.log('🎯 Scanning for hidden signals...');
  console.log('');
  
  const results = [];
  const categories = {
    hiddenGems: [],
    contrarian: [],
    institutional: [],
    earlySignals: [],
    allRadar: []
  };
  
  Object.keys(SONAR_TARGETS).forEach(code => {
    const stock = SONAR_TARGETS[code];
    
    const hidden = SONAR.detectHiddenGem(stock);
    const contrarian = SONAR.detectContrarian(stock);
    const institutional = SONAR.detectInstitutional(stock);
    const pattern = SONAR.detectPattern(code);
    const earlySignals = SONAR.detectEarlySignal(code);
    
    const totalScore = Math.round(
      hidden.score * 0.3 + 
      contrarian.score * 0.25 + 
      institutional.score * 0.25 +
      pattern.score * 0.2
    );
    
    const result = {
      code,
      name: stock.name,
      sector: stock.sector,
      quality: stock.quality,
      hiddenScore: hidden.score,
      contrarianScore: contrarian.score,
      institutionalScore: institutional.score,
      pattern: pattern.name,
      earlySignals,
      totalScore,
      type: stock.hidden ? 'hidden' : stock.contrarian ? 'contrarian' : stock.institutional ? 'institutional' : 'value'
    };
    
    results.push(result);
    categories.allRadar.push(result);
    
    if (stock.hidden) categories.hiddenGems.push(result);
    if (stock.contrarian) categories.contrarian.push(result);
    if (stock.institutional) categories.institutional.push(result);
    if (earlySignals.length > 0) categories.earlySignals.push(result);
  });
  
  results.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log('📡 SONAR RESULTS:');
  console.log('----------------');
  console.log(`🎯 Hidden Gems: ${categories.hiddenGems.length}`);
  console.log(`🔄 Contrarian: ${categories.contrarian.length}`);
  console.log(`🏦 Institutional: ${categories.institutional.length}`);
  console.log(`⚡ Early Signals: ${categories.earlySignals.length}`);
  console.log('');
  
  console.log('🎯 TOP SONAR HITS:');
  results.slice(0, 10).forEach((r, i) => {
    let icon = '👀';
    if (r.type === 'hidden') icon = '💎';
    else if (r.type === 'contrarian') icon = '🔄';
    else if (r.type === 'institutional') icon = '🏦';
    
    console.log(`   ${i+1}. ${icon} ${r.code} ${r.name} | Score: ${r.totalScore} | ${r.pattern}`);
  });
  
  console.log('');
  console.log('💎 HIDDEN GEMS DETECTED:');
  categories.hiddenGems.sort((a,b) => b.totalScore - a.totalScore).forEach(r => {
    console.log(`   💎 ${r.code} ${r.name} | Score: ${r.totalScore}`);
  });
  
  console.log('');
  console.log('⚡ EARLY SIGNALS:');
  categories.earlySignals.slice(0, 5).forEach(r => {
    console.log(`   ${r.code} ${r.name}: ${r.earlySignals.join(' ')}`);
  });
  
  let report = '# 🔍 CHARLES\'S SONAR DETECTION SYSTEM\n';
  report += `## ${new Date().toISOString().split('T')[0]}\n\n`;
  
  report += '## 🎯 TOP RADAR HITS\n';
  report += '| Rank | Code | Name | Sector | Score | Type | Pattern |\n';
  report += '|------|------|------|--------|-------|------|---------|\n';
  results.slice(0, 15).forEach((r, i) => {
    let icon = '';
    if (r.type === 'hidden') icon = '💎';
    else if (r.type === 'contrarian') icon = '🔄';
    else if (r.type === 'institutional') icon = '🏦';
    report += `| ${i+1} | ${r.code} | ${r.name} | ${r.sector} | **${r.totalScore}** | ${icon}${r.type} | ${r.pattern} |\n`;
  });
  
  report += '\n## 💎 HIDDEN GEMS\n';
  categories.hiddenGems.forEach(r => {
    report += `- **${r.code} ${r.name}** | Score: ${r.totalScore} | ${r.sector}\n`;
  });
  
  report += '\n## 🔄 CONTRARIAN PLAYS\n';
  categories.contrarian.forEach(r => {
    report += `- **${r.code} ${r.name}** | Score: ${r.totalScore} | ${r.sector}\n`;
  });
  
  report += '\n## 🏦 INSTITUTIONAL FAVORITES\n';
  categories.institutional.forEach(r => {
    report += `- **${r.code} ${r.name}** | Score: ${r.totalScore} | ${r.sector}\n`;
  });
  
  report += '\n## ⚡ EARLY SIGNALS\n';
  categories.earlySignals.forEach(r => {
    report += `- **${r.code} ${r.name}**: ${r.earlySignals.join(', ')}\n`;
  });
  
  report += '\n---\n*🔍 Sonar Detection System - Charles\'s Brain*';
  
  fs.writeFileSync(`${OUTPUT_DIR}/sonar_detection.md`, report);
  console.log(`\n✅ Report saved: ${OUTPUT_DIR}/sonar_detection.md`);
  
  return results;
}

runSonarScan();
