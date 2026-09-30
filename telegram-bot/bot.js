require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { isAllowedUser } = require('./src/allowlist');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');
const { createMessageHandler } = require('./src/handleMessage');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');

const bot = new TelegramBot(config.token, { polling: true });

const handleMessage = createMessageHandler({
  config,
  cwd: repoRoot,
  runClaude: (promptText, options) => runClaude(promptText, { ...options, timeoutMs: config.timeoutMs }),
  chunkMessage,
  isAllowedUser,
  sendMessage: (chatId, text) => bot.sendMessage(chatId, text),
});

bot.on('message', handleMessage);

console.log('Telegram bot is running (polling)...');
