const fs = require('fs');
const path = require('path');

// Lokasi (channelId + messageId) panel Store & panel Leaderboard Top
// Spender, plus status buka/tutup toko -- 1 file, format konsisten dengan
// music/panelStore.js.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store-panel.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ panel: null, leaderboard: null }, null, 2), 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = raw.trim() ? JSON.parse(raw) : {};
    return { panel: data.panel || null, leaderboard: data.leaderboard || null };
  } catch (error) {
    console.error('[store] Gagal baca store-panel.json, mulai dari kosong:', error);
    return { panel: null, leaderboard: null };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @returns {{ channelId: string, messageId: string, open: boolean } | null}
 */
function getStorePanel() {
  return readAll().panel;
}

function setStorePanel(panel) {
  const data = readAll();
  data.panel = panel;
  writeAll(data);
}

/**
 * @param {boolean} open
 * @param {string|null} closedReason - 'manual' (lewat /toko-tutup) atau
 *   'stock' (otomatis karena stock habis). null kalau open=true atau tidak
 *   relevan. Dipakai supaya auto-reopen stock nggak nimpa /toko-tutup
 *   manual, dan sebaliknya.
 * @returns {boolean} status open yang baru
 */
function setStoreOpen(open, closedReason = null) {
  const data = readAll();
  if (!data.panel) return open;
  data.panel.open = open;
  data.panel.closedReason = open ? null : closedReason;
  writeAll(data);
  return open;
}

function getStoreClosedReason() {
  return readAll().panel?.closedReason || null;
}

function getLeaderboardPanel() {
  return readAll().leaderboard;
}

function setLeaderboardPanel(panel) {
  const data = readAll();
  data.leaderboard = panel;
  writeAll(data);
}

module.exports = {
  getStorePanel,
  setStorePanel,
  setStoreOpen,
  getStoreClosedReason,
  getLeaderboardPanel,
  setLeaderboardPanel,
};
