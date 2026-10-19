const test = require('node:test');
const assert = require('node:assert/strict');
const { createShutdown } = require('../src/shutdown');
const { createKeyedQueue } = require('../src/sessions');

function setup(overrides = {}) {
  const events = [];
  const enqueue = createKeyedQueue();
  const shutdown = createShutdown({
    stopPolling: async () => events.push('stopPolling'),
    idle: () => enqueue.idle(),
    release: () => events.push('release'),
    exit: (code) => events.push(`exit:${code}`),
    log: () => {},
    drainTimeoutMs: 500,
    ...overrides,
  });
  return { shutdown, enqueue, events };
}

test('stops polling, releases the lock, then exits 0', async () => {
  const { shutdown, events } = setup();
  await shutdown('SIGTERM');
  assert.deepEqual(events, ['stopPolling', 'release', 'exit:0']);
});

test('waits for in-flight work before releasing the lock', async () => {
  const { shutdown, enqueue, events } = setup();
  enqueue('u', async () => {
    await new Promise((r) => setTimeout(r, 100));
    events.push('task-done');
  });
  await shutdown('SIGINT');
  assert.deepEqual(events, ['stopPolling', 'task-done', 'release', 'exit:0']);
});

test('gives up draining after the timeout and exits non-zero', async () => {
  const { shutdown, enqueue, events } = setup({ drainTimeoutMs: 50 });
  enqueue('u', () => new Promise(() => {}));
  await shutdown('SIGTERM');
  assert.deepEqual(events, ['stopPolling', 'release', 'exit:1']);
});

test('is idempotent when signalled twice', async () => {
  const { shutdown, events } = setup();
  await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')]);
  assert.equal(events.filter((e) => e.startsWith('exit')).length, 1);
});

test('honours an explicit exit code', async () => {
  const { shutdown, events } = setup();
  await shutdown('polling-conflict', 1);
  assert.deepEqual(events.at(-1), 'exit:1');
});
