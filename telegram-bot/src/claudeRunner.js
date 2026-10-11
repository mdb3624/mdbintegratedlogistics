const { execFile } = require('node:child_process');

function runClaude(promptText, options = {}) {
  const {
    cwd,
    command = 'claude',
    extraArgs = [],
    timeoutMs = 120000,
    sessionId,
    resume = false,
  } = options;
  const sessionArgs = sessionId ? [resume ? '--resume' : '--session-id', sessionId] : [];

  return new Promise((resolve, reject) => {
    execFile(
      command,
      [...extraArgs, ...sessionArgs, '-p', promptText],
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
