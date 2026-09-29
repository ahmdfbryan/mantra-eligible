const fs = require('fs');
const path = require('path');

// Penyimpanan lokasi panel musik (channelId + messageId per guild), format
// JSON konsisten dengan store.js / quizStore.js.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'music-panel.json');

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
    console.error('[music] Gagal baca music-panel.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @returns {{ channelId: string, messageId: string } | null}
 */
function getPanel(guildId) {
  const data = readAll();
  return data[guildId] || null;
}

function setPanel(guildId, panel) {
  const data = readAll();
  data[guildId] = panel;
  writeAll(data);
}

function clearPanel(guildId) {
  const data = readAll();
  if (!(guildId in data)) return false;
  delete data[guildId];
  writeAll(data);
  return true;
}

module.exports = { getPanel, setPanel, clearPanel };
