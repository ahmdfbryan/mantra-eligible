const fs = require('fs');
const path = require('path');

// Sistem level ala Arcane/MEE6: dapat XP random tiap kirim pesan (dengan
// cooldown supaya tidak bisa di-spam buat naik level cepat), level dihitung
// dari akumulasi total XP pakai kurva yang makin berat tiap naik level.
// Struktur data: { "<guildId>": { "<userId>": { xp: number, lastMessageAt: number } } }
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'levels.json');

const XP_COOLDOWN_MS = 60_000; // 1 menit -- 1 pesan cuma dihitung XP-nya sekali per menit per user
const XP_MIN = 15;
const XP_MAX = 25;

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
    console.error('[levelStore] Gagal baca levels.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * XP yang dibutuhkan buat naik DARI level `level` ke `level + 1` (kurva yang
 * makin berat tiap level, formula umum dipakai bot leveling Discord seperti
 * MEE6/Arcane: 5*L^2 + 50*L + 100).
 */
function xpNeededForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/**
 * Hitung level dari total XP terkumpul, sekaligus progress-nya di level saat ini.
 * @returns {{ level: number, xpIntoLevel: number, xpForNextLevel: number, totalXp: number }}
 */
function calculateLevelInfo(totalXp) {
  let level = 0;
  let remaining = totalXp;
  let needed = xpNeededForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpNeededForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed, totalXp };
}

function getUserData(guildId, userId) {
  const data = readAll();
  return data[guildId]?.[userId] || { xp: 0, lastMessageAt: 0 };
}

/**
 * @returns {{ level: number, xpIntoLevel: number, xpForNextLevel: number, totalXp: number }}
 */
function getUserLevel(guildId, userId) {
  const user = getUserData(guildId, userId);
  return calculateLevelInfo(user.xp);
}

/**
 * Coba tambah XP untuk 1 pesan yang baru dikirim. Kalau masih kena cooldown,
 * tidak nambah apa-apa (return null). Non-fatal by design -- dipanggil dari
 * listener messageCreate buat SEMUA pesan member, jadi harus murah & aman.
 * @returns {{ leveledUp: boolean, level: number, totalXp: number } | null}
 */
function tryAddXp(guildId, userId) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  const user = data[guildId][userId] || { xp: 0, lastMessageAt: 0 };

  const now = Date.now();
  if (now - (user.lastMessageAt || 0) < XP_COOLDOWN_MS) return null;

  const beforeLevel = calculateLevelInfo(user.xp).level;
  const gain = XP_MIN + Math.floor(Math.random() * (XP_MAX - XP_MIN + 1));

  user.xp += gain;
  user.lastMessageAt = now;
  data[guildId][userId] = user;
  writeAll(data);

  const afterInfo = calculateLevelInfo(user.xp);
  return { leveledUp: afterInfo.level > beforeLevel, level: afterInfo.level, totalXp: user.xp };
}

/**
 * Leaderboard level (Top N) untuk 1 guild, diurut dari total XP terbesar.
 * @returns {Array<{ userId: string, level: number, totalXp: number }>}
 */
function getLeaderboard(guildId, limit = 10) {
  const data = readAll();
  const guildData = data[guildId] || {};
  return Object.entries(guildData)
    .map(([userId, user]) => ({ userId, ...calculateLevelInfo(user.xp) }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit);
}

/**
 * Tambah XP langsung dalam jumlah tertentu, TANPA cooldown (beda dari
 * tryAddXp yang khusus buat XP chat per-menit). Dipakai untuk reward yang
 * memang sengaja terjadi sekali per aksi, seperti klaim Daily Check-in.
 * @returns {{ leveledUp: boolean, level: number, totalXp: number }}
 */
function addXp(guildId, userId, amount) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  const user = data[guildId][userId] || { xp: 0, lastMessageAt: 0 };

  const beforeLevel = calculateLevelInfo(user.xp).level;
  user.xp += amount;
  data[guildId][userId] = user;
  writeAll(data);

  const afterInfo = calculateLevelInfo(user.xp);
  return { leveledUp: afterInfo.level > beforeLevel, level: afterInfo.level, totalXp: user.xp };
}

/**
 * Ranking 1 user di antara SEMUA member yang tercatat di guild itu (bukan
 * cuma Top N seperti getLeaderboard), diurut dari total XP terbesar.
 * @returns {{ rank: number, totalRanked: number, totalXp: number }}
 */
function getUserRank(guildId, userId) {
  const data = readAll();
  const guildData = data[guildId] || {};
  const sorted = Object.entries(guildData)
    .map(([id, user]) => ({ userId: id, totalXp: user.xp || 0 }))
    .sort((a, b) => b.totalXp - a.totalXp);

  const totalRanked = sorted.length;
  const index = sorted.findIndex((entry) => entry.userId === userId);
  const totalXp = index >= 0 ? sorted[index].totalXp : guildData[userId]?.xp || 0;
  const rank = index >= 0 ? index + 1 : totalRanked + 1;

  return { rank, totalRanked: Math.max(totalRanked, rank), totalXp };
}

module.exports = {
  getUserLevel,
  tryAddXp,
  addXp,
  getLeaderboard,
  getUserRank,
  calculateLevelInfo,
  xpNeededForLevel,
};
