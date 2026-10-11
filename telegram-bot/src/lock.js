const fs = require('node:fs');

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else.
    return err.code === 'EPERM';
  }
}

function readPid(filePath) {
  try {
    const pid = Number(fs.readFileSync(filePath, 'utf8').trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

// Single-instance guard. Creates filePath exclusively with our pid; a lock left
// by a dead (or unparseable) pid is treated as stale and taken over.
function acquireLock(filePath) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(filePath, String(process.pid), { flag: 'wx' });
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      const holder = readPid(filePath);
      if (holder && isAlive(holder)) {
        throw new Error(`Bot is already running (pid ${holder}). Lock file: ${filePath}`);
      }
      fs.rmSync(filePath, { force: true });
      if (attempt === 1) throw err;
    }
  }

  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      if (readPid(filePath) === process.pid) fs.rmSync(filePath, { force: true });
    },
  };
}

module.exports = { acquireLock };
