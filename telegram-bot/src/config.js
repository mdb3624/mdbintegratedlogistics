function loadConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const allowedUserIds = env.ALLOWED_USER_IDS;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
  }
  if (!allowedUserIds) {
    throw new Error('ALLOWED_USER_IDS is not set. Copy .env.example to .env and fill it in.');
  }

  const timeoutMs = env.CLAUDE_TIMEOUT_MS ? Number(env.CLAUDE_TIMEOUT_MS) : 300000;

  return { token, allowedUserIds, timeoutMs };
}

module.exports = { loadConfig };
