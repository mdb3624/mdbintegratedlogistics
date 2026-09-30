require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { isAllowedUser } = require('./src/allowlist');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');

const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', async (msg) => {
  if (!isAllowedUser(msg.from.id, config.allowedUserIds)) return;
  if (!msg.text) return;

  try {
    const reply = await runClaude(msg.text, { cwd: repoRoot });
    const chunks = chunkMessage(reply);
    for (const chunk of chunks) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

console.log('Telegram bot is running (polling)...');
