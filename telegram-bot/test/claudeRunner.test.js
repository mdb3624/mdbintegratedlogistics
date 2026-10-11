const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { runClaude } = require('../src/claudeRunner');

const fakeClaude = path.join(__dirname, 'fixtures', 'fake-claude.js');
const fakeClaudeSlow = path.join(__dirname, 'fixtures', 'fake-claude-slow.js');

test('resolves with stdout from a successful invocation', async () => {
  const result = await runClaude('hello', {
    command: process.execPath,
    extraArgs: [fakeClaude],
  });
  assert.equal(result, 'echo:hello');
});

test('rejects with stderr content when the process exits non-zero', async () => {
  await assert.rejects(
    runClaude('ERROR_TEST', { command: process.execPath, extraArgs: [fakeClaude] }),
    /boom/
  );
});

test('rejects with a timeout message when the process does not finish in time', async () => {
  await assert.rejects(
    runClaude('hello', {
      command: process.execPath,
      extraArgs: [fakeClaudeSlow],
      timeoutMs: 200,
    }),
    /did not respond within 200ms/
  );
});

test('passes --session-id for a new session and --resume for an existing one', async () => {
  const base = { command: process.execPath, extraArgs: [fakeClaude] };
  assert.equal(await runClaude('ARGS_TEST', { ...base, sessionId: 'abc' }), '--session-id abc');
  assert.equal(
    await runClaude('ARGS_TEST', { ...base, sessionId: 'abc', resume: true }),
    '--resume abc'
  );
});

test('timeout rejects with code CLAUDE_TIMEOUT so callers can tell it from a stale session', async () => {
  await assert.rejects(
    runClaude('hello', {
      command: process.execPath,
      extraArgs: [fakeClaudeSlow],
      timeoutMs: 200,
    }),
    (err) => err.code === 'CLAUDE_TIMEOUT'
  );
});

test('timeout kills the whole process tree, not just the claude process', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const marker = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tree-')), 'marker');
  const grandchild = path.join(__dirname, 'fixtures', 'fake-claude-grandchild.js');
  await assert.rejects(
    runClaude('hello', {
      command: process.execPath,
      extraArgs: [grandchild, marker],
      timeoutMs: 300,
    }),
    /did not respond/
  );
  await new Promise((r) => setTimeout(r, 2500));
  assert.equal(fs.existsSync(marker), false, 'grandchild survived the timeout');
});
