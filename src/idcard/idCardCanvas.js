const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 580;

// Palet hitam + pink/magenta MANTRA CREATIVE (sama seperti boostCard.js /
// panel musik), supaya semua kartu/embed bot ini kelihatan "satu keluarga".
const COLORS = {
  bgTop: '#0a0308',
  bgBottom: '#2b0521',
  panelFill: 'rgba(8, 4, 8, 0.86)',
  fieldFill: 'rgba(255, 47, 156, 0.07)',
  fieldStroke: 'rgba(255, 47, 156, 0.35)',
  pink: '#ff2f9c',
  pinkSoft: '#ff7fc4',
  white: '#ffffff',
  gray: '#d8c9d2',
  grayDim: 'rgba(255,255,255,0.4)',
  grayDimmer: 'rgba(255,255,255,0.22)',
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
    console.error('[idCardCanvas] Gagal load gambar dari', url, error.message);
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
    console.error('[idCardCanvas] Gagal load logo lokal:', error.message);
    return null;
  }
}

function drawBokeh(ctx, width, height) {
  const circles = [
    { x: width * 0.05, y: height * 0.15, r: 50, alpha: 0.05 },
    { x: width * 0.04, y: height * 0.8, r: 70, alpha: 0.06 },
    { x: width * 0.9, y: height * 0.12, r: 60, alpha: 0.06 },
    { x: width * 0.97, y: height * 0.7, r: 90, alpha: 0.07 },
    { x: width * 0.55, y: height * 0.06, r: 24, alpha: 0.04 },
  ];
  for (const c of circles) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Kotak field label+value ala "kartu digital modern" (bukan list vertikal
 * seperti kartu ID konvensional) -- dua kolom grid, tiap kotak punya
 * background & border pink transparan sendiri.
 */
function drawFieldBox(ctx, x, y, w, h, label, value) {
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.fillStyle = COLORS.fieldFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.fieldStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(label.toUpperCase(), x + 18, y + 26);

  ctx.fillStyle = COLORS.white;
  ctx.font = '600 22px sans-serif';
  let text = value || '-';
  const maxWidth = w - 36;
  if (ctx.measureText(text).width > maxWidth) {
    while (text.length > 3 && ctx.measureText(text + '…').width > maxWidth) {
      text = text.slice(0, -1);
    }
    text += '…';
  }
  ctx.fillText(text, x + 18, y + 54);
}

/**
 * Progress bar XP menuju level berikutnya, ditaruh di bawah avatar.
 */
function drawXpBar(ctx, x, y, w, h, ratio) {
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  const fillWidth = Math.max(h, w * Math.min(1, Math.max(0, ratio)));
  roundRectPath(ctx, x, y, fillWidth, h, h / 2);
  const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
  gradient.addColorStop(0, COLORS.pink);
  gradient.addColorStop(1, COLORS.pinkSoft);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function formatDate(value) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Render "MANTRA CREATIVE ID Card" -- desain baru/modern (grid 2 kolom +
 * progress bar level), bukan jiplakan tata letak kartu ID konvensional.
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderIdCard({
  avatarUrl,
  idNo,
  nama,
  jenisKelamin,
  domisili,
  citaCita,
  hobi,
  joinedAt,
  createdAt,
  level,
  xpIntoLevel,
  xpForNextLevel,
  totalXp,
  rank,
  totalRanked,
  communityName,
}) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob1 = ctx.createRadialGradient(80, 60, 10, 80, 60, 260);
  blob1.addColorStop(0, 'rgba(255, 47, 156, 0.2)');
  blob1.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob2 = ctx.createRadialGradient(WIDTH - 80, HEIGHT - 60, 10, WIDTH - 80, HEIGHT - 60, 280);
  blob2.addColorStop(0, 'rgba(255, 47, 156, 0.16)');
  blob2.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawBokeh(ctx, WIDTH, HEIGHT);

  // ---- Panel utama ----
  const panelX = 28;
  const panelY = 28;
  const panelW = WIDTH - 56;
  const panelH = HEIGHT - 56;
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 30);
  ctx.fillStyle = COLORS.panelFill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 47, 156, 0.5)';
  ctx.stroke();

  // Aksen strip diagonal tipis di kiri atas (pengganti "ribbon" khas kartu
  // ID biasa, tapi versi minimalis/modern -- cuma garis gradient, bukan blok).
  ctx.save();
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 30);
  ctx.clip();
  const stripGradient = ctx.createLinearGradient(panelX, panelY, panelX + 260, panelY + 6);
  stripGradient.addColorStop(0, COLORS.pink);
  stripGradient.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = stripGradient;
  ctx.fillRect(panelX, panelY, panelW, 6);
  ctx.restore();

  // ---- Header: logo + judul + ID No ----
  const headerY = panelY + 34;
  const logoImg = await getLogoImage();
  let headerTextX = panelX + 36;
  if (logoImg) {
    const size = 44;
    const gx = panelX + 36;
    const gy = headerY - 8;
    ctx.save();
    roundRectPath(ctx, gx, gy, size, size, 10);
    ctx.clip();
    ctx.drawImage(logoImg, gx, gy, size, size);
    ctx.restore();
    headerTextX = gx + size + 16;
  }

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText((communityName || 'MANTRA CREATIVE').toUpperCase(), headerTextX, headerY + 14);
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = '600 13px sans-serif';
  ctx.fillText('D I G I T A L   M E M B E R   I D', headerTextX, headerY + 32);

  // ID number, pojok kanan atas, gaya pill monospace
  const idText = `ID-${idNo}`;
  ctx.font = 'bold 18px monospace';
  const idTextWidth = ctx.measureText(idText).width;
  const pillW = idTextWidth + 36;
  const pillH = 36;
  const pillX = panelX + panelW - 36 - pillW;
  const pillY = headerY - 10;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(255, 47, 156, 0.14)';
  ctx.fill();
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.fillText(idText, pillX + 18, pillY + 24);

  // Garis pembatas header
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + 36, headerY + 56);
  ctx.lineTo(panelX + panelW - 36, headerY + 56);
  ctx.stroke();

  // ---- Kolom kiri: avatar + nama + level ----
  const bodyTop = headerY + 90;
  const avatarSize = 210;
  const avatarX = panelX + 56;
  const avatarY = bodyTop;

  const avatarImg = await safeLoadImage(avatarUrl);
  ctx.save();
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, 28);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.9)';
  ctx.shadowBlur = 18;
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, 28);
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Badge level, ngambang di pojok kanan bawah avatar
  const badgeR = 34;
  const badgeCx = avatarX + avatarSize - 6;
  const badgeCy = avatarY + avatarSize - 6;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.8)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bgTop;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.pink;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.grayDim;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('LVL', badgeCx, badgeCy - 6);
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(String(level), badgeCx, badgeCy + 16);
  ctx.textAlign = 'left';

  // Nama di bawah avatar
  const nameY = avatarY + avatarSize + 44;
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 30px sans-serif';
  let displayName = nama || '-';
  const nameMaxWidth = avatarSize + 20;
  if (ctx.measureText(displayName).width > nameMaxWidth) {
    while (displayName.length > 3 && ctx.measureText(displayName + '…').width > nameMaxWidth) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '…';
  }
  ctx.fillText(displayName, avatarX, nameY);

  // XP bar menuju level berikutnya
  const xpRatio = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;
  const xpBarY = nameY + 20;
  drawXpBar(ctx, avatarX, xpBarY, avatarSize, 10, xpRatio);
  ctx.fillStyle = COLORS.grayDim;
  ctx.font = '600 12px sans-serif';
  ctx.fillText(`${xpIntoLevel} / ${xpForNextLevel} XP`, avatarX, xpBarY + 28);

  // ---- Kolom kanan: grid 2x2 field ----
  const gridX = avatarX + avatarSize + 48;
  const gridRight = panelX + panelW - 56;
  const gridW = gridRight - gridX;
  const colGap = 16;
  const colW = (gridW - colGap) / 2;
  const rowH = 74;
  const rowGap = 16;
  const gridTop = bodyTop;

  drawFieldBox(ctx, gridX, gridTop, colW, rowH, 'Jenis Kelamin', jenisKelamin);
  drawFieldBox(ctx, gridX + colW + colGap, gridTop, colW, rowH, 'Domisili', domisili);
  drawFieldBox(ctx, gridX, gridTop + rowH + rowGap, colW, rowH, 'Cita-cita', citaCita);
  drawFieldBox(ctx, gridX + colW + colGap, gridTop + rowH + rowGap, colW, rowH, 'Hobi', hobi);

  // ---- Statistik aktivitas: ranking level & total XP (baris ke-3 grid, tepat di bawah Cita-cita/Hobi) ----
  const statY = gridTop + (rowH + rowGap) * 2;
  const statH = rowH;
  const statColW = colW;

  roundRectPath(ctx, gridX, statY, statColW, statH, 14);
  ctx.fillStyle = COLORS.fieldFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.fieldStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RANKING SERVER', gridX + 18, statY + 26);
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 22px sans-serif';
  const rankText = rank ? `#${rank}` : '-';
  ctx.fillText(rankText, gridX + 18, statY + 54);
  if (totalRanked) {
    const rankTextWidth = ctx.measureText(rankText).width;
    ctx.fillStyle = COLORS.grayDim;
    ctx.font = '600 13px sans-serif';
    ctx.fillText(`dari ${totalRanked} member`, gridX + 18 + rankTextWidth + 10, statY + 54);
  }

  const statCol2X = gridX + statColW + colGap;
  roundRectPath(ctx, statCol2X, statY, statColW, statH, 14);
  ctx.fillStyle = COLORS.fieldFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.fieldStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TOTAL XP', statCol2X + 18, statY + 26);
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(Number(totalXp || 0).toLocaleString('id-ID'), statCol2X + 18, statY + 54);

  // ---- Footer kanan: join server & dibuat tanggal (di bawah statistik) ----
  const footerY = statY + statH + rowGap + 34;
  const footerColW = (gridW - colGap) / 2;

  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('JOIN SERVER', gridX, footerY);
  ctx.fillStyle = COLORS.gray;
  ctx.font = '600 18px sans-serif';
  ctx.fillText(formatDate(joinedAt), gridX, footerY + 24);

  const footerCol2X = gridX + footerColW + colGap;
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('DIBUAT TANGGAL', footerCol2X, footerY);
  ctx.fillStyle = COLORS.gray;
  ctx.font = '600 18px sans-serif';
  ctx.fillText(formatDate(createdAt), footerCol2X, footerY + 24);

  // ---- Watermark komunitas ----
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.grayDimmer;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText((communityName || 'MANTRA CREATIVE').toUpperCase(), panelX + panelW - 36, panelY + panelH - 24);
  ctx.textAlign = 'left';

  return canvas.encode('png');
}

module.exports = { renderIdCard };
