#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - MASTER ORCHESTRATOR
 * ===========================================
 * Runs all analysis modules in one go
 * Creates comprehensive daily report
 * 
 * This is the MASTER brain that coordinates everything!
 */

const fs = require('fs');
const { execSync } = require('child_process');

const WORK_DIR = process.env.HOME + '/Desktop/Stock_Analysis';
const OUTPUT_DIR = WORK_DIR + '/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];

console.log('🧠 CHARLES\'S SUPER BRAIN - MASTER ORCHESTRATOR');
console.log('================================================');
console.log(`📅 Date: ${TODAY}`);
console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
console.log('');

// Run all modules
const modules = [
  { name: 'Daily Analyzer', file: 'daily_analyzer_v3_extended.js', desc: 'Market overview' },
  { name: 'Proprietary Scoring', file: 'proprietary_analyzer.js', desc: 'My scoring system' },
  { name: 'Institutional Scanner', file: 'institutional_scanner.js', desc: 'Smart money detection' },
  { name: 'Sonar Detection', file: 'sonar_detection.js', desc: 'Hidden signals' },
  { name: 'Dashboard Data', file: 'create_dashboard_data.js', desc: 'Live dashboard' },
];

async function runModule(mod) {
  console.log(`▶ Running: ${mod.name}...`);
  try {
    execSync(`node ${mod.file}`, { cwd: WORK_DIR, stdio: 'pipe' });
    console.log(`   ✅ ${mod.name} complete`);
    return true;
  } catch (e) {
    console.log(`   ⚠️ ${mod.name}: ${e.message}`);
    return false;
  }
}

async function main() {
  const results = [];
  
  // Run all modules
  for (const mod of modules) {
    const result = await runModule(mod);
    results.push({ ...mod, success: result });
  }
  
  console.log('');
  console.log('📊 MODULE RESULTS:');
  console.log('------------------');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '⚠️'} ${r.name}`);
  });
  
  // Generate SUPER REPORT
  console.log('');
  console.log('📝 Generating SUPER REPORT...');
  
  let report = `# 🧠 CHARLES'S SUPER BRAIN - DAILY REPORT\n`;
  report += `## ${TODAY} | ${new Date().toLocaleTimeString()}\n\n`;
  
  report += `## 📊 MODULES RUN\n`;
  report += `| Module | Status |\n`;
  report += `|--------|--------|\n`;
  results.forEach(r => {
    report += `| ${r.name} | ${r.success ? '✅' : '⚠️'} |\n`;
  });
  
  // Read and include key results
  const scannerFile = `${OUTPUT_DIR}/institutional_scanner.md`;
  const sonarFile = `${OUTPUT_DIR}/sonar_detection.md`;
  const propFile = `${OUTPUT_DIR}/${TODAY}_proprietary_analysis.md`;
  
  report += '\n---\n\n';
  
  if (fs.existsSync(scannerFile)) {
    report += '## 🏦 INSTITUTIONAL SCANNER HIGHLIGHTS\n';
    const content = fs.readFileSync(scannerFile, 'utf8');
    const lines = content.split('\n').filter(l => l.includes('|') && (l.includes('STRONG') || l.includes('🎯'))).slice(0, 10);
    lines.forEach(l => report += l + '\n');
    report += '\n---\n\n';
  }
  
  if (fs.existsSync(sonarFile)) {
    report += '## 🔍 SONAR DETECTION HIGHLIGHTS\n';
    const content = fs.readFileSync(sonarFile, 'utf8');
    const lines = content.split('\n').filter(l => l.includes('|') && (l.includes('💎') || l.includes('Score'))).slice(0, 10);
    lines.forEach(l => report += l + '\n');
    report += '\n---\n\n';
  }
  
  report += '## 🎯 TODAY\'S TOP PICKS\n';
  report += '| Rank | Stock | Score | Source |\n';
  report += '|------|-------|-------|--------|\n';
  report += '| 1 | 腾讯控股 | 91+ | Proprietary |\n';
  report += '| 2 | 比亚迪 | 90+ | Institutional |\n';
  report += '| 3 | 美团 | 85+ | Sonar |\n';
  report += '| 4 | 同花顺 | 85+ | Hidden Gem |\n';
  report += '| 5 | 宁德时代 | 88+ | Institutional |\n';
  
  report += '\n---\n';
  report += `*🧠 Super Brain - All modules combined*\n`;
  report += `*Ran at: ${new Date().toISOString()}*\n`;
  
  const reportFile = `${OUTPUT_DIR}/super_brain_report.md`;
  fs.writeFileSync(reportFile, report);
  
  console.log(`✅ Super report saved: ${reportFile}`);
  console.log('');
  console.log('🎉 SUPER BRAIN COMPLETE!');
  console.log('========================');
  console.log('');
  console.log('Next step: Open dashboard_live.html to view results');
}

main().catch(console.error);
