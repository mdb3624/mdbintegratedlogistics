const fs = require('node:fs');
const path = require('node:path');

function parseUsers(raw, repoRoot) {
  const entries = raw && raw.users && typeof raw.users === 'object' ? Object.entries(raw.users) : null;
  if (!entries) throw new Error('users file must contain a "users" object.');
  if (entries.length === 0) throw new Error('users file must define at least one user.');

  const users = new Map();
  for (const [id, entry] of entries) {
    if (!/^\d+$/.test(id)) {
      throw new Error(`User id "${id}" must be a numeric Telegram user id.`);
    }
    if (!entry || typeof entry.cwd !== 'string' || entry.cwd.length === 0) {
      throw new Error(`User ${id} is missing "cwd".`);
    }
    if (!Array.isArray(entry.allowedTools) || entry.allowedTools.length === 0) {
      throw new Error(`User ${id} must define a non-empty "allowedTools" list.`);
    }

    const cwd = path.resolve(repoRoot, entry.cwd);
    const rel = path.relative(repoRoot, cwd);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`User ${id} cwd must be inside the repo root.`);
    }

    users.set(id, {
      name: entry.name || id,
      cwd,
      allowedTools: entry.allowedTools,
      disallowedTools: entry.disallowedTools || [],
    });
  }
  return users;
}

function loadUsers(filePath, repoRoot) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const users = parseUsers(raw, repoRoot);
  for (const [id, user] of users) {
    if (!fs.existsSync(user.cwd)) {
      throw new Error(`User ${id} cwd does not exist: ${user.cwd}`);
    }
  }
  return users;
}

function findUser(userId, users) {
  return users.get(String(userId)) || null;
}

function toolArgs(user) {
  const args = ['--allowedTools', user.allowedTools.join(',')];
  if (user.disallowedTools.length > 0) {
    args.push('--disallowedTools', user.disallowedTools.join(','));
  }
  return args;
}

module.exports = { parseUsers, loadUsers, findUser, toolArgs };
