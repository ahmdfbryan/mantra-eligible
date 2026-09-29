const fs = require('fs');
const path = require('path');

// Sistem Daily Check-in ala Salvatore Streak: klaim reward XP harian, streak
// naik kalau klaim lagi dalam 20-48 jam dari klaim terakhir, balik ke hari 1
// kalau kelewat lebih dari 48 jam. Struktur data:
// { "<guildId>": { "<userId>": { lastCheckinAt: number(ms), streak: number } } }
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'checkins.json');

const BASE_REWARD = 50; // XP dasar per check-in
const STREAK_BONUS = 5; // tambahan XP per hari streak berturut-turut
const MAX_REWARD = 100; // cap reward XP per check-in (tercapai di streak hari ke-11)
const MIN_HOURS_BETWEEN = 20; // klaim lagi baru bisa setelah X jam dari klaim terakhir
const STREAK_BREAK_HOURS = 48; // lewat dari X jam tanpa klaim -> streak balik ke hari 1

const HOUR_MS = 60 * 60 * 1000;

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
    console.error('[checkinStore] Gagal baca checkins.json, mulai dari kosong:', error);
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getStatus(guildId, userId) {
  const data = readAll();
  const user = data[guildId]?.[userId] || { lastCheckinAt: 0, streak: 0 };
  return { lastCheckinAt: user.lastCheckinAt || 0, streak: user.streak || 0 };
}

function rewardForStreak(streak) {
  return Math.min(BASE_REWARD + STREAK_BONUS * (streak - 1), MAX_REWARD);
}

/**
 * Coba klaim daily check-in buat 1 member. Kalau masih kena cooldown
 * (belum 20 jam dari klaim terakhir), balikin { eligible: false,
 * nextAvailableAt } tanpa ubah apa-apa. Kalau eligible, update streak +
 * simpan, balikin { eligible: true, streak, reward, isNewStreak }.
 */
function claim(guildId, userId) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  const user = data[guildId][userId] || { lastCheckinAt: 0, streak: 0 };

  const now = Date.now();
  const hoursSinceLast = user.lastCheckinAt ? (now - user.lastCheckinAt) / HOUR_MS : Infinity;

  if (user.lastCheckinAt && hoursSinceLast < MIN_HOURS_BETWEEN) {
    return {
      eligible: false,
      nextAvailableAt: user.lastCheckinAt + MIN_HOURS_BETWEEN * HOUR_MS,
    };
  }

  const isNewStreak = !user.lastCheckinAt || hoursSinceLast > STREAK_BREAK_HOURS;
  const streak = isNewStreak ? 1 : user.streak + 1;
  const reward = rewardForStreak(streak);

  data[guildId][userId] = { lastCheckinAt: now, streak };
  writeAll(data);

  return { eligible: true, streak, reward, isNewStreak };
}

module.exports = {
  getStatus,
  claim,
  rewardForStreak,
  BASE_REWARD,
  STREAK_BONUS,
  MAX_REWARD,
  MIN_HOURS_BETWEEN,
  STREAK_BREAK_HOURS,
};
