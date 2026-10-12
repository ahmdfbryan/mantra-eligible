const fs = require('fs');
const path = require('path');

// Stock Robux harian -- admin set total lewat /toko-stock, berkurang tiap
// ticket Robux dibuat, bertambah lagi (dikembalikan) kalau ticket itu
// akhirnya Cancelled/Refund. total === null artinya belum di-set / tidak
// dibatasi (mode lama, unlimited -- backward compatible).
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store-stock.json');

const DEFAULT_DATA = { total: null, remaining: null, setAt: null, setBy: null };

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
      total: typeof data.total === 'number' ? data.total : null,
      remaining: typeof data.remaining === 'number' ? data.remaining : null,
      setAt: data.setAt || null,
      setBy: data.setBy || null,
    };
  } catch (error) {
    console.error('[store] Gagal baca store-stock.json, mulai dari kosong:', error);
    return { ...DEFAULT_DATA };
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @returns {{ total: number|null, remaining: number|null, setAt: number|null, setBy: string|null }}
 */
function getStock() {
  return readAll();
}

/**
 * Set/reset stock harian ke nilai baru (dipanggil dari /toko-stock).
 */
function setStock(total, setBy) {
  const data = { total, remaining: total, setAt: Date.now(), setBy };
  writeAll(data);
  return data;
}

/**
 * Kurangi stock tersisa sebanyak `amount` (dipanggil tiap ticket Robux
 * berhasil dibuat). No-op kalau stock belum di-set (unlimited).
 * @returns {{ total: number|null, remaining: number|null }} stock terbaru
 */
function reserveStock(amount) {
  const data = readAll();
  if (data.total === null || data.remaining === null) return data;
  data.remaining = Math.max(0, data.remaining - amount);
  writeAll(data);
  return data;
}

/**
 * Kembalikan stock sebanyak `amount` (dipanggil kalau ticket dibatalkan
 * jadi Cancelled/Refund). Dibatasi max `total`. No-op kalau unlimited.
 * @returns {{ total: number|null, remaining: number|null }} stock terbaru
 */
function releaseStock(amount) {
  const data = readAll();
  if (data.total === null || data.remaining === null) return data;
  data.remaining = Math.min(data.total, data.remaining + amount);
  writeAll(data);
  return data;
}

module.exports = {
  getStock,
  setStock,
  reserveStock,
  releaseStock,
};
