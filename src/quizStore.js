const fs = require('fs');
const path = require('path');

// Penyimpanan poin Quiz Arena + role top 1/2/3 + lokasi panel leaderboard.
// Pakai file JSON (bukan SQLite) supaya aman di VPS yang bermasalah dengan
// native binding seperti better-sqlite3.
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'quiz.json');

const DEFAULT_DATA = {
  scores: {}, // { "<userId>": points }
  topRoles: { 1: null, 2: null, 3: null }, // userId yang lagi pegang role top 1/2/3
  panel: null, // { guildId, channelId, messageId } lokasi panel leaderboard live
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = raw.trim() ? JSON.parse(raw) : {};
    return {
      scores: data.scores || {},
      topRoles: { 1: null, 2: null, 3: null, ...(data.topRoles || {}) },
      panel: data.panel || null,
    };
  } catch (error) {
    console.error('[quizStore] Gagal baca quiz.json, mulai dari kosong:', error);
    return { ...DEFAULT_DATA };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getScores() {
  return readAll().scores;
}

function getPoints(userId) {
  return getScores()[userId] || 0;
}

/**
 * Tambah (atau kurangi kalau amount negatif) poin user. Tidak akan turun
 * di bawah 0.
 */
function addPoints(userId, amount) {
  const data = readAll();
  const current = data.scores[userId] || 0;
  const next = Math.max(0, current + amount);
  data.scores[userId] = next;
  writeAll(data);
  return next;
}

/**
 * Set poin user langsung ke nilai tertentu (buat koreksi/import data).
 */
function setPoints(userId, amount) {
  const data = readAll();
  data.scores[userId] = Math.max(0, amount);
  writeAll(data);
  return data.scores[userId];
}

/**
 * Leaderboard terurut (poin terbesar dulu), hanya user dengan poin > 0.
 * Tie-break pakai userId supaya urutannya stabil/konsisten.
 */
function getSortedLeaderboard() {
  const scores = getScores();
  return Object.entries(scores)
    .map(([userId, points]) => ({ userId, points }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points || (a.userId < b.userId ? -1 : 1));
}

function getTopRoles() {
  return readAll().topRoles;
}

function setTopRoles(topRoles) {
  const data = readAll();
  data.topRoles = topRoles;
  writeAll(data);
}

function getPanel() {
  return readAll().panel;
}

function setPanel(panel) {
  const data = readAll();
  data.panel = panel;
  writeAll(data);
}

function clearPanel() {
  const data = readAll();
  data.panel = null;
  writeAll(data);
}

module.exports = {
  getScores,
  getPoints,
  addPoints,
  setPoints,
  getSortedLeaderboard,
  getTopRoles,
  setTopRoles,
  getPanel,
  setPanel,
  clearPanel,
};
