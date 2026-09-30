const { execFile } = require('node:child_process');

function runClaude(promptText, options = {}) {
  const {
    cwd,
    command = 'claude',
    extraArgs = [],
    timeoutMs = 120000,
  } = options;

  return new Promise((resolve, reject) => {
    const child = execFile(
      command,
      [...extraArgs, '-p', '--', promptText],
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
    child.stdin.end();
  });
}

module.exports = { runClaude };
