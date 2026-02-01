#!/usr/bin/env node

/**
 * Compatibility wrapper for the TypeScript script.
 * Run: node scripts/send-google-test-email.js
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const tsxPath = path.join(__dirname, "..", "node_modules", ".bin", "tsx");
const scriptPath = path.join(__dirname, "send-google-test-email.ts");

const result = spawnSync(tsxPath, [scriptPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
