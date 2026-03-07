#!/usr/bin/env node

/**
 * CHARLES'S BRAIN - AUTO MEMORY BACKUP (SILENT)
 * Runs quietly in background
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.HOME + '/.openclaw/workspace/memory';
const BACKUP_DIR = process.env.HOME + '/.openclaw/workspace/.memory_backup';
const WORKSPACE = process.env.HOME + '/.openclaw/workspace';

const TODAY = new Date().toISOString().split('T')[0];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function backupMemory() {
  ensureDir(BACKUP_DIR);
  
  // Backup daily memory
  const dailyMemory = path.join(MEMORY_DIR, `${TODAY}.md`);
  if (fs.existsSync(dailyMemory)) {
    fs.copyFileSync(dailyMemory, path.join(BACKUP_DIR, `${TODAY}.md`));
  }
  
  // Backup long-term memory
  const longTermMemory = path.join(WORKSPACE, 'MEMORY.md');
  if (fs.existsSync(longTermMemory)) {
    fs.copyFileSync(longTermMemory, path.join(BACKUP_DIR, 'MEMORY.md'));
  }
  
  // Create snapshot
  let snapshot = `# CHARLES'S BRAIN - DAILY SNAPSHOT\n`;
  snapshot += `## ${TODAY}\n\n`;
  if (fs.existsSync(dailyMemory)) {
    snapshot += fs.readFileSync(dailyMemory, 'utf8');
  }
  fs.writeFileSync(path.join(BACKUP_DIR, `snapshot_${TODAY}.md`), snapshot);
}

backupMemory();
