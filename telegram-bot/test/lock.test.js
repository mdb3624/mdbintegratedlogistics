const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { acquireLock } = require('../src/lock');

function tmpLock() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lock-')), 'bot.lock');
}

function deadPid() {
  const r = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))']);
  return Number(r.stdout.toString());
}

test('acquires a free lock and records our pid', () => {
  const file = tmpLock();
  const lock = acquireLock(file);
  assert.equal(Number(fs.readFileSync(file, 'utf8').trim()), process.pid);
  lock.release();
});

test('refuses a second acquire while the holder is alive, naming its pid', () => {
  const file = tmpLock();
  const lock = acquireLock(file);
  assert.throws(() => acquireLock(file), new RegExp(`already running.*${process.pid}`, 's'));
  lock.release();
});

test('takes over a stale lock whose pid is dead', () => {
  const file = tmpLock();
  fs.writeFileSync(file, String(deadPid()));
  const lock = acquireLock(file);
  assert.equal(Number(fs.readFileSync(file, 'utf8').trim()), process.pid);
  lock.release();
});

test('treats a corrupt lock file as stale', () => {
  const file = tmpLock();
  fs.writeFileSync(file, 'not-a-pid');
  const lock = acquireLock(file);
  lock.release();
  assert.equal(fs.existsSync(file), false);
});

test('release removes the lock and is idempotent', () => {
  const file = tmpLock();
  const lock = acquireLock(file);
  lock.release();
  assert.equal(fs.existsSync(file), false);
  assert.doesNotThrow(() => lock.release());
  assert.doesNotThrow(() => acquireLock(file).release());
});

test('release does not delete a lock now owned by another process', () => {
  const file = tmpLock();
  const lock = acquireLock(file);
  fs.writeFileSync(file, String(process.ppid));
  lock.release();
  assert.equal(fs.existsSync(file), true);
});
