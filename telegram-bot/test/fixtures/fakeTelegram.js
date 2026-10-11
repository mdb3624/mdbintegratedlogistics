const http = require('node:http');

// Minimal in-process Telegram Bot API. Point node-telegram-bot-api at it with
// the `baseApiUrl` option. Supports long polling via getUpdates, records every
// sendMessage, and can be told to fail sends or return a 409 polling conflict.
function startFakeTelegram() {
  const updates = [];
  const sent = [];
  const sendFailures = [];
  let nextUpdateId = 1;
  let conflict = false;

  function parseBody(raw, contentType) {
    if (!raw) return {};
    if ((contentType || '').includes('application/json')) return JSON.parse(raw);
    return Object.fromEntries(new URLSearchParams(raw));
  }

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const method = req.url.split('/').pop().split('?')[0];
      const body = parseBody(Buffer.concat(chunks).toString('utf8'), req.headers['content-type']);
      const reply = (status, payload) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(payload));
      };
      const fail = (code, description) =>
        reply(code, { ok: false, error_code: code, description });

      if (method === 'getUpdates') {
        if (conflict) {
          return fail(409, 'Conflict: terminated by other getUpdates request');
        }
        const offset = Number(body.offset || 0);
        const pending = updates.filter((u) => u.update_id >= offset);
        if (pending.length === 0) await new Promise((r) => setTimeout(r, 100));
        return reply(200, { ok: true, result: pending });
      }

      if (method === 'sendMessage') {
        const failure = sendFailures.shift();
        if (failure) return fail(failure.code, failure.description);
        sent.push({ chat_id: Number(body.chat_id), text: body.text });
        return reply(200, {
          ok: true,
          result: { message_id: sent.length, chat: { id: Number(body.chat_id) }, text: body.text },
        });
      }

      if (method === 'getMe') {
        return reply(200, { ok: true, result: { id: 1, is_bot: true, username: 'fake_bot' } });
      }

      return reply(200, { ok: true, result: true });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseApiUrl: `http://127.0.0.1:${port}`,
        sent,
        sendTexts: () => sent.map((s) => s.text),
        pushMessage({ fromId, chatId = fromId, text }) {
          const id = nextUpdateId++;
          updates.push({
            update_id: id,
            message: {
              message_id: id,
              date: Math.floor(Date.now() / 1000),
              from: { id: fromId, is_bot: false, first_name: 'Test' },
              chat: { id: chatId, type: 'private' },
              text,
            },
          });
        },
        failNextSend(description = 'Bad Request: chat not found', code = 400) {
          sendFailures.push({ code, description });
        },
        setConflict(value = true) {
          conflict = value;
        },
        close: () =>
          new Promise((r) => {
            server.closeAllConnections();
            server.close(r);
          }),
      });
    });
  });
}

async function waitFor(predicate, { timeoutMs = 5000, intervalMs = 25, label = 'condition' } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

module.exports = { startFakeTelegram, waitFor };
