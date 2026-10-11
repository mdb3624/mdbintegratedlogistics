const fs = require('node:fs');
const crypto = require('node:crypto');

function createSessionStore(filePath) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    data = {};
  }

  function save() {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  return {
    // Returns { id, resume }. resume is false until the first successful run.
    get(userId) {
      const key = String(userId);
      if (!data[key]) {
        data[key] = { id: crypto.randomUUID(), started: false };
        save();
      }
      return { id: data[key].id, resume: data[key].started };
    },
    markStarted(userId) {
      const entry = data[String(userId)];
      if (entry && !entry.started) {
        entry.started = true;
        save();
      }
    },
    reset(userId) {
      delete data[String(userId)];
      save();
    },
  };
}

// Runs tasks for the same key one at a time.
function createKeyedQueue() {
  const tails = new Map();
  return function enqueue(key, task) {
    const prev = tails.get(key) || Promise.resolve();
    const next = prev.then(task, task);
    const tail = next.catch(() => {});
    tails.set(key, tail);
    tail.then(() => {
      if (tails.get(key) === tail) tails.delete(key);
    });
    return next;
  };
}

module.exports = { createSessionStore, createKeyedQueue };
