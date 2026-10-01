require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { loadUsers, findUser, toolArgs } = require('./src/users');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');
const users = loadUsers(path.resolve(__dirname, config.usersFile), repoRoot);

const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', async (msg) => {
  const user = msg.from && findUser(msg.from.id, users);
  if (!user) return;
  if (!msg.text) return;

  try {
    const reply = await runClaude(msg.text, {
      cwd: user.cwd,
      extraArgs: toolArgs(user),
    });
    const chunks = chunkMessage(reply);
    for (const chunk of chunks) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Error: ${err.message}`).catch(() => {});
  }
});

bot.on('polling_error', (err) => console.error('polling_error:', err.message));

console.log('Telegram bot is running (polling)...');
