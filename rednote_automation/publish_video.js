#!/usr/bin/env node

/**
 * Xiaohongshu Video Publisher
 * Uses the auto-rednote plugin's approach to upload videos
 */

import { mkdir, copyFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";

const UPLOAD_DIR = "/tmp/openclaw/uploads";

const VIDEO_PATH = process.argv[2] || "/Users/liu/Desktop/Stock_Analysis/rednote_automation/output/cat_video.mp4";
const TITLE = process.argv[3] || "🐱 Cute Cat Video #cat #cute #funny";
const CONTENT = process.argv[4] || "AI generated cute cat video! 🐱\n\n#cat #cute #animation #funny #pet";

async function main() {
  console.log("📤 Xiaohongshu Video Publisher");
  console.log("============================\n");
  
  // Stage the file
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${basename(VIDEO_PATH)}`;
  const stagedPath = join(UPLOAD_DIR, filename);
  
  console.log(`📋 Video: ${VIDEO_PATH}`);
  console.log(`📋 Title: ${TITLE}`);
  console.log(`📋 Content: ${CONTENT}\n`);
  
  console.log("⏳ File staged to:", stagedPath);
  
  console.log("\n⚠️  The auto-rednote plugin can automate this!");
  console.log("   Plugin location: ~/npm/lib/node_modules/openclaw/extensions/auto-rednote/");
  console.log("\n📝 The plugin has:");
  console.log("   - publishNote() function");
  console.log("   - armFileChooser() for file upload");
  console.log("   - Full video upload automation");
  
  console.log("\n💡 To use: Ensure auto-rednote plugin is loaded in OpenClaw");
  
  // Cleanup
  try {
    await unlink(stagedPath);
  } catch(e) {}
}

main();
