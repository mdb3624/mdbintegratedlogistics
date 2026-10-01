function loadConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
  }
  return { token, usersFile: env.USERS_FILE || 'users.json' };
}

module.exports = { loadConfig };
