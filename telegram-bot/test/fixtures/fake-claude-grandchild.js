// Simulates `claude -p` spawning a long-lived tool subprocess (e.g. Bash).
// Usage: node fake-claude-grandchild.js <markerFile> -p <prompt>
const { spawn } = require('node:child_process');

const marker = process.argv[2];
spawn(
  process.execPath,
  [
    '-e',
    `setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'alive'), 1500)`,
  ],
  { stdio: 'ignore' }
);

setTimeout(() => {}, 10000);
