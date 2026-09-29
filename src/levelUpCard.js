const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 360;

// Palet sama seperti boostCard.js / idCardCanvas.js -- hitam + pink/magenta
// sesuai logo MANTRA CREATIVE, supaya semua kartu bot ini "satu keluarga".
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

const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'mantra-logo.jpg');
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

async function safeLoadImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return await loadImage(buffer);
  } catch (error) {
    console.error('[levelUpCard] Gagal load gambar dari', url, error.message);
    return null;
  }
}

async function getLogoImage() {
  if (cachedLogoImage) return cachedLogoImage;
  try {
    const buffer = fs.readFileSync(LOGO_PATH);
    cachedLogoImage = await loadImage(buffer);
    return cachedLogoImage;
  } catch (error) {
    console.error('[levelUpCard] Gagal load logo lokal:', error.message);
    return null;
  }
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

function drawBokeh(ctx, width, height) {
  const circles = [
    { x: width * 0.06, y: height * 0.18, r: 46, alpha: 0.05 },
    { x: width * 0.03, y: height * 0.75, r: 70, alpha: 0.06 },
    { x: width * 0.82, y: height * 0.2, r: 55, alpha: 0.06 },
    { x: width * 0.95, y: height * 0.65, r: 80, alpha: 0.07 },
  ];
  for (const c of circles) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fitFontSize(ctx, text, maxWidth, startSize, minSize, weight = 'bold') {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

/**
 * Render kartu pengumuman "LEVEL UP!" (mirip boostCard.js tapi buat momen
 * naik level, bukan boost server).
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderLevelUpCard({ avatarUrl, username, level, communityName }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
  }

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

  const textX = avatarX + avatarSize + 50;

  ctx.fillStyle = COLORS.pink;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('L E V E L   U P !', textX, panelY + 100);

  ctx.font = 'italic bold 60px sans-serif';
  const titleText = `Selamat, ${username}!`;
  let titleSize = fitFontSize(ctx, titleText, panelW - (textX - panelX) - 260, 60, 34, 'italic bold');
  ctx.font = `italic bold ${titleSize}px sans-serif`;
  const titleWidth = ctx.measureText(titleText).width;
  const titleGradient = ctx.createLinearGradient(textX, 0, textX + titleWidth, 0);
  titleGradient.addColorStop(0, COLORS.pinkSoft);
  titleGradient.addColorStop(0.55, COLORS.white);
  titleGradient.addColorStop(1, COLORS.white);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.55)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = titleGradient;
  ctx.fillText(titleText, textX, panelY + 160);
  ctx.restore();

  ctx.fillStyle = COLORS.gray;
  ctx.font = '28px sans-serif';
  ctx.fillText('Kamu naik level di server!', textX, panelY + 196);

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, panelY + 216);
  ctx.lineTo(textX + 300, panelY + 216);
  ctx.stroke();

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
  const levelLabel = 'L E V E L';
  fitFontSize(ctx, levelLabel, boxW - 28, 16, 9);
  ctx.fillText(levelLabel, boxX + boxW / 2, boxY + 42);

  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText(String(level), boxX + boxW / 2, boxY + 112);
  ctx.restore();
  ctx.textAlign = 'left';

  if (communityName) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.grayDim;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(communityName.toUpperCase(), panelX + panelW - 24, panelY + panelH - 18);
    ctx.textAlign = 'left';
  }

  return canvas.encode('png');
}

module.exports = { renderLevelUpCard };
