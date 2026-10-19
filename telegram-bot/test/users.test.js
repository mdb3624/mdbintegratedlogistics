const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseUsers, findUser, toolArgs } = require('../src/users');

const repoRoot = path.resolve('/repo');

const valid = {
  users: {
    '111': { name: 'Mike', cwd: '.', allowedTools: ['Read', 'Bash'] },
    '222': {
      name: 'Danny',
      cwd: 'projects/eam',
      allowedTools: ['Read(./**)', 'Edit(./**)'],
      disallowedTools: ['Bash'],
    },
  },
};

test('parses valid users and resolves cwd to an absolute path', () => {
  const users = parseUsers(valid, repoRoot);
  assert.equal(users.size, 2);
  assert.equal(users.get('111').cwd, repoRoot);
  assert.equal(users.get('222').cwd, path.join(repoRoot, 'projects', 'eam'));
  assert.deepEqual(users.get('222').disallowedTools, ['Bash']);
  assert.deepEqual(users.get('111').disallowedTools, []);
});

test('findUser returns the user for a known id (number or string)', () => {
  const users = parseUsers(valid, repoRoot);
  assert.equal(findUser(222, users).name, 'Danny');
  assert.equal(findUser('222', users).name, 'Danny');
});

test('findUser returns null for unknown ids and inherited keys', () => {
  const users = parseUsers(valid, repoRoot);
  assert.equal(findUser(999, users), null);
  assert.equal(findUser('__proto__', users), null);
  assert.equal(findUser('constructor', users), null);
  assert.equal(findUser(undefined, users), null);
});

test('rejects an empty users object', () => {
  assert.throws(() => parseUsers({ users: {} }, repoRoot), /at least one user/);
});

test('rejects a missing users key', () => {
  assert.throws(() => parseUsers({}, repoRoot), /users/);
});

test('rejects a non-numeric user id', () => {
  const bad = { users: { '@danny': { name: 'D', cwd: '.', allowedTools: ['Read'] } } };
  assert.throws(() => parseUsers(bad, repoRoot), /numeric/);
});

test('rejects a missing cwd', () => {
  const bad = { users: { '1': { name: 'D', allowedTools: ['Read'] } } };
  assert.throws(() => parseUsers(bad, repoRoot), /cwd/);
});

test('rejects missing or empty allowedTools', () => {
  const none = { users: { '1': { name: 'D', cwd: '.' } } };
  const empty = { users: { '1': { name: 'D', cwd: '.', allowedTools: [] } } };
  assert.throws(() => parseUsers(none, repoRoot), /allowedTools/);
  assert.throws(() => parseUsers(empty, repoRoot), /allowedTools/);
});

test('rejects a cwd that escapes the repo root', () => {
  const up = { users: { '1': { name: 'D', cwd: '../elsewhere', allowedTools: ['Read'] } } };
  const abs = { users: { '1': { name: 'D', cwd: path.resolve('/other'), allowedTools: ['Read'] } } };
  assert.throws(() => parseUsers(up, repoRoot), /inside the repo/);
  assert.throws(() => parseUsers(abs, repoRoot), /inside the repo/);
});

test('toolArgs builds comma-separated flags, omitting empty disallowedTools', () => {
  const users = parseUsers(valid, repoRoot);
  assert.deepEqual(toolArgs(users.get('111')), ['--allowedTools', 'Read,Bash']);
  assert.deepEqual(toolArgs(users.get('222')), [
    '--allowedTools', 'Read(./**),Edit(./**)',
    '--disallowedTools', 'Bash',
  ]);
});

const scoped = (allowedTools) => ({
  users: { '222': { name: 'Danny', cwd: 'projects/eam', allowedTools } },
});

test('rejects Bash for a user scoped below the repo root (a shell can read anywhere)', () => {
  assert.throws(() => parseUsers(scoped(['Read(./**)', 'Bash']), repoRoot), /Bash/);
  assert.throws(() => parseUsers(scoped(['Bash(ls:*)']), repoRoot), /Bash/);
});

test('rejects unscoped Read, Edit, Write, Glob and Grep for a user scoped below the repo root', () => {
  for (const tool of ['Read', 'Edit', 'Write', 'Glob', 'Grep']) {
    assert.throws(
      () => parseUsers(scoped([tool]), repoRoot),
      new RegExp(tool)
    );
  }
});

test('accepts path-scoped Read and Edit for a scoped user', () => {
  assert.doesNotThrow(() => parseUsers(scoped(['Read(./**)', 'Edit(./**)']), repoRoot));
});

test('does not apply the scoping rule to a user whose cwd is the repo root', () => {
  const rootUser = { users: { '111': { cwd: '.', allowedTools: ['Read', 'Bash', 'Glob'] } } };
  assert.doesNotThrow(() => parseUsers(rootUser, repoRoot));
});
