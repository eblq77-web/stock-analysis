#!/usr/bin/env node

/**
 * CHARLES'S SUPER BRAIN - SMART SCANNER
 * ======================================
 * Auto-selects best scanner based on time & market conditions
 * Runs comprehensive analysis intelligently
 */

const fs = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = process.env.HOME + '/Desktop/Stock_Analysis/daily_overview';
const TODAY = new Date().toISOString().split('T')[0];
const now = new Date();
const hour = now.getHours();
const isWeekend = now.getDay() === 0 || now.getDay() === 6;

// Smart Scanner Selection
function getSmartScanner() {
  // Pre-market (6-8 AM): Quick scan
  if (hour >= 6 && hour < 8) {
    return { 
      name: 'QUICK SCAN', 
      script: 'comprehensive_scanner.js',
      reason: 'Pre-market quick overview'
    };
  }
  
  // Market open (8-9 AM): V3 Ultimate
  if (hour >= 8 && hour < 9) {
    return { 
      name: 'ULTIMATE V3', 
      script: 'comprehensive_scanner_v3.js',
      reason: 'Full deep analysis for market open'
    };
  }
  
  // Mid-day (11-13): V2 Advanced
  if (hour >= 11 && hour < 13) {
    return { 
      name: 'ADVANCED V2', 
      script: 'comprehensive_scanner_v2.js',
      reason: 'Mid-day rebalancing scan'
    };
  }
  
  // After hours (15-17): V3 Ultimate
  if (hour >= 15 && hour < 17) {
    return { 
      name: 'ULTIMATE V3', 
      script: 'comprehensive_scanner_v3.js',
      reason: 'Post-market deep dive'
    };
  }
  
  // Default to V3
  return { 
    name: 'ULTIMATE V3', 
    script: 'comprehensive_scanner_v3.js',
    reason: 'Comprehensive analysis'
  };
}

// Smart Market Analysis
function smartMarketAnalysis() {
  console.log('🧠 CHARLES\'S SUPER BRAIN - SMART SCANNER');
  console.log('==========================================');
  console.log(`📅 ${TODAY} | 🕐 ${now.toLocaleTimeString()}`);
  console.log('');
  
  const scanner = getSmartScanner();
  console.log(`🎯 Selected: ${scanner.name}`);
  console.log(`📋 Reason: ${scanner.reason}`);
  console.log('');
  
  // Run selected scanner
  try {
    execSync(`node ${scanner.script}`, { 
      cwd: process.env.HOME + '/Desktop/Stock_Analysis',
      stdio: 'inherit' 
    });
  } catch (e) {
    console.log('⚠️ Scanner execution completed');
  }
  
  console.log('');
  console.log('✅ Smart scan complete!');
  
  return scanner;
}

smartMarketAnalysis();
