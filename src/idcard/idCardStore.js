const fs = require('fs');
const path = require('path');

// Penyimpanan sederhana berbasis file JSON (konsisten dengan store.js /
// boostStore.js), buat nyimpen data ID Card per member per guild.
// Struktur: { "<guildId>": { "counter": number, "members": { "<userId>": {...} } } }
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'id-cards.json');

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
    console.error('[idCardStore] Gagal baca id-cards.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function ensureGuild(data, guildId) {
  if (!data[guildId]) {
    data[guildId] = { counter: 0, members: {} };
  }
  return data[guildId];
}

/**
 * @returns {object|null} data ID card member ini kalau sudah pernah buat, null kalau belum.
 */
function getCard(guildId, userId) {
  const data = readAll();
  return data[guildId]?.members?.[userId] || null;
}

/**
 * Buat (atau update) ID card member. Kalau sudah pernah buat sebelumnya,
 * idNo & createdAt yang lama dipertahankan (cuma field isian yang di-update) --
 * konsisten dengan konsep "edit profil", bukan bikin identitas baru tiap submit.
 * @returns {object} data ID card lengkap setelah disimpan
 */
function upsertCard(guildId, userId, fields) {
  const data = readAll();
  const guildData = ensureGuild(data, guildId);

  const existing = guildData.members[userId];
  let idNo = existing?.idNo;
  let createdAt = existing?.createdAt;

  if (!idNo) {
    guildData.counter += 1;
    idNo = String(guildData.counter).padStart(5, '0');
  }
  if (!createdAt) {
    createdAt = new Date().toISOString();
  }

  const record = {
    idNo,
    nama: fields.nama,
    jenisKelamin: fields.jenisKelamin,
    domisili: fields.domisili,
    citaCita: fields.citaCita,
    hobi: fields.hobi,
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  guildData.members[userId] = record;
  writeAll(data);
  return record;
}

module.exports = { getCard, upsertCard };
