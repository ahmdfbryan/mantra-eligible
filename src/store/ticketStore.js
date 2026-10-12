const fs = require('fs');
const path = require('path');

// Penyimpanan ticket Store berbasis file JSON, konsisten dengan pattern
// store.js / quizStore.js / music/panelStore.js.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store-tickets.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ categories: [], tickets: {}, spenders: {} }, null, 2), 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = raw.trim() ? JSON.parse(raw) : {};
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      tickets: data.tickets || {},
      spenders: data.spenders || {},
    };
  } catch (error) {
    console.error('[store] Gagal baca store-tickets.json, mulai dari kosong:', error);
    return { categories: [], tickets: {}, spenders: {} };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Dipakai bikin ID ticket acak -- huruf kapital + angka, tanpa karakter yang
// gampang ketuker (0/O, 1/I) biar gampang dibaca/diketik ulang kalau perlu.
const TICKET_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate ID ticket acak (default 6 karakter), dicek supaya tidak bentrok
 * sama ticket yang sudah pernah ada (termasuk yang sudah closed, biar Order
 * ID selamanya unik).
 * @returns {string}
 */
function generateTicketId(length = 6) {
  const data = readAll();
  const existingIds = new Set(Object.values(data.tickets).map((t) => t.ticketNumber));

  let id;
  do {
    id = Array.from({ length }, () => TICKET_ID_CHARS[Math.floor(Math.random() * TICKET_ID_CHARS.length)]).join('');
  } while (existingIds.has(id));

  return id;
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

/**
 * Cari ticket yang masih "open" (belum ditutup Completed/Cancelled/Refund)
 * milik 1 buyer (Discord user ID) -- dipakai buat cegah 1 orang bikin lebih
 * dari 1 ticket aktif bersamaan.
 * @returns {{ channelId: string } & object | null}
 */
function getOpenTicketByBuyer(buyerId) {
  const data = readAll();
  for (const [channelId, ticket] of Object.entries(data.tickets)) {
    if (ticket.buyerId === buyerId && ticket.status === 'open') {
      return { channelId, ...ticket };
    }
  }
  return null;
}

/**
 * Sama seperti getOpenTicketByBuyer, tapi dicari berdasarkan username
 * Roblox (case-insensitive) -- cegah 1 akun Roblox dipakai bikin ticket
 * dobel lewat Discord account yang berbeda.
 */
function getOpenTicketByRobloxUsername(robloxUsername) {
  const data = readAll();
  const target = robloxUsername.toLowerCase();
  for (const [channelId, ticket] of Object.entries(data.tickets)) {
    if (ticket.robloxUsername?.toLowerCase() === target && ticket.status === 'open') {
      return { channelId, ...ticket };
    }
  }
  return null;
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

/**
 * Jumlah ticket yang sudah Completed (transaksi berhasil) -- dipakai buat
 * statistik "Total Transaksi" di panel Store.
 */
function getCompletedCount() {
  const data = readAll();
  return Object.values(data.tickets).filter((t) => t.status === 'completed').length;
}

/**
 * Rating rata-rata toko dari semua testimoni yang pernah masuk.
 * @returns {{ average: number, count: number }}
 */
function getAverageRating() {
  const data = readAll();
  const ratings = Object.values(data.tickets)
    .map((t) => t.testimonial?.rating)
    .filter((r) => typeof r === 'number');

  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { average: sum / ratings.length, count: ratings.length };
}

module.exports = {
  generateTicketId,
  getCategories,
  addCategory,
  createTicket,
  getTicket,
  getOpenTicketByBuyer,
  getOpenTicketByRobloxUsername,
  updateTicket,
  setTestimonial,
  addSpend,
  getTotalSpend,
  getTopSpenders,
  getCompletedCount,
  getAverageRating,
};
