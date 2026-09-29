const fs = require('fs');
const path = require('path');

// Penyimpanan sederhana berbasis file JSON (konsisten dengan store.js /
// quizStore.js), buat lacak user ID yang sudah pernah dikirimi notif
// "Terima kasih boost" — supaya:
// 1. Backfill (/boost-sync) tidak double-kirim ke yang sudah pernah dikirimi.
// 2. Event guildMemberUpdate juga tidak double-kirim kalau /boost-sync
//    dijalankan lagi setelah ada boost baru lewat event live.
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'boost-notified.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('[boostStore] Gagal baca boost-notified.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function isNotified(userId) {
  const data = readAll();
  return Boolean(data[userId]);
}

function markNotified(userId) {
  const data = readAll();
  data[userId] = { notifiedAt: new Date().toISOString() };
  writeAll(data);
}

module.exports = { isNotified, markNotified };
