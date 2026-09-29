const { createCanvas } = require('@napi-rs/canvas');

// Banner "MANTRA STREAK" -- versi Mantra Creative dari banner "Salvatore
// Streak" di referensi, tapi ikon & layout dibuat sendiri (bukan jiplakan):
// gradient pink/hitam khas Mantra + ikon api custom yang digambar lewat
// canvas (bukan emoji), bukan blok merah diagonal seperti referensi.
const WIDTH = 1000;
const HEIGHT = 260;

const COLORS = {
  bgTop: '#0a0308',
  bgBottom: '#2b0521',
  pink: '#ff2f9c',
  pinkSoft: '#ff7fc4',
  pinkDeep: '#c2116f',
  white: '#ffffff',
  grayDim: 'rgba(255,255,255,0.55)',
};

let cachedBuffer = null;
let cachedTitle = null;

function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Ikon api modern -- 2 layer flame (luar pink solid, dalam pink muda/putih)
 * digambar dari kurva bezier, bukan emoji/gambar luar.
 */
function drawFlameIcon(ctx, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.shadowColor = 'rgba(255, 47, 156, 0.85)';
  ctx.shadowBlur = 26;

  // Layer luar
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.bezierCurveTo(-46, 40, -34, -10, -6, -40);
  ctx.bezierCurveTo(-16, -8, 4, -6, 2, -34);
  ctx.bezierCurveTo(26, -18, 40, 6, 34, 30);
  ctx.bezierCurveTo(50, 20, 52, 50, 34, 66);
  ctx.bezierCurveTo(44, 42, 28, 28, 18, 38);
  ctx.bezierCurveTo(22, 54, 10, 70, 0, 70);
  ctx.closePath();
  const outerGradient = ctx.createLinearGradient(0, -40, 0, 70);
  outerGradient.addColorStop(0, COLORS.pinkSoft);
  outerGradient.addColorStop(1, COLORS.pinkDeep);
  ctx.fillStyle = outerGradient;
  ctx.fill();

  ctx.shadowBlur = 0;

  // Layer dalam, lebih kecil & terang
  ctx.beginPath();
  ctx.moveTo(2, 46);
  ctx.bezierCurveTo(-18, 30, -12, 4, 2, -12);
  ctx.bezierCurveTo(0, 4, 14, 6, 12, -6);
  ctx.bezierCurveTo(22, 4, 22, 22, 12, 34);
  ctx.bezierCurveTo(18, 24, 14, 16, 8, 20);
  ctx.bezierCurveTo(12, 32, 10, 46, 2, 46);
  ctx.closePath();
  const innerGradient = ctx.createLinearGradient(0, -12, 0, 46);
  innerGradient.addColorStop(0, COLORS.white);
  innerGradient.addColorStop(1, COLORS.pinkSoft);
  ctx.fillStyle = innerGradient;
  ctx.fill();

  ctx.restore();
}

/**
 * Render banner "MANTRA STREAK" -- dipakai sebagai gambar di bawah
 * keterangan panel Daily Check-in. Hasilnya di-cache (statis, tidak
 * tergantung data member manapun) supaya tidak perlu di-render ulang
 * tiap kali command/tombol dipanggil.
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderCheckinBanner({ communityName } = {}) {
  const title = (communityName || 'MANTRA CREATIVE').toUpperCase();
  if (cachedBuffer && cachedTitle === title) return cachedBuffer;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blobLeft = ctx.createRadialGradient(120, HEIGHT / 2, 10, 120, HEIGHT / 2, 240);
  blobLeft.addColorStop(0, 'rgba(255, 47, 156, 0.22)');
  blobLeft.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blobLeft;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blobRight = ctx.createRadialGradient(WIDTH - 100, HEIGHT - 60, 10, WIDTH - 100, HEIGHT - 60, 260);
  blobRight.addColorStop(0, 'rgba(255, 47, 156, 0.16)');
  blobRight.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blobRight;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Panel + border tipis, konsisten dengan kartu-kartu lain
  const panelX = 14;
  const panelY = 14;
  const panelW = WIDTH - 28;
  const panelH = HEIGHT - 28;
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 24);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 47, 156, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Garis aksen diagonal tipis (pengganti blok merah diagonal khas referensi,
  // versi minimalis)
  ctx.save();
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 24);
  ctx.clip();
  const stripGradient = ctx.createLinearGradient(WIDTH, 0, WIDTH - 320, 0);
  stripGradient.addColorStop(0, 'rgba(255, 47, 156, 0.14)');
  stripGradient.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = stripGradient;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.restore();

  // ---- Ikon api ----
  drawFlameIcon(ctx, 150, HEIGHT / 2 + 4, 1.6);

  // ---- Teks ----
  const textX = 260;
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = '700 16px sans-serif';
  ctx.fillText('D A I L Y   C H E C K - I N', textX, HEIGHT / 2 - 34);

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('MANTRA STREAK', textX, HEIGHT / 2 + 16);

  ctx.fillStyle = COLORS.grayDim;
  ctx.font = '600 18px sans-serif';
  ctx.fillText('Check-in tiap hari, jangan sampai putus streak-nya!', textX, HEIGHT / 2 + 50);

  cachedBuffer = await canvas.encode('png');
  cachedTitle = title;
  return cachedBuffer;
}

module.exports = { renderCheckinBanner };
