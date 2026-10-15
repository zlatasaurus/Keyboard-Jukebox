// uploads-db.js — custom uploads live in indexedDB cuz localStorage is too tiny for audio

let dbPromise;
function db() {
  if (!dbPromise) dbPromise = new Promise((res, rej) => {
    const r = indexedDB.open('jukebox', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('custom', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbPromise;
}

export async function getAll() {
  const d = await db();
  return new Promise((res, rej) => {
    const r = d.transaction('custom').objectStore('custom').getAll();
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}

// put + delete are the same dance, just a different store method
async function write(method, arg) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('custom', 'readwrite'); t.objectStore('custom')[method](arg);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });
}
export const put = (rec) => write('put', rec);   // rec = { id, label, data: ArrayBuffer }
export const remove = (id) => write('delete', id);
