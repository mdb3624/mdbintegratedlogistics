const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');

test('loadConfig returns token and allowedUserIds when both set', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', ALLOWED_USER_IDS: '111,222' });
  assert.equal(config.token, 'abc123');
  assert.equal(config.allowedUserIds, '111,222');
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({ ALLOWED_USER_IDS: '111' }), /TELEGRAM_BOT_TOKEN/);
});

test('loadConfig throws when ALLOWED_USER_IDS is missing', () => {
  assert.throws(() => loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123' }), /ALLOWED_USER_IDS/);
});

test('loadConfig throws when ALLOWED_USER_IDS is an empty string', () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', ALLOWED_USER_IDS: '' }),
    /ALLOWED_USER_IDS/
  );
});

test('loadConfig defaults timeoutMs to 300000 when CLAUDE_TIMEOUT_MS is not set', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', ALLOWED_USER_IDS: '111' });
  assert.equal(config.timeoutMs, 300000);
});

test('loadConfig uses CLAUDE_TIMEOUT_MS when set', () => {
  const config = loadConfig({
    TELEGRAM_BOT_TOKEN: 'abc123',
    ALLOWED_USER_IDS: '111',
    CLAUDE_TIMEOUT_MS: '60000',
  });
  assert.equal(config.timeoutMs, 60000);
});
