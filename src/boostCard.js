const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 360;

// Palet hitam + pink/magenta (sesuai logo MANTRA CREATIVE).
const COLORS = {
  bgTop: '#0a0308',
  bgBottom: '#2b0521',
  panelFill: 'rgba(8, 4, 8, 0.82)',
  pink: '#ff2f9c',
  pinkSoft: '#ff7fc4',
  white: '#ffffff',
  gray: '#d8c9d2',
  grayDim: 'rgba(255,255,255,0.35)',
};

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'mantra-logo.jpg');
let cachedLogoImage = null;

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
 * Ambil gambar dari URL jadi objek Image untuk digambar di canvas.
 * Non-fatal: kalau gagal (network/format), balikin null supaya kartu tetap
 * bisa digambar tanpa avatar.
 */
async function safeLoadImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return await loadImage(buffer);
  } catch (error) {
    console.error('[boostCard] Gagal load gambar dari', url, error.message);
    return null;
  }
}

/**
 * Logo MANTRA CREATIVE dibundel lokal di assets/, di-cache di memori
 * supaya cuma dibaca dari disk sekali.
 */
async function getLogoImage() {
  if (cachedLogoImage) return cachedLogoImage;
  try {
    const buffer = fs.readFileSync(LOGO_PATH);
    cachedLogoImage = await loadImage(buffer);
    return cachedLogoImage;
  } catch (error) {
    console.error('[boostCard] Gagal load logo lokal:', error.message);
    return null;
  }
}

/**
 * Kecilkan ukuran font sampai teksnya pas di lebar maksimum yang tersedia,
 * supaya tidak melewati kotak (misal label "SERVER BOOSTS" di kotak kanan).
 */
function fitFontSize(ctx, text, maxWidth, startSize, minSize, weight = 'bold') {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawGlowRing(ctx, x, y, width, height, radius) {
  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.9)';
  ctx.shadowBlur = 18;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

/**
 * Bokeh/lingkaran cahaya lembut yang tersebar di background, biar kesan
 * "dreamy" seperti referensi (bukan cuma gradient polos).
 */
function drawBokeh(ctx, width, height) {
  const circles = [
    { x: width * 0.06, y: height * 0.18, r: 46, alpha: 0.05 },
    { x: width * 0.03, y: height * 0.75, r: 70, alpha: 0.06 },
    { x: width * 0.22, y: height * 0.85, r: 30, alpha: 0.05 },
    { x: width * 0.42, y: height * 0.12, r: 34, alpha: 0.05 },
    { x: width * 0.6, y: height * 0.85, r: 26, alpha: 0.05 },
    { x: width * 0.82, y: height * 0.2, r: 55, alpha: 0.06 },
    { x: width * 0.95, y: height * 0.65, r: 80, alpha: 0.07 },
    { x: width * 0.7, y: height * 0.5, r: 18, alpha: 0.04 },
  ];

  for (const c of circles) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render kartu "Thank You" untuk server booster baru.
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderBoostCard({ avatarUrl, username, boostNumber, communityName }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ---- Background gradient hitam -> magenta gelap ----
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blob cahaya pink lembut di pojok, biar tidak flat
  const blob1 = ctx.createRadialGradient(120, HEIGHT - 40, 10, 120, HEIGHT - 40, 220);
  blob1.addColorStop(0, 'rgba(255, 47, 156, 0.22)');
  blob1.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob2 = ctx.createRadialGradient(WIDTH - 100, 40, 10, WIDTH - 100, 40, 260);
  blob2.addColorStop(0, 'rgba(255, 47, 156, 0.16)');
  blob2.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawBokeh(ctx, WIDTH, HEIGHT);

  // ---- Panel utama ----
  const panelX = 30;
  const panelY = 30;
  const panelW = WIDTH - 60;
  const panelH = HEIGHT - 60;
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 28);
  ctx.fillStyle = COLORS.panelFill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 47, 156, 0.5)';
  ctx.stroke();

  // ---- Logo MANTRA CREATIVE (pojok kiri atas) ----
  const logoImg = await getLogoImage();
  if (logoImg) {
    const size = 42;
    const gx = panelX + 24;
    const gy = panelY + 20;
    ctx.save();
    roundRectPath(ctx, gx, gy, size, size, 10);
    ctx.clip();
    ctx.drawImage(logoImg, gx, gy, size, size);
    ctx.restore();
    roundRectPath(ctx, gx, gy, size, size, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ---- Avatar booster (kiri) ----
  // Sedikit dikecilkan (dari 170 -> 146) supaya ada jarak jelas dari logo
  // di pojok kiri atas, tidak nempel/nyatu.
  const avatarSize = 146;
  const avatarX = panelX + 40;
  const avatarY = panelY + (panelH - avatarSize) / 2;

  const avatarImg = await safeLoadImage(avatarUrl);
  ctx.save();
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, 24);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  ctx.restore();
  drawGlowRing(ctx, avatarX, avatarY, avatarSize, avatarSize, 24);

  // ---- Teks tengah ----
  const textX = avatarX + avatarSize + 50;

  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = COLORS.pink;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('N E W   S E R V E R   B O O S T E R', textX, panelY + 100);

  ctx.font = 'italic bold 64px sans-serif';
  const thankYouText = 'THANK YOU!';
  const thankYouWidth = ctx.measureText(thankYouText).width;
  const thankYouGradient = ctx.createLinearGradient(textX, 0, textX + thankYouWidth, 0);
  thankYouGradient.addColorStop(0, COLORS.pinkSoft);
  thankYouGradient.addColorStop(0.55, COLORS.white);
  thankYouGradient.addColorStop(1, COLORS.white);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.55)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = thankYouGradient;
  ctx.fillText(thankYouText, textX, panelY + 160);
  ctx.restore();

  ctx.fillStyle = COLORS.gray;
  ctx.font = '30px sans-serif';
  ctx.fillText(username, textX, panelY + 196);

  // garis divider
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, panelY + 216);
  ctx.lineTo(textX + 300, panelY + 216);
  ctx.stroke();

  // ---- Kotak "Server Boosts" (kanan) ----
  const boxW = 190;
  const boxH = 150;
  const boxX = panelX + panelW - boxW - 36;
  const boxY = panelY + (panelH - boxH) / 2;

  roundRectPath(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fillStyle = 'rgba(255, 47, 156, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 47, 156, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.pinkSoft;
  const boostsLabel = 'S E R V E R   B O O S T S';
  const boostsLabelMaxWidth = boxW - 28; // sisakan padding kiri-kanan biar gak nempel garis kotak
  fitFontSize(ctx, boostsLabel, boostsLabelMaxWidth, 16, 9);
  ctx.fillText(boostsLabel, boxX + boxW / 2, boxY + 42);

  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText(String(boostNumber), boxX + boxW / 2, boxY + 112);
  ctx.restore();
  ctx.textAlign = 'left';

  // ---- Watermark nama komunitas (pojok kanan bawah) ----
  if (communityName) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.grayDim;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(communityName.toUpperCase(), panelX + panelW - 24, panelY + panelH - 18);
    ctx.textAlign = 'left';
  }

  return canvas.encode('png');
}

module.exports = { renderBoostCard };
