const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHandler } = require('../src/handler');
const { createSessionStore, createKeyedQueue } = require('../src/sessions');
const { parseUsers } = require('../src/users');

const repoRoot = path.resolve(__dirname, '..', '..');
const MIKE = 111;
const DANNY = 222;

function makeUsers() {
  return parseUsers(
    {
      users: {
        [MIKE]: { name: 'Mike', cwd: '.', allowedTools: ['Read', 'Bash'] },
        [DANNY]: {
          name: 'Danny',
          cwd: 'projects/eam',
          allowedTools: ['Read(./**)', 'Edit(./**)'],
          disallowedTools: ['Bash'],
        },
      },
    },
    repoRoot
  );
}

function tmpSessionsFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'handler-')), 'sessions.json');
}

function setup({ runClaude, sessionsFile = tmpSessionsFile(), sendMessage } = {}) {
  const sent = [];
  const logs = [];
  const bot = {
    sendMessage:
      sendMessage ||
      (async (chatId, text) => {
        sent.push({ chatId, text });
      }),
  };
  const calls = [];
  const run = runClaude || (async (text) => `reply:${text}`);
  const sessions = createSessionStore(sessionsFile);
  const handler = createHandler({
    bot,
    users: makeUsers(),
    sessions,
    enqueue: createKeyedQueue(),
    runClaude: async (text, opts) => {
      calls.push({ text, ...opts });
      return run(text, opts);
    },
    log: (...a) => logs.push(a.join(' ')),
  });
  return { handler, sent, calls, logs, sessions, sessionsFile };
}

const msg = (id, text, chatId = id) => ({ from: { id }, chat: { id: chatId }, text });

test('/start greets an allowlisted user by name without invoking claude', async () => {
  const { handler, sent, calls } = setup();
  await handler(msg(MIKE, '/start'));
  assert.equal(calls.length, 0);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Welcome, Mike/);
});

test('/start from an unknown user gets no reply', async () => {
  const { handler, sent, calls } = setup();
  await handler(msg(999, '/start'));
  assert.equal(sent.length, 0);
  assert.equal(calls.length, 0);
});

test('unknown users and non-text messages are ignored', async () => {
  const { handler, sent, calls } = setup();
  await handler(msg(999, 'hello'));
  await handler({ from: { id: MIKE }, chat: { id: MIKE } });
  assert.equal(sent.length, 0);
  assert.equal(calls.length, 0);
});

test('routes each user to their own cwd and tool scope', async () => {
  const { handler, calls } = setup();
  await handler(msg(DANNY, 'list files'));
  await handler(msg(MIKE, 'list files'));
  const [danny, mike] = calls;
  assert.equal(danny.cwd, path.join(repoRoot, 'projects', 'eam'));
  assert.deepEqual(danny.extraArgs, [
    '--allowedTools',
    'Read(./**),Edit(./**)',
    '--disallowedTools',
    'Bash',
  ]);
  assert.equal(mike.cwd, repoRoot);
  assert.deepEqual(mike.extraArgs, ['--allowedTools', 'Read,Bash']);
});

test('keeps separate conversation sessions per user', async () => {
  const { handler, calls } = setup();
  await handler(msg(MIKE, 'a'));
  await handler(msg(DANNY, 'b'));
  assert.notEqual(calls[0].sessionId, calls[1].sessionId);
});

test('replies to the chat the message came from', async () => {
  const { handler, sent } = setup();
  await handler(msg(MIKE, 'hi', 5555));
  assert.equal(sent[0].chatId, 5555);
});

test('/new gives the next message a fresh session id', async () => {
  const { handler, calls, sent } = setup();
  await handler(msg(MIKE, 'one'));
  await handler(msg(MIKE, '/new'));
  await handler(msg(MIKE, 'two'));
  assert.match(sent[1].text, /new conversation/i);
  assert.notEqual(calls[0].sessionId, calls[1].sessionId);
  assert.equal(calls[1].resume, false);
});

