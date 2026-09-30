function createMessageHandler({ config, cwd, runClaude, chunkMessage, isAllowedUser, sendMessage }) {
  return async function handleMessage(msg) {
    if (!isAllowedUser(msg.from.id, config.allowedUserIds)) return;
    if (!msg.text) return;

    try {
      const reply = await runClaude(msg.text, { cwd });
      const chunks = chunkMessage(reply);
      for (const chunk of chunks) {
        await sendMessage(msg.chat.id, chunk);
      }
    } catch (err) {
      const [errorChunk] = chunkMessage(`Error: ${err.message}`);
      try {
        await sendMessage(msg.chat.id, errorChunk);
      } catch (sendErr) {
        console.error('Failed to send error message to Telegram:', sendErr);
      }
    }
  };
}

module.exports = { createMessageHandler };
