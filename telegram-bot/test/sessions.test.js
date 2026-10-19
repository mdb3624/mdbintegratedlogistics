const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSessionStore, createKeyedQueue } = require('../src/sessions');

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sess-')), 'sessions.json');
}

test('creates a session once and reuses it', () => {
  const store = createSessionStore(tmpFile());
  const a = store.get(1);
  assert.equal(a.resume, false);
  assert.equal(store.get(1).id, a.id);
  store.markStarted(1);
  assert.equal(store.get(1).resume, true);
});

test('persists across store instances', () => {
  const file = tmpFile();
  const a = createSessionStore(file);
  const { id } = a.get(1);
  a.markStarted(1);
  const b = createSessionStore(file).get(1);
  assert.deepEqual(b, { id, resume: true });
});

test('reset yields a new session id', () => {
  const store = createSessionStore(tmpFile());
  const { id } = store.get(1);
  store.reset(1);
  assert.notEqual(store.get(1).id, id);
});

test('queue runs tasks for the same key in order', async () => {
  const enqueue = createKeyedQueue();
  const order = [];
  const slow = enqueue('k', async () => {
    await new Promise((r) => setTimeout(r, 50));
    order.push(1);
  });
  const fast = enqueue('k', async () => order.push(2));
  await Promise.all([slow, fast]);
  assert.deepEqual(order, [1, 2]);
});
