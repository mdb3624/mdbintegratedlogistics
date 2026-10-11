#!/usr/bin/env node
// Usage: node scripts/smoke-test.js [--send-only]
// Needs TELEGRAM_TEST_TOKEN (a dedicated test bot, NOT the production token) and
// TELEGRAM_TEST_CHAT_ID. Stop any running bot that uses the same token first,
// or getUpdates will conflict.
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { runSmoke } = require('../src/smoke');

runSmoke({ sendOnly: process.argv.includes('--send-only') }).then((result) => {
  console.log(`[smoke-test] ${result.status.toUpperCase()}: ${result.message}`);
  process.exit(result.status === 'failed' ? 1 : 0);
});
