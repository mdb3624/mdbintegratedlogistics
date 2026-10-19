const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');
const { runClaude } = require('../src/claudeRunner');
const { startFakeTelegram, waitFor } = require('./fixtures/fakeTelegram');

const MIKE = 111;
const fakeClaude = path.join(__dirname, 'fixtures', 'fake-claude.js');
const fakeClaudeSlow = path.join(__dirname, 'fixtures', 'fake-claude-slow.js');

async function boot({ claudeScript = fakeClaude, lockFile, sessionsFile, claudeTimeoutMs } = {}) {
  const tg = await startFakeTelegram();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-'));
  const repoRoot = path.join(dir, 'repo');
  fs.mkdirSync(path.join(repoRoot, 'projects', 'eam'), { recursive: true });
  const usersFile = path.join(dir, 'users.json');
  fs.writeFileSync(
    usersFile,
    JSON.stringify({ users: { [MIKE]: { name: 'Mike', cwd: '.', allowedTools: ['Read'] } } })
  );
  const exits = [];
  const logs = [];
  const app = createApp({
    env: { TELEGRAM_BOT_TOKEN: 'TESTTOKEN' },
    repoRoot,
    usersFile,
    sessionsFile: sessionsFile || path.join(dir, 'sessions.json'),
    lockFile: lockFile || path.join(dir, 'bot.lock'),
    baseApiUrl: tg.baseApiUrl,
    runClaude: (text, opts) =>
      runClaude(text, {
        ...opts,
        timeoutMs: claudeTimeoutMs,
        command: process.execPath,
        extraArgs: [claudeScript, ...opts.extraArgs],
      }),
    exit: (code) => exits.push(code),
    log: (...a) => logs.push(a.join(' ')),
    drainTimeoutMs: 3000,
  });
  return { tg, app, exits, logs, dir };
}

async function teardown({ tg, app }) {
  await app.shutdown('test-cleanup');
  await tg.close();
}

test('end to end: a polled message gets claude’s reply via the Telegram API', async () => {
  const ctx = await boot();
  try {
    ctx.tg.pushMessage({ fromId: MIKE, text: 'hello' });
    await waitFor(() => ctx.tg.sent.length > 0, { label: 'reply' });
    assert.deepEqual(ctx.tg.sendTexts(), ['echo:hello']);
  } finally {
    await teardown(ctx);
  }
});

test('end to end: /start is answered with a welcome', async () => {
  const ctx = await boot();
  try {
    ctx.tg.pushMessage({ fromId: MIKE, text: '/start' });
    await waitFor(() => ctx.tg.sent.length > 0, { label: 'welcome' });
    assert.match(ctx.tg.sendTexts()[0], /Welcome, Mike/);
  } finally {
    await teardown(ctx);
  }
});

test('end to end: Telegram "chat not found" does not crash the bot or stop later replies', async () => {
  const ctx = await boot();
  try {
    ctx.tg.failNextSend('Bad Request: chat not found', 400);
    ctx.tg.pushMessage({ fromId: MIKE, text: 'first' });
    await waitFor(() => ctx.logs.some((l) => /chat not found/.test(l)), { label: 'failure log' });
    ctx.tg.pushMessage({ fromId: MIKE, text: 'second' });
    await waitFor(() => ctx.tg.sendTexts().includes('echo:second'), { label: 'second reply' });
    assert.deepEqual(ctx.exits, []);
  } finally {
    await teardown(ctx);
  }
});

test('a second instance on the same lock file refuses to start', async () => {
  const ctx = await boot();
  try {
    assert.throws(
      () =>
        createApp({
          env: { TELEGRAM_BOT_TOKEN: 'TESTTOKEN' },
          repoRoot: path.join(ctx.dir, 'repo'),
          usersFile: path.join(ctx.dir, 'users.json'),
          sessionsFile: path.join(ctx.dir, 'sessions-2.json'),
          lockFile: path.join(ctx.dir, 'bot.lock'),
          baseApiUrl: ctx.tg.baseApiUrl,
          exit: () => {},
          log: () => {},
        }),
      /already running/
    );
  } finally {
    await teardown(ctx);
  }
});

test('shutdown releases the lock so a replacement instance can start', async () => {
  const ctx = await boot();
  const lockFile = path.join(ctx.dir, 'bot.lock');
  assert.equal(fs.existsSync(lockFile), true);
  await teardown(ctx);
  assert.equal(fs.existsSync(lockFile), false);
});

test('a 409 polling conflict (another instance holds the token) shuts down non-zero', async () => {
  const ctx = await boot();
  try {
    ctx.tg.setConflict(true);
    await waitFor(() => ctx.exits.length > 0, { label: 'exit on conflict' });
    assert.equal(ctx.exits[0], 1);
  } finally {
    ctx.tg.setConflict(false);
    await ctx.tg.close();
  }
});

test('graceful shutdown lets an in-flight reply finish before exiting', async () => {
  const slowEcho = path.join(os.tmpdir(), `slow-echo-${process.pid}.js`);
  fs.writeFileSync(
    slowEcho,
    `const a=process.argv.slice(2);const p=a[a.indexOf('--')+1];setTimeout(()=>console.log('late:'+p),400);`
  );
  const ctx = await boot({ claudeScript: slowEcho });
  try {
    ctx.tg.pushMessage({ fromId: MIKE, text: 'work' });
    await new Promise((r) => setTimeout(r, 250)); // let the run start
    await ctx.app.shutdown('SIGTERM');
    assert.deepEqual(ctx.tg.sendTexts(), ['late:work']);
    assert.deepEqual(ctx.exits.slice(-1), [0]);
  } finally {
    await ctx.tg.close();
    fs.rmSync(slowEcho, { force: true });
  }
});

test('a hung claude run replies with a timeout error and keeps the bot alive', async () => {
  const ctx = await boot({ claudeScript: fakeClaudeSlow, claudeTimeoutMs: 300 });
  try {
    ctx.tg.pushMessage({ fromId: MIKE, text: 'hang' });
    await waitFor(() => ctx.tg.sent.length > 0, { label: 'timeout notice' });
    assert.match(ctx.tg.sendTexts()[0], /did not respond within 300ms/);
    assert.deepEqual(ctx.exits, []);
  } finally {
    await teardown(ctx);
  }
});
