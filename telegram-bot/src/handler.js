const { findUser, toolArgs } = require('./users');
const { chunkMessage } = require('./chunkMessage');

const EMPTY_REPLY = '(Claude returned an empty response.)';

function createHandler({ bot, users, sessions, enqueue, runClaude, log = console.error }) {
  async function send(chatId, text) {
    try {
      await bot.sendMessage(chatId, text);
      return true;
    } catch (err) {
      log(`sendMessage to chat ${chatId} failed: ${err.message}`);
      return false;
    }
  }

  async function runTurn(user, msg) {
    const userId = msg.from.id;
    const run = (session) =>
      runClaude(msg.text, {
        cwd: user.cwd,
        extraArgs: toolArgs(user),
        sessionId: session.id,
        resume: session.resume,
      });

    let session = sessions.get(userId);
    let reply;
    try {
      reply = await run(session);
    } catch (err) {
      // A timeout says nothing about the session; keep the conversation and
      // don't double the wait with a retry.
      if (!session.resume || err.code === 'CLAUDE_TIMEOUT') throw err;
      // Stale or missing session: start fresh and retry once.
      sessions.reset(userId);
      session = sessions.get(userId);
      reply = await run(session);
    }
    sessions.markStarted(userId);

    for (const chunk of chunkMessage(reply || EMPTY_REPLY)) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  }

  return async function handleMessage(msg) {
    try {
      const user = msg.from && findUser(msg.from.id, users);
      if (!user) return;
      if (!msg.text) return;

      const text = msg.text.trim();
      if (text === '/new') {
        sessions.reset(msg.from.id);
        await send(msg.chat.id, 'Started a new conversation.');
        return;
      }
      if (text === '/start') {
        await send(
          msg.chat.id,
          `Welcome, ${user.name}! Send me a message to get started. Use /new to reset the conversation.`
        );
        return;
      }

      await enqueue(String(msg.from.id), async () => {
        try {
          await runTurn(user, msg);
        } catch (err) {
          log(`turn for user ${msg.from.id} failed: ${err.message}`);
          await send(msg.chat.id, `Error: ${err.message}`);
        }
      });
    } catch (err) {
      log(`unhandled error in message handler: ${err.stack || err.message}`);
    }
  };
}

module.exports = { createHandler };