test('a restarted bot resumes the same session from sessions.json', async () => {
  const first = setup();
  await first.handler(msg(MIKE, 'one'));
  const firstId = first.calls[0].sessionId;

  const second = setup({ sessionsFile: first.sessionsFile });
  await second.handler(msg(MIKE, 'two'));
  assert.equal(second.calls[0].sessionId, firstId);
  assert.equal(second.calls[0].resume, true);
});

test('a failed run does not mark the session as started', async () => {
  const { handler, sessions, sent } = setup({
    runClaude: async () => {
      throw new Error('boom');
    },
  });
  await handler(msg(MIKE, 'hi'));
  assert.match(sent[0].text, /Error: boom/);
  assert.equal(sessions.get(MIKE).resume, false);
});

test('a stale resumed session is reset and retried once with a fresh id', async () => {
  let attempt = 0;
  const { handler, calls, sent } = setup({
    runClaude: async () => {
      attempt += 1;
      if (attempt === 2) throw new Error('No conversation found with session ID');
      return 'ok';
    },
  });
  await handler(msg(MIKE, 'one')); // attempt 1 starts the session
  await handler(msg(MIKE, 'two')); // attempt 2 fails on resume, attempt 3 retries
  assert.equal(calls.length, 3);
  assert.equal(calls[1].resume, true);
  assert.equal(calls[2].resume, false);
  assert.notEqual(calls[2].sessionId, calls[1].sessionId);
  assert.equal(sent.at(-1).text, 'ok');
});

test('a claude timeout keeps the session and is not retried', async () => {
  let attempt = 0;
  const { handler, calls, sent, sessions } = setup({
    runClaude: async () => {
      attempt += 1;
      if (attempt === 1) return 'ok';
      const err = new Error('Claude did not respond within 120000ms');
      err.code = 'CLAUDE_TIMEOUT';
      throw err;
    },
  });
  await handler(msg(MIKE, 'one'));
  const { id } = sessions.get(MIKE);
  await handler(msg(MIKE, 'two'));
  assert.equal(calls.length, 2, 'timeout must not trigger a second run');
  assert.match(sent.at(-1).text, /did not respond/);
  assert.equal(sessions.get(MIKE).id, id, 'conversation must survive a timeout');
});

test('an empty claude reply is replaced with a placeholder, not sent empty', async () => {
  const { handler, sent } = setup({ runClaude: async () => '' });
  await handler(msg(MIKE, 'hi'));
  assert.equal(sent.length, 1);
  assert.notEqual(sent[0].text.trim(), '');
});

test('chat not found on send is logged and does not throw or block later messages', async () => {
  let failNext = true;
  const delivered = [];
  const { handler, logs } = setup({
    sendMessage: async (chatId, text) => {
      if (failNext) {
        failNext = false;
        const err = new Error('ETELEGRAM: 400 Bad Request: chat not found');
        err.code = 'ETELEGRAM';
        throw err;
      }
      delivered.push(text);
    },
  });
  await assert.doesNotReject(handler(msg(MIKE, 'one', 404)));
  assert.ok(logs.some((l) => /chat not found/.test(l)), 'failure must be logged');
  await handler(msg(MIKE, 'two'));
  assert.equal(delivered.at(-1), 'reply:two');
});

test('stops sending remaining chunks after a chunk send fails', async () => {
  let sends = 0;
  const { handler } = setup({
    runClaude: async () => 'x'.repeat(4096 * 3),
    sendMessage: async () => {
      sends += 1;
      throw new Error('ETELEGRAM: 403 Forbidden: bot was blocked by the user');
    },
  });
  await handler(msg(MIKE, 'big'));
  // 1 chunk attempt; the error notice attempt is allowed, further chunks are not.
  assert.ok(sends <= 2, `expected at most 2 send attempts, got ${sends}`);
});
