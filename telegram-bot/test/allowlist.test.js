const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedUser } = require('../src/allowlist');

test('allows a user id present in the list', () => {
  assert.equal(isAllowedUser(123, '123,456'), true);
});

test('rejects a user id not present in the list', () => {
  assert.equal(isAllowedUser(999, '123,456'), false);
});

test('handles extra whitespace around ids', () => {
  assert.equal(isAllowedUser(456, ' 123 , 456 '), true);
});

test('handles a trailing comma without allowing everyone', () => {
  assert.equal(isAllowedUser(999, '123,456,'), false);
  assert.equal(isAllowedUser(123, '123,456,'), true);
});

test('rejects everyone when the allowlist string is empty', () => {
  assert.equal(isAllowedUser(123, ''), false);
});

test('compares numeric Telegram ids against string list entries', () => {
  assert.equal(isAllowedUser(123, '123'), true);
});
