const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');

test('loadConfig returns token and default usersFile', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123' });
  assert.equal(config.token, 'abc123');
  assert.equal(config.usersFile, 'users.json');
});

test('loadConfig honors USERS_FILE override', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', USERS_FILE: 'other.json' });
  assert.equal(config.usersFile, 'other.json');
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({}), /TELEGRAM_BOT_TOKEN/);
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is an empty string', () => {
  assert.throws(() => loadConfig({ TELEGRAM_BOT_TOKEN: '' }), /TELEGRAM_BOT_TOKEN/);
});
