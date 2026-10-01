# Telegram Bot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mike message a private Telegram bot and get replies from Claude Code running in this repo. Collaborators (starting with Danny) can use the same bot but are scoped to a single project folder with a restricted tool set.

**Architecture:** A single local Node.js process (`telegram-bot/bot.js`) long-polls the Telegram Bot API. On each incoming message it looks up the sender's numeric Telegram user ID in a per-user registry (`telegram-bot/users.json`). Unknown senders are ignored. Known senders get `claude -p "<message text>"` spawned as a child process with **that user's** working directory and tool restrictions. The stdout is relayed back to the Telegram chat (chunked if it exceeds Telegram's 4096-character message limit). No database, no session state, each message is one stateless round trip.

**Tech Stack:** Node.js (already installed, v26), `node-telegram-bot-api`, `dotenv`, Node's built-in `node:test` runner (no extra test dependency needed).

**Spec:** `docs/superpowers/specs/2026-09-30-telegram-bot-design.md`

## Global Constraints

- Bot token lives only in `telegram-bot/.env`. Per-user access lives in `telegram-bot/users.json`. Both are gitignored; only `.env.example` and `users.example.json` are committed.
- Access is keyed by numeric Telegram user ID, not username.
- Every user entry **must** declare `cwd` and a non-empty `allowedTools` list. There is no "unrestricted by default" path.
- A user's `cwd` must resolve inside the repo root. Anything that escapes it (`..`, absolute path elsewhere) fails startup.
- v1 is stateless: no conversation continuity between messages.
- No public webhook, no cloud hosting. Polling mode, run locally via `npm start`.
- An unknown sender gets **no reply at all** (not an "unauthorized" message).

## Review Focus

- A message with no text (photo, sticker, voice note, etc.) must not crash the bot. It is silently ignored. Covered in Task 5.
- A malformed `users.json` (empty, non-numeric ID, missing `cwd`, missing/empty `allowedTools`, `cwd` escaping the repo root) must fail startup, never silently grant access. Covered in Task 2.
- A user ID not in `users.json` must never resolve to a user, including inherited object keys like `__proto__` or `constructor`. Covered in Task 2.
- A reply exactly at, or one character over, the 4096-char Telegram limit must chunk correctly at the boundary (off-by-one risk). Covered in Task 3.
- A hung `claude` child process must not block the bot forever. It needs a timeout and a user-facing error. Covered in Task 4.
- A missing `TELEGRAM_BOT_TOKEN` at startup must fail fast with a clear message. Covered in Task 1.
- Scoping caveat: a working directory is not a sandbox. The real boundary is the tool allowlist. `Bash` must not be in a collaborator's `allowedTools`. Claude Code also loads parent `CLAUDE.md` files, so Danny's runs will see the AIOS `CLAUDE.md`; keep secrets out of it. Documented in Task 5's README.

---

### Task 1: Project scaffold + config loader

**Files:**
- Create: `telegram-bot/package.json`
- Create: `telegram-bot/.env.example`
- Create: `telegram-bot/src/config.js`
- Test: `telegram-bot/test/config.test.js`

**Interfaces:**
- Produces: `loadConfig(env = process.env)` → `{ token: string, usersFile: string }`. Throws `Error` if `TELEGRAM_BOT_TOKEN` is missing/empty. `usersFile` defaults to `users.json`.

- [ ] **Step 1: Create the package scaffold**

Create `telegram-bot/package.json`:

```json
{
  "name": "aios-telegram-bot",
  "version": "1.0.0",
  "private": true,
  "description": "Telegram bridge to this AIOS's local Claude Code CLI",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "node-telegram-bot-api": "^0.66.0"
  }
}
```

Create `telegram-bot/.env.example`:

```
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
# Optional. Path to the per-user access file, relative to telegram-bot/.
# USERS_FILE=users.json
```

Add these lines to the repo root `.gitignore` if not already covered:

```
telegram-bot/.env
telegram-bot/users.json
```

- [ ] **Step 2: Write the failing test for config loading**

Create `telegram-bot/test/config.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');

test('loadConfig returns token and default usersFile', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123' });
  assert.equal(config.token, 'abc123');
  assert.equal(config.usersFile, 'users.json');
});

test('loadConfig honors USERS_FILE override', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', USERS_FILE: 'other.json' });
  assert.equal(config.usersFile, 'other.json');
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({}), /TELEGRAM_BOT_TOKEN/);
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is an empty string', () => {
  assert.throws(() => loadConfig({ TELEGRAM_BOT_TOKEN: '' }), /TELEGRAM_BOT_TOKEN/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from `telegram-bot/`): `npm install && npm test`
Expected: FAIL, `Cannot find module '../src/config'`

- [ ] **Step 4: Write the minimal implementation**

Create `telegram-bot/src/config.js`:

```js
function loadConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
  }
  return { token, usersFile: env.USERS_FILE || 'users.json' };
}

