const fs = require('fs');
const path = require('path');

// Penyimpanan sederhana berbasis file JSON (bukan SQLite), supaya aman
// dipakai di VPS yang bermasalah dengan native binding seperti better-sqlite3.
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'sticky-panels.json');

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
    console.error('[store] Gagal baca sticky-panels.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @returns {{ guildId: string, channelId: string, messageId: string } | null}
 */
function getPanel(channelId) {
  const data = readAll();
  return data[channelId] || null;
}

function setPanel(channelId, panel) {
  const data = readAll();
  data[channelId] = panel;
  writeAll(data);
}

function deletePanel(channelId) {
  const data = readAll();
  if (!(channelId in data)) return false;
  delete data[channelId];
  writeAll(data);
  return true;
}

module.exports = { getPanel, setPanel, deletePanel };
