// Graceful stop: stop taking new messages, let in-flight runs finish (bounded),
// release the instance lock, then exit.
function createShutdown({
  stopPolling,
  idle,
  release,
  exit,
  log = console.log,
  drainTimeoutMs = 30000,
}) {
  let pending = null;

  return function shutdown(reason, exitCode = 0) {
    if (pending) return pending;
    pending = (async () => {
      log(`Shutting down (${reason})...`);
      let code = exitCode;
      try {
        await stopPolling();
      } catch (err) {
        log(`stopPolling failed: ${err.message}`);
      }

      let timer;
      const timedOut = Symbol('timeout');
      const result = await Promise.race([
        idle().then(() => null),
        new Promise((resolve) => {
          timer = setTimeout(() => resolve(timedOut), drainTimeoutMs);
        }),
      ]);
      clearTimeout(timer);
      if (result === timedOut) {
        log(`In-flight work did not finish within ${drainTimeoutMs}ms; exiting anyway.`);
        if (code === 0) code = 1;
      }

      try {
        release();
      } finally {
        exit(code);
      }
    })();
    return pending;
  };
}

module.exports = { createShutdown };
