require('dotenv').config();
const path = require('node:path');
const { createApp } = require('./src/app');

let app;
try {
  app = createApp({
    repoRoot: path.resolve(__dirname, '..'),
    sessionsFile: path.resolve(__dirname, 'sessions.json'),
    lockFile: path.resolve(__dirname, 'bot.lock'),
    usersFile: path.resolve(__dirname, process.env.USERS_FILE || 'users.json'),
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.on(signal, () => app.shutdown(signal));
}
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  app.shutdown('uncaughtException', 1);
});
