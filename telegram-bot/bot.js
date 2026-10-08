require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { loadUsers, findUser, toolArgs } = require('./src/users');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');
const { createSessionStore, createKeyedQueue } = require('./src/sessions');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');
const users = loadUsers(path.resolve(__dirname, config.usersFile), repoRoot);

const sessions = createSessionStore(path.resolve(__dirname, 'sessions.json'));
const enqueue = createKeyedQueue();

const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', async (msg) => {
  const user = msg.from && findUser(msg.from.id, users);
  if (!user) return;
  if (!msg.text) return;

  if (msg.text.trim() === '/new') {
    sessions.reset(msg.from.id);
    await bot.sendMessage(msg.chat.id, 'Started a new conversation.').catch(() => {});
    return;
  }

  await enqueue(String(msg.from.id), async () => {
    try {
      const run = (session) =>
        runClaude(msg.text, {
          cwd: user.cwd,
          extraArgs: toolArgs(user),
          sessionId: session.id,
          resume: session.resume,
        });
      let session = sessions.get(msg.from.id);
      let reply;
      try {
        reply = await run(session);
      } catch (err) {
        if (!session.resume) throw err;
        // Stale or missing session: start fresh and retry once.
        sessions.reset(msg.from.id);
        session = sessions.get(msg.from.id);
        reply = await run(session);
      }
      sessions.markStarted(msg.from.id);
      for (const chunk of chunkMessage(reply)) {
        await bot.sendMessage(msg.chat.id, chunk);
      }
    } catch (err) {
      await bot.sendMessage(msg.chat.id, `Error: ${err.message}`).catch(() => {});
    }
  });
});

bot.on('polling_error', (err) => console.error('polling_error:', err.message));

console.log('Telegram bot is running (polling)...');
