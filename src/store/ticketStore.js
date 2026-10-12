const fs = require('fs');
const path = require('path');

// Penyimpanan ticket Store berbasis file JSON, konsisten dengan pattern
// store.js / quizStore.js / music/panelStore.js.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store-tickets.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ nextTicketNumber: 1, categories: [], tickets: {}, spenders: {} }, null, 2),
      'utf8'
    );
  }
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = raw.trim() ? JSON.parse(raw) : {};
    return {
      nextTicketNumber: data.nextTicketNumber || 1,
      categories: Array.isArray(data.categories) ? data.categories : [],
      tickets: data.tickets || {},
      spenders: data.spenders || {},
    };
  } catch (error) {
    console.error('[store] Gagal baca store-tickets.json, mulai dari kosong:', error);
    return { nextTicketNumber: 1, categories: [], tickets: {}, spenders: {} };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Ambil + naikkan nomor ticket berikutnya (global, auto-increment).
 * @returns {{ number: number, padded: string }}
 */
function nextTicketNumber() {
  const data = readAll();
  const number = data.nextTicketNumber;
  data.nextTicketNumber = number + 1;
  writeAll(data);
  return { number, padded: String(number).padStart(4, '0') };
}

function getCategories() {
  return readAll().categories;
}

function addCategory(categoryId) {
  const data = readAll();
  if (!data.categories.includes(categoryId)) {
    data.categories.push(categoryId);
    writeAll(data);
  }
}

/**
 * @returns {object} ticket yang baru dibuat
 */
function createTicket(channelId, fields) {
  const data = readAll();
  data.tickets[channelId] = {
    status: 'open',
    adminHandlerId: null,
    createdAt: Date.now(),
    closedAt: null,
    pendingRating: null,
    testimonial: null,
    ...fields,
  };
  writeAll(data);
  return data.tickets[channelId];
}

function getTicket(channelId) {
  const data = readAll();
  return data.tickets[channelId] || null;
}

function updateTicket(channelId, patch) {
  const data = readAll();
  if (!data.tickets[channelId]) return null;
  data.tickets[channelId] = { ...data.tickets[channelId], ...patch };
  writeAll(data);
  return data.tickets[channelId];
}

function setTestimonial(channelId, testimonial) {
  return updateTicket(channelId, { testimonial, pendingRating: null });
}

/**
 * Tambah akumulasi total belanja (Rupiah) milik 1 buyer -- dipanggil cuma
 * saat ticket ditutup dengan status Completed.
 */
function addSpend(userId, amount) {
  const data = readAll();
  data.spenders[userId] = (data.spenders[userId] || 0) + amount;
  writeAll(data);
  return data.spenders[userId];
}

function getTotalSpend(userId) {
  const data = readAll();
  return data.spenders[userId] || 0;
}

/**
 * @returns {{ userId: string, total: number }[]} descending, top `limit`
 */
function getTopSpenders(limit = 10) {
  const data = readAll();
  return Object.entries(data.spenders)
    .map(([userId, total]) => ({ userId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

module.exports = {
  nextTicketNumber,
  getCategories,
  addCategory,
  createTicket,
  getTicket,
  updateTicket,
  setTestimonial,
  addSpend,
  getTotalSpend,
  getTopSpenders,
};
