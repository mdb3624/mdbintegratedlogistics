const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./config');
const { loadUsers } = require('./users');
const { runClaude: defaultRunClaude } = require('./claudeRunner');
const { createSessionStore, createKeyedQueue } = require('./sessions');
const { createHandler } = require('./handler');
const { acquireLock } = require('./lock');
const { createShutdown } = require('./shutdown');

// Telegram errors that mean this process can never poll successfully.
function isFatalPollingError(err) {
  const code = err && err.response && err.response.body && err.response.body.error_code;
  return code === 409 || code === 401;
}

function createApp({
  env = process.env,
  repoRoot,
  usersFile,
  sessionsFile,
  lockFile,
  baseApiUrl,
  runClaude = defaultRunClaude,
  exit = process.exit,
  log = console.log,
  drainTimeoutMs,
}) {
  const config = loadConfig(env);
  const users = loadUsers(path.resolve(usersFile || config.usersFile), repoRoot);

  // Acquire the lock only after config is known good, and before polling starts.
  const lock = acquireLock(lockFile);
  let bot;
  try {
    const sessions = createSessionStore(sessionsFile);
    const enqueue = createKeyedQueue();
    const options = { polling: true };
    if (baseApiUrl) options.baseApiUrl = baseApiUrl;
    bot = new TelegramBot(config.token, options);

    const shutdown = createShutdown({
      stopPolling: () => bot.stopPolling(),
      idle: () => enqueue.idle(),
      release: () => lock.release(),
      exit,
      log,
      drainTimeoutMs,
    });

    const handleMessage = createHandler({ bot, users, sessions, enqueue, runClaude, log });
    bot.on('message', handleMessage);
    bot.on('polling_error', (err) => {
      log(`polling_error: ${err.message}`);
      if (isFatalPollingError(err)) shutdown(`fatal polling error: ${err.message}`, 1);
    });

    log('Telegram bot is running (polling)...');
    return { bot, shutdown };
  } catch (err) {
    lock.release();
    throw err;
  }
}

module.exports = { createApp };