module.exports = { loadConfig };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add telegram-bot/package.json telegram-bot/.env.example telegram-bot/src/config.js telegram-bot/test/config.test.js .gitignore
git commit -m "telegram-bot: scaffold project and add config loader"
```

---

### Task 2: Per-user registry and tool scoping

**Files:**
- Create: `telegram-bot/src/users.js`
- Create: `telegram-bot/users.example.json`
- Test: `telegram-bot/test/users.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces:
  - `parseUsers(raw: object, repoRoot: string)` → `Map<string, User>` where `User = { name: string, cwd: string (absolute), allowedTools: string[], disallowedTools: string[] }`. Throws on any invalid entry.
  - `loadUsers(filePath: string, repoRoot: string)` → `Map<string, User>`. Reads and parses the JSON file, then calls `parseUsers` and verifies each `cwd` exists on disk.
  - `findUser(userId: number|string, users: Map)` → `User | null`.
  - `toolArgs(user: User)` → `string[]` of CLI flags (`--allowedTools`, `--disallowedTools`).

- [ ] **Step 1: Write the failing tests**

Create `telegram-bot/test/users.test.js`:

```js
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
      allowedTools: ['Read', 'Edit'],
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
    '--allowedTools', 'Read,Edit',
    '--disallowedTools', 'Bash',
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '../src/users'`

- [ ] **Step 3: Write the minimal implementation**

Create `telegram-bot/src/users.js`:

```js
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
```

Create `telegram-bot/users.example.json`:

```json
{
  "users": {
    "111111111": {
      "name": "Mike",
      "cwd": ".",
      "allowedTools": ["Read", "Glob", "Grep", "Edit", "Write", "Bash"]
    },
    "222222222": {
      "name": "Danny",
      "cwd": "projects/eam",
      "allowedTools": ["Read(./**)", "Edit(./**)"],
      "disallowedTools": ["Bash"]
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (14 tests total)

- [ ] **Step 5: Commit**

```bash
git add telegram-bot/src/users.js telegram-bot/users.example.json telegram-bot/test/users.test.js
git commit -m "telegram-bot: add per-user registry with cwd and tool scoping"
```

---

### Task 3: Message chunking

**Files:**
- Create: `telegram-bot/src/chunkMessage.js`
- Test: `telegram-bot/test/chunkMessage.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks (pure function).
- Produces: `chunkMessage(text: string, maxLength: number = 4096)` → `string[]`.

- [ ] **Step 1: Write the failing tests**

Create `telegram-bot/test/chunkMessage.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkMessage } = require('../src/chunkMessage');

test('returns a single chunk when text is under the limit', () => {
  assert.deepEqual(chunkMessage('hello', 4096), ['hello']);
});

test('returns a single chunk when text is exactly at the limit', () => {
  const text = 'a'.repeat(4096);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 1);
  assert.equal(result[0].length, 4096);
});

test('splits text one character over the limit into two chunks', () => {
  const text = 'a'.repeat(4097);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 2);
  assert.equal(result[0].length, 4096);
  assert.equal(result[1].length, 1);
});

test('splits very long text into multiple full chunks and preserves content', () => {
  const text = 'a'.repeat(10000);
  const result = chunkMessage(text, 4096);
  assert.equal(result.length, 3);
  assert.equal(result.join(''), text);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/chunkMessage'`

