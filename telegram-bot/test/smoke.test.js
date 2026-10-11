const test = require('node:test');
const assert = require('node:assert/strict');
const { runSmoke } = require('../src/smoke');
const { startFakeTelegram } = require('./fixtures/fakeTelegram');

const CHAT = 4242;

test('skips with a clear message when TELEGRAM_TEST_TOKEN is absent', async () => {
  const result = await runSmoke({ env: {} });
  assert.equal(result.status, 'skipped');
  assert.match(result.message, /TELEGRAM_TEST_TOKEN/);
});

test('fails clearly when the token is set but no chat id is given', async () => {
  const result = await runSmoke({ env: { TELEGRAM_TEST_TOKEN: 't' } });
  assert.equal(result.status, 'failed');
  assert.match(result.message, /TELEGRAM_TEST_CHAT_ID/);
});

test('sends one message and receives one reply from the chat', async () => {
  const tg = await startFakeTelegram();
  try {
    const run = runSmoke({
      env: { TELEGRAM_TEST_TOKEN: 't', TELEGRAM_TEST_CHAT_ID: String(CHAT), TELEGRAM_SMOKE_WAIT_SECONDS: '5' },
      baseApiUrl: tg.baseApiUrl,
    });
    const deadline = Date.now() + 3000;
    while (tg.sent.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
    assert.equal(tg.sent.length, 1);
    assert.equal(tg.sent[0].chat_id, CHAT);
    tg.pushMessage({ fromId: CHAT, chatId: CHAT, text: 'pong' });
    const result = await run;
    assert.equal(result.status, 'passed');
    assert.match(result.message, /fake_bot/);
  } finally {
    await tg.close();
  }
});

test('fails when no reply arrives within the wait window', async () => {
  const tg = await startFakeTelegram();
  try {
    const result = await runSmoke({
      env: { TELEGRAM_TEST_TOKEN: 't', TELEGRAM_TEST_CHAT_ID: String(CHAT), TELEGRAM_SMOKE_WAIT_SECONDS: '1' },
      baseApiUrl: tg.baseApiUrl,
    });
    assert.equal(result.status, 'failed');
    assert.match(result.message, /no message received/i);
  } finally {
    await tg.close();
  }
});

test('send-only mode passes after a successful send without waiting for a reply', async () => {
  const tg = await startFakeTelegram();
  try {
    const result = await runSmoke({
      env: { TELEGRAM_TEST_TOKEN: 't', TELEGRAM_TEST_CHAT_ID: String(CHAT) },
      baseApiUrl: tg.baseApiUrl,
      sendOnly: true,
    });
    assert.equal(result.status, 'passed');
    assert.equal(tg.sent.length, 1);
  } finally {
    await tg.close();
  }
});

test('reports Telegram API errors such as chat not found', async () => {
  const tg = await startFakeTelegram();
  try {
    tg.failNextSend('Bad Request: chat not found', 400);
    const result = await runSmoke({
      env: { TELEGRAM_TEST_TOKEN: 't', TELEGRAM_TEST_CHAT_ID: String(CHAT) },
      baseApiUrl: tg.baseApiUrl,
      sendOnly: true,
    });
    assert.equal(result.status, 'failed');
    assert.match(result.message, /chat not found/);
  } finally {
    await tg.close();
  }
});
