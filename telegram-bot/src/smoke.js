// Live smoke test against a real (dedicated test) Telegram bot: auth, send one
// message, then wait for one message back in the same chat.
async function runSmoke({ env = process.env, baseApiUrl = 'https://api.telegram.org', sendOnly = false } = {}) {
  const token = env.TELEGRAM_TEST_TOKEN;
  if (!token) {
    return {
      status: 'skipped',
      message: 'TELEGRAM_TEST_TOKEN is not set; skipping the live Telegram smoke test.',
    };
  }
  const chatId = env.TELEGRAM_TEST_CHAT_ID;
  if (!chatId) {
    return {
      status: 'failed',
      message:
        'TELEGRAM_TEST_CHAT_ID is not set. Message the test bot once, then set it to your numeric chat id.',
    };
  }
  const waitSeconds = Number(env.TELEGRAM_SMOKE_WAIT_SECONDS || 30);

  async function call(method, params = {}) {
    const res = await fetch(`${baseApiUrl}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      throw new Error(`${method} failed: ${body.error_code || res.status} ${body.description || ''}`.trim());
    }
    return body.result;
  }

  try {
    const me = await call('getMe');
    const updates = await call('getUpdates', { offset: -1, timeout: 0 });
    let lastId = updates.reduce((max, u) => Math.max(max, u.update_id), 0);

    const nonce = Math.random().toString(36).slice(2, 8);
    await call('sendMessage', { chat_id: Number(chatId), text: `smoke-test ${nonce}: reply to this message` });
    if (sendOnly) {
      return { status: 'passed', message: `Sent one message as @${me.username}; receive step skipped.` };
    }

    const deadline = Date.now() + waitSeconds * 1000;
    while (Date.now() < deadline) {
      const remaining = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
      const batch = await call('getUpdates', { offset: lastId + 1, timeout: Math.min(remaining, 10) });
      for (const u of batch) {
        lastId = Math.max(lastId, u.update_id);
        if (u.message && String(u.message.chat.id) === String(chatId)) {
          return {
            status: 'passed',
            message: `Sent and received one message as @${me.username} (got: ${JSON.stringify(u.message.text)}).`,
          };
        }
      }
    }
    return {
      status: 'failed',
      message: `Sent OK as @${me.username}, but no message received in chat ${chatId} within ${waitSeconds}s. Reply to the bot while the test runs.`,
    };
  } catch (err) {
    return { status: 'failed', message: err.message };
  }
}

module.exports = { runSmoke };
