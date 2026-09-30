function loadConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const allowedUserIds = env.ALLOWED_USER_IDS;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
  }
  if (!allowedUserIds) {
    throw new Error('ALLOWED_USER_IDS is not set. Copy .env.example to .env and fill it in.');
  }

  return { token, allowedUserIds };
}

module.exports = { loadConfig };
