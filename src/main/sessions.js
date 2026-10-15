// sessions.js — counts keys, saves a lil record of this session into sessions.json
const fs = require('fs');
const path = require('path');

function createSessionTracker({ dir }) {
  const startedAt = Date.now();
  let keys = 0;

  const file = () => { fs.mkdirSync(dir, { recursive: true }); return path.join(dir, 'sessions.json'); };
  const readAll = () => { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { return []; } };

  // writes THIS session into the file (replaces itself if it was already autosaved)
  function save() {
    try {
      const all = readAll().filter(s => s.start !== startedAt);
      const end = Date.now();
      all.push({
        start: startedAt, end, keys,
        startedLocal: new Date(startedAt).toLocaleString(), // system date + time, human readable
        endedLocal: new Date(end).toLocaleString(),
      });
      fs.writeFileSync(file(), JSON.stringify(all, null, 2));
    } catch (e) { console.log('couldnt save session', e.message); }
  }

  return {
    file,
    save,
    countKey: () => { keys++; },
    // past sessions + the live one, for the chart
    history: () => ({
      sessions: readAll().filter(s => s.start !== startedAt),
      current: { start: startedAt, keys },
    }),
  };
}

module.exports = { createSessionTracker };
