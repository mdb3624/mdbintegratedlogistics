const test = require('node:test');
const assert = require('node:assert/strict');
const { createMessageHandler } = require('../src/handleMessage');
const { chunkMessage } = require('../src/chunkMessage');
const { isAllowedUser } = require('../src/allowlist');

function makeHandler({ runClaude, sendMessage, allowedUserIds = '1' }) {
  return createMessageHandler({
    config: { allowedUserIds },
    cwd: '/tmp',
    runClaude,
    chunkMessage,
    isAllowedUser,
    sendMessage,
  });
}

test('sends a truncated error message instead of the full oversized error', async () => {
  const longError = 'x'.repeat(5000);
  const sent = [];
  const handleMessage = makeHandler({
    runClaude: async () => {
      throw new Error(longError);
    },
    sendMessage: async (chatId, text) => {
      sent.push(text);
    },
  });

  await handleMessage({ from: { id: 1 }, chat: { id: 1 }, text: 'hi' });

  assert.equal(sent.length, 1);
  assert.ok(sent[0].length <= 4096, `expected <= 4096 chars, got ${sent[0].length}`);
  assert.ok(sent[0].startsWith('Error: '));
});

test('does not throw when sending the error message itself fails', async () => {
  const handleMessage = makeHandler({
    runClaude: async () => {
      throw new Error('boom');
    },
    sendMessage: async () => {
      throw new Error('network down');
    },
  });

  await assert.doesNotReject(handleMessage({ from: { id: 1 }, chat: { id: 1 }, text: 'hi' }));
});

test('forwards a normal reply to sendMessage unchanged', async () => {
  const sent = [];
  const handleMessage = makeHandler({
    runClaude: async () => 'a normal reply',
    sendMessage: async (chatId, text) => {
      sent.push(text);
    },
  });

  await handleMessage({ from: { id: 1 }, chat: { id: 1 }, text: 'hi' });

  assert.deepEqual(sent, ['a normal reply']);
});

test('ignores a message from a non-allowlisted user', async () => {
  const sent = [];
  const handleMessage = makeHandler({
    allowedUserIds: '1',
    runClaude: async () => 'should not run',
    sendMessage: async (chatId, text) => {
      sent.push(text);
    },
  });

  await handleMessage({ from: { id: 999 }, chat: { id: 999 }, text: 'hi' });

  assert.deepEqual(sent, []);
});

test('ignores a message with no text', async () => {
  const sent = [];
  const handleMessage = makeHandler({
    runClaude: async () => 'should not run',
    sendMessage: async (chatId, text) => {
      sent.push(text);
    },
  });

  await handleMessage({ from: { id: 1 }, chat: { id: 1 } });

  assert.deepEqual(sent, []);
});
