# Telegram Bot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mike message a private Telegram bot and get replies from Claude Code running in this repo, with an allowlist so it can later be opened to Danny.

**Architecture:** A single local Node.js process (`telegram-bot/bot.js`) long-polls the Telegram Bot API. On each incoming message it checks the sender's numeric Telegram user ID against an allowlist, then spawns `claude -p "<message text>"` as a child process with this repo's root as its working directory, and relays the stdout back to the Telegram chat (chunked if it exceeds Telegram's 4096-character message limit). No database, no session state — each message is one stateless round trip.

**Tech Stack:** Node.js (already installed, v26), `node-telegram-bot-api`, `dotenv`, Node's built-in `node:test` runner (no extra test dependency needed).

**Spec:** `docs/superpowers/specs/2026-09-30-telegram-bot-design.md`

## Global Constraints

- Bot token and allowlist live only in `telegram-bot/.env` — never commit it (repo's root `.gitignore` already ignores `.env`).
- Allowlist enforced by numeric Telegram user ID, not username.
- v1 is stateless: no conversation continuity between messages.
- No public webhook, no cloud hosting — polling mode, run locally via `npm start`.
- A non-allowlisted sender gets **no reply at all** (not an "unauthorized" message).

## Review Focus

- A message with no text (photo, sticker, voice note, etc.) must not crash the bot — it should be silently ignored, same as spec's "ignore" behavior for unauthorized senders. Covered in Task 5.
- A malformed `ALLOWED_USER_IDS` value (extra whitespace, trailing comma, or empty string) must not accidentally allow everyone through. Covered in Task 2.
- A reply exactly at, or one character over, the 4096-char Telegram limit must chunk correctly at the boundary (off-by-one risk). Covered in Task 3.
- A hung `claude` child process must not block the bot forever — it needs a timeout and a user-facing error, not a silent freeze. Covered in Task 4.
- A missing `TELEGRAM_BOT_TOKEN` or `ALLOWED_USER_IDS` at startup must fail fast with a clear message, not start the bot in a half-broken state. Covered in Task 1.

---

### Task 1: Project scaffold + config loader

**Files:**
- Create: `telegram-bot/package.json`
- Create: `telegram-bot/.env.example`
- Create: `telegram-bot/src/config.js`
- Test: `telegram-bot/test/config.test.js`

**Interfaces:**
- Produces: `loadConfig(env = process.env)` → `{ token: string, allowedUserIds: string }`, throws `Error` if `TELEGRAM_BOT_TOKEN` or `ALLOWED_USER_IDS` is missing/empty.

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
ALLOWED_USER_IDS=123456789
```

- [ ] **Step 2: Write the failing test for config loading**

Create `telegram-bot/test/config.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');

test('loadConfig returns token and allowedUserIds when both set', () => {
  const config = loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', ALLOWED_USER_IDS: '111,222' });
  assert.equal(config.token, 'abc123');
  assert.equal(config.allowedUserIds, '111,222');
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({ ALLOWED_USER_IDS: '111' }), /TELEGRAM_BOT_TOKEN/);
});

test('loadConfig throws when ALLOWED_USER_IDS is missing', () => {
  assert.throws(() => loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123' }), /ALLOWED_USER_IDS/);
});

test('loadConfig throws when ALLOWED_USER_IDS is an empty string', () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'abc123', ALLOWED_USER_IDS: '' }),
    /ALLOWED_USER_IDS/
  );
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from `telegram-bot/`): `npm install && npm test`
Expected: FAIL — `Cannot find module '../src/config'`

- [ ] **Step 4: Write the minimal implementation**

Create `telegram-bot/src/config.js`:

```js
function loadConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const allowedUserIds = env.ALLOWED_USER_IDS;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.');
  }
  if (!allowedUserIds) {
    throw new Error('ALLOWED_USER_IDS is not set. Copy .env.example to .env and fill it in.');
  }

  return { token, allowedUserIds };
}

module.exports = { loadConfig };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add telegram-bot/package.json telegram-bot/.env.example telegram-bot/src/config.js telegram-bot/test/config.test.js
git commit -m "telegram-bot: scaffold project and add config loader"
```

---

### Task 2: Allowlist check

**Files:**
- Create: `telegram-bot/src/allowlist.js`
- Test: `telegram-bot/test/allowlist.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks (pure function).
- Produces: `isAllowedUser(userId: number|string, allowedUserIdsEnv: string)` → `boolean`.

- [ ] **Step 1: Write the failing tests**

Create `telegram-bot/test/allowlist.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedUser } = require('../src/allowlist');

