const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { runClaude } = require('../src/claudeRunner');

const fakeClaude = path.join(__dirname, 'fixtures', 'fake-claude.js');
const fakeClaudeSlow = path.join(__dirname, 'fixtures', 'fake-claude-slow.js');
const fakeClaudeArgv = path.join(__dirname, 'fixtures', 'fake-claude-argv.js');
const fakeClaudeStdin = path.join(__dirname, 'fixtures', 'fake-claude-stdin.js');

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

test('inserts a -- separator before the prompt so a leading dash is not parsed as a flag', async () => {
  const result = await runClaude('--version', {
    command: process.execPath,
    extraArgs: [fakeClaudeArgv],
  });
  assert.deepEqual(JSON.parse(result), ['-p', '--', '--version']);
});

test("closes the child's stdin so it does not wait for input", async () => {
  const result = await runClaude('hello', {
    command: process.execPath,
    extraArgs: [fakeClaudeStdin],
    timeoutMs: 2000,
  });
  assert.equal(result, 'stdin-closed');
});