- [ ] **Step 3: Write the minimal implementation**

Create `telegram-bot/src/chunkMessage.js`:

```js
function chunkMessage(text, maxLength = 4096) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = remaining.slice(maxLength);
  }
  if (remaining.length > 0) chunks.push(remaining);

  return chunks;
}

module.exports = { chunkMessage };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (18 tests total)

- [ ] **Step 5: Commit**

```bash
git add telegram-bot/src/chunkMessage.js telegram-bot/test/chunkMessage.test.js
git commit -m "telegram-bot: add message chunking for Telegram's 4096-char limit"
```

---

### Task 4: Claude CLI runner

**Files:**
- Create: `telegram-bot/src/claudeRunner.js`
- Create: `telegram-bot/test/fixtures/fake-claude.js`
- Create: `telegram-bot/test/fixtures/fake-claude-slow.js`
- Test: `telegram-bot/test/claudeRunner.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `runClaude(promptText: string, options?: { cwd?: string, command?: string, extraArgs?: string[], timeoutMs?: number })` → `Promise<string>` (resolves with trimmed stdout, rejects with an `Error` on non-zero exit or timeout).

This task uses fixture scripts run through `process.execPath` (Node itself) instead of the real `claude` CLI, so the test suite doesn't depend on Claude Code being installed or making real calls.

- [ ] **Step 1: Create the fixture scripts**

Create `telegram-bot/test/fixtures/fake-claude.js`:

```js
const args = process.argv.slice(2);
const idx = args.indexOf('-p');
const prompt = idx >= 0 ? args[idx + 1] : '';

if (prompt === 'ERROR_TEST') {
  console.error('boom');
  process.exit(1);
}

console.log(`echo:${prompt}`);
```

Create `telegram-bot/test/fixtures/fake-claude-slow.js`:

```js
setTimeout(() => {
  console.log('done');
}, 5000);
```

- [ ] **Step 2: Write the failing tests**

Create `telegram-bot/test/claudeRunner.test.js`:

```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/claudeRunner'`

- [ ] **Step 4: Write the minimal implementation**

Create `telegram-bot/src/claudeRunner.js`:

```js
const { execFile } = require('node:child_process');

function runClaude(promptText, options = {}) {
  const {
    cwd,
    command = 'claude',
    extraArgs = [],
    timeoutMs = 120000,
  } = options;

  return new Promise((resolve, reject) => {
    execFile(
      command,
      [...extraArgs, '-p', promptText],
      { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed && error.signal === 'SIGTERM') {
            reject(new Error(`Claude did not respond within ${timeoutMs}ms`));
            return;
          }
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

module.exports = { runClaude };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (21 tests total)

- [ ] **Step 6: Commit**

```bash
git add telegram-bot/src/claudeRunner.js telegram-bot/test/fixtures telegram-bot/test/claudeRunner.test.js
git commit -m "telegram-bot: add Claude CLI runner with timeout handling"
```

---

### Task 5: Wire up the bot + setup docs

**Files:**
- Create: `telegram-bot/bot.js`
- Create: `telegram-bot/README.md`

**Interfaces:**
- Consumes: `loadConfig` from Task 1, `loadUsers`/`findUser`/`toolArgs` from Task 2, `chunkMessage` from Task 3, `runClaude` from Task 4.
- Produces: the running bot process (no further consumers — this is the entry point).

This task's deliverable is the live bot, so its "test" is the manual verification checklist from the spec rather than an automated test — `node-telegram-bot-api` talks to Telegram's real servers, which isn't something to fake in a unit test.

- [ ] **Step 1: Write bot.js**

Create `telegram-bot/bot.js`:

```js
require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { loadUsers, findUser, toolArgs } = require('./src/users');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');
const users = loadUsers(path.resolve(__dirname, config.usersFile), repoRoot);