test('allows a user id present in the list', () => {
  assert.equal(isAllowedUser(123, '123,456'), true);
});

test('rejects a user id not present in the list', () => {
  assert.equal(isAllowedUser(999, '123,456'), false);
});

test('handles extra whitespace around ids', () => {
  assert.equal(isAllowedUser(456, ' 123 , 456 '), true);
});

test('handles a trailing comma without allowing everyone', () => {
  assert.equal(isAllowedUser(999, '123,456,'), false);
  assert.equal(isAllowedUser(123, '123,456,'), true);
});

test('rejects everyone when the allowlist string is empty', () => {
  assert.equal(isAllowedUser(123, ''), false);
});

test('compares numeric Telegram ids against string list entries', () => {
  assert.equal(isAllowedUser(123, '123'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/allowlist'`

- [ ] **Step 3: Write the minimal implementation**

Create `telegram-bot/src/allowlist.js`:

```js
function isAllowedUser(userId, allowedUserIdsEnv) {
  if (!allowedUserIdsEnv) return false;

  const allowed = allowedUserIdsEnv
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return allowed.includes(String(userId));
}

module.exports = { isAllowedUser };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (10 tests total)

- [ ] **Step 5: Commit**

```bash
git add telegram-bot/src/allowlist.js telegram-bot/test/allowlist.test.js
git commit -m "telegram-bot: add allowlist check"
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
Expected: PASS (14 tests total)

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
Expected: PASS (17 tests total)

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
- Consumes: `loadConfig` from Task 1, `isAllowedUser` from Task 2, `chunkMessage` from Task 3, `runClaude` from Task 4.
- Produces: the running bot process (no further consumers — this is the entry point).

This task's deliverable is the live bot, so its "test" is the manual verification checklist from the spec rather than an automated test — `node-telegram-bot-api` talks to Telegram's real servers, which isn't something to fake in a unit test.

- [ ] **Step 1: Write bot.js**

Create `telegram-bot/bot.js`:

```js
require('dotenv').config();
const path = require('node:path');
const TelegramBot = require('node-telegram-bot-api');
const { loadConfig } = require('./src/config');
const { isAllowedUser } = require('./src/allowlist');
const { chunkMessage } = require('./src/chunkMessage');
const { runClaude } = require('./src/claudeRunner');

const config = loadConfig();
const repoRoot = path.resolve(__dirname, '..');

const bot = new TelegramBot(config.token, { polling: true });

bot.on('message', async (msg) => {
  if (!isAllowedUser(msg.from.id, config.allowedUserIds)) return;
  if (!msg.text) return;

  try {
    const reply = await runClaude(msg.text, { cwd: repoRoot });
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
running in this repo. See the design spec at
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
3. **Configure**: copy `.env.example` to `.env` and fill in:
   ```
   TELEGRAM_BOT_TOKEN=<token from BotFather>
   ALLOWED_USER_IDS=<your numeric id>
   ```
   To add another person later (e.g. Danny), append their ID:
   `ALLOWED_USER_IDS=111111111,222222222`.
4. **Install and run**:
   ```
   npm install
   npm start
   ```
5. Message your bot on Telegram. Leave the `npm start` terminal open —
   the bot only responds while that process is running.

## Manual verification checklist

- [ ] Message the bot from your allowlisted account, ask it something
      about this repo (e.g. "what files are in the context folder?") —
      confirm the reply reflects this repo's actual content.
- [ ] Send a skill-style message (e.g. `/audit`) — confirm it behaves the
      same as running it in an interactive Claude Code session.
- [ ] Message the bot from a second, non-allowlisted Telegram account —
      confirm you get no reply at all.
- [ ] Ask a question that produces a long reply — confirm it arrives as
      multiple Telegram messages, none truncated or malformed.
- [ ] Send a non-text message (a sticker or photo) from your allowlisted
      account — confirm the bot does not crash and simply ignores it.
```

- [ ] **Step 3: Run the automated test suite one more time**

Run (from `telegram-bot/`): `npm test`
Expected: PASS (17 tests total) — confirms Task 5's wiring didn't break any prior unit test.

- [ ] **Step 4: Run the manual verification checklist**

Follow the checklist in `telegram-bot/README.md` against a real Telegram
bot and your own Telegram account. Confirm all four boxes check out
before considering this task done.

- [ ] **Step 5: Commit**

```bash
git add telegram-bot/bot.js telegram-bot/README.md
git commit -m "telegram-bot: wire up bot entry point and add setup docs"
```
