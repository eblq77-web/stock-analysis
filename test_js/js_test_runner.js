#!/usr/bin/env node
/**
 * JS Test Runner - Test JavaScript before production
 * 
 * Usage: node js_test_runner.js [testfile]
 */

const fs = require('fs');
const { execSync } = require('child_process');

const TEST_DIR = '/Users/liu/Desktop/Stock_Analysis/test_js';

// Ensure test directory
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📝 JS Test Runner
=================
Usage: node js_test_runner.js [test_name]

Commands:
  run [name]   - Run a test
  new [name]   - Create new test
  list         - List all tests
  last         - Run last test

Examples:
  node js_test_runner.js run quickStats
  node js_test_runner.js new myFunction
  `);
  process.exit(0);
}

const command = args[0];
const testName = args[1];

if (command === 'run' && testName) {
  const testFile = `${TEST_DIR}/${testName}.js`;
  
  if (!fs.existsSync(testFile)) {
    console.log(`❌ Test not found: ${testFile}`);
    process.exit(1);
  }
  
  console.log(`\n🧪 Running test: ${testName}`);
  console.log('='.repeat(40));
  
  try {
    execSync(`node ${testFile}`, { stdio: 'inherit' });
    console.log('='.repeat(40));
    console.log('✅ TEST PASSED!\n');
  } catch (e) {
    console.log('='.repeat(40));
    console.log('❌ TEST FAILED!\n');
    process.exit(1);
  }
} else if (command === 'new' && testName) {
  const testFile = `${TEST_DIR}/${testName}.js`;
  
  const template = `// Test: ${testName}
// Created: ${new Date().toISOString()}

const fs = require('fs');

// ===== YOUR CODE HERE =====

function test${testName}() {
  console.log('Testing ${testName}...');
  
  // Test logic here
  const result = true;
  
  if (result) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
  
  return result;
}

// Run test
test${testName}();
`;
  
  fs.writeFileSync(testFile, template);
  console.log(`✅ Created test: ${testFile}`);
  console.log(`Edit it, then run: node js_test_runner.js run ${testName}`);
  
} else if (command === 'list') {
  const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.js'));
  console.log('\n📁 Available tests:');
  files.forEach(f => console.log('  -', f.replace('.js', '')));
  console.log('');
  
} else {
  console.log('Unknown command. Try: node js_test_runner.js');
}