const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', async (msg) => {
  const user = msg.from && findUser(msg.from.id, users);
  if (!user) return;
  if (!msg.text) return;

  try {
    const reply = await runClaude(msg.text, {
      cwd: user.cwd,
      extraArgs: toolArgs(user),
    });
    const chunks = chunkMessage(reply);
    for (const chunk of chunks) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

console.log('Telegram bot is running (polling)...');
```

- [ ] **Step 2: Write the setup README**

Create `telegram-bot/README.md`:

```markdown
# AIOS Telegram Bot

Lets you message this AIOS from Telegram and get replies from Claude Code
running in this repo. One bot serves several people; each person is scoped
to their own folder and tool set. See the design spec at
`docs/superpowers/specs/2026-09-30-telegram-bot-design.md` for the full
design and its intentional v1 limitations (single-turn only, one machine,
no auto-restart).

## Setup

1. **Create the bot**: message [@BotFather](https://t.me/BotFather) on
   Telegram, run `/newbot`, and follow the prompts. It gives you a token
   that looks like `123456789:AAExampleTokenTextHere`.
2. **Find your Telegram user ID**: message
   [@userinfobot](https://t.me/userinfobot) — it replies with your numeric
   ID.
3. **Configure**: copy `.env.example` to `.env` and set
   `TELEGRAM_BOT_TOKEN`. Then copy `users.example.json` to `users.json` and
   edit it. Each key is a numeric Telegram user ID. Each entry needs:
   - `cwd`: folder Claude runs in, relative to the repo root. Must be inside
     the repo.
   - `allowedTools`: required, non-empty. Only these tools run.
   - `disallowedTools`: optional deny list.

   To scope Danny to the EAM project only, give him
   `"cwd": "projects/eam"`, no `Bash`, and his own numeric ID as the key.
   Restart the bot after editing `users.json`.
4. **Install and run**:
   ```
   npm install
   npm start
   ```
5. Message your bot on Telegram. Leave the `npm start` terminal open —
   the bot only responds while that process is running.

## Scoping limits (read before adding Danny)

- A working directory is not a sandbox. The tool allowlist is the boundary.
  Never put `Bash` in a collaborator's `allowedTools`: a shell can read
  anywhere on this machine.
- In headless mode Claude cannot prompt for permission, so any tool not in
  `allowedTools` is denied.
- A bare `Read` or `Edit` is **not** limited to the working directory. It
  can read any path on the machine (verified). Scope with a path rule such
  as `Read(./**)` and `Edit(./**)`, which was verified to deny reads outside
  the folder. `Edit(./**)` also covers `Write`.
- `Glob` and `Grep` cannot be path-scoped and can search outside the working
  directory (verified). Leave them off a collaborator's list.
- Claude Code loads parent `CLAUDE.md` files, so Danny's runs will read this
  repo's root `CLAUDE.md` and your global one. Keep secrets out of both.
- Danny's runs use `projects/eam` project memory, separate from yours.

## Manual verification checklist

- [ ] Message the bot from your allowlisted account, ask it something
      about this repo (e.g. "what files are in the context folder?") —
      confirm the reply reflects this repo's actual content.
- [ ] Send a skill-style message (e.g. `/audit`) — confirm it behaves the
      same as running it in an interactive Claude Code session.
- [ ] Message the bot from a second Telegram account that is not in
      `users.json` — confirm you get no reply at all.
- [ ] Message from Danny's account: ask it to list files in `projects/eam`
      (works), then ask it to read `context/about-business.md` and run a
      shell command (both must be refused).
- [ ] Ask a question that produces a long reply — confirm it arrives as
      multiple Telegram messages, none truncated or malformed.
- [ ] Send a non-text message (a sticker or photo) from your allowlisted
      account — confirm the bot does not crash and simply ignores it.
```

- [ ] **Step 3: Run the automated test suite one more time**

Run (from `telegram-bot/`): `npm test`
Expected: PASS (21 tests total) — confirms Task 5's wiring didn't break any prior unit test.

- [ ] **Step 4: Run the manual verification checklist**

Follow the checklist in `telegram-bot/README.md` against a real Telegram
bot and your own Telegram account. Confirm every box checks out
before considering this task done.

- [ ] **Step 5: Commit**

```bash
git add telegram-bot/bot.js telegram-bot/README.md
git commit -m "telegram-bot: wire up bot entry point and add setup docs"
```
