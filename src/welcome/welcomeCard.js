const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 630;

// Palet hitam + pink/magenta MANTRA CREATIVE, sama kayak idCardCanvas.js /
// boostCard.js / levelUpCard.js, biar semua gambar yang dikirim bot kelihatan
// "satu keluarga".
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
    console.error('[welcomeCard] Gagal load gambar dari', url, error.message);
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
    console.error('[welcomeCard] Gagal load logo lokal:', error.message);
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

function drawStatBox(ctx, x, y, w, h, label, value) {
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.fillStyle = COLORS.fieldFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.fieldStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(label.toUpperCase(), x + w / 2, y + 28);

  ctx.fillStyle = COLORS.white;
  ctx.font = '600 21px sans-serif';
  let text = value || '-';
  const maxWidth = w - 28;
  if (ctx.measureText(text).width > maxWidth) {
    while (text.length > 3 && ctx.measureText(text + '…').width > maxWidth) {
      text = text.slice(0, -1);
    }
    text += '…';
  }
  ctx.fillText(text, x + w / 2, y + 56);
  ctx.textAlign = 'left';
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
 * Render kartu "Welcome" buat member baru -- logo+nama komunitas di header,
 * teks besar "WELCOME!", foto profil member yang masuk + nama di bawahnya,
 * lalu baris statistik (member ke-, bergabung, username).
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderWelcomeCard({ avatarUrl, displayName, username, memberNumber, joinedAt, communityName }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob1 = ctx.createRadialGradient(WIDTH / 2, 40, 10, WIDTH / 2, 40, 320);
  blob1.addColorStop(0, 'rgba(255, 47, 156, 0.2)');
  blob1.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob2 = ctx.createRadialGradient(WIDTH / 2, HEIGHT, 10, WIDTH / 2, HEIGHT, 300);
  blob2.addColorStop(0, 'rgba(255, 47, 156, 0.14)');
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

  ctx.save();
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 30);
  ctx.clip();
  const stripGradient = ctx.createLinearGradient(panelX, panelY, panelX + 320, panelY + 6);
  stripGradient.addColorStop(0, COLORS.pink);
  stripGradient.addColorStop(1, 'rgba(255, 47, 156, 0)');
  ctx.fillStyle = stripGradient;
  ctx.fillRect(panelX, panelY, panelW, 6);
  ctx.restore();

  // ---- Header: logo + nama komunitas (kiri atas) ----
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
  ctx.fillText('W E L C O M E   M E M B E R', headerTextX, headerY + 32);

  // ---- Teks besar "WELCOME!" (tengah, di bawah header) ----
  ctx.textAlign = 'center';
  ctx.font = 'italic bold 60px sans-serif';
  const welcomeText = 'WELCOME!';
  const welcomeGradient = ctx.createLinearGradient(
    WIDTH / 2 - 180,
    0,
    WIDTH / 2 + 180,
    0
  );
  welcomeGradient.addColorStop(0, COLORS.pinkSoft);
  welcomeGradient.addColorStop(0.55, COLORS.white);
  welcomeGradient.addColorStop(1, COLORS.white);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 47, 156, 0.55)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = welcomeGradient;
  ctx.fillText(welcomeText, WIDTH / 2, headerY + 112);
  ctx.restore();
  ctx.textAlign = 'left';

  // ---- Avatar member (tengah) ----
  const avatarSize = 160;
  const avatarX = WIDTH / 2 - avatarSize / 2;
  const avatarY = headerY + 140;

  const avatarImg = await safeLoadImage(avatarUrl);
  ctx.save();
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
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
  ctx.shadowBlur = 20;
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  ctx.strokeStyle = COLORS.pink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // ---- Nama member (di bawah avatar) ----
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 30px sans-serif';
  let nameText = displayName || username || '-';
  const nameMaxWidth = panelW - 120;
  if (ctx.measureText(nameText).width > nameMaxWidth) {
    while (nameText.length > 3 && ctx.measureText(nameText + '…').width > nameMaxWidth) {
      nameText = nameText.slice(0, -1);
    }
    nameText += '…';
  }
  const nameY = avatarY + avatarSize + 44;
  ctx.fillText(nameText, WIDTH / 2, nameY);
  ctx.textAlign = 'left';

  // ---- Baris statistik (bawah): member ke-, bergabung, username ----
  const statTop = nameY + 36;
  const statH = 76;
  const gridLeft = panelX + 56;
  const gridRight = panelX + panelW - 56;
  const gridW = gridRight - gridLeft;
  const colGap = 16;
  const colW = (gridW - colGap * 2) / 3;

  drawStatBox(ctx, gridLeft, statTop, colW, statH, 'Member Ke-', `#${memberNumber}`);
  drawStatBox(ctx, gridLeft + colW + colGap, statTop, colW, statH, 'Bergabung', formatDate(joinedAt));
  drawStatBox(ctx, gridLeft + (colW + colGap) * 2, statTop, colW, statH, 'Username', `@${username}`);

  // ---- Teks penutup, di bawah baris statistik ----
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.pinkSoft;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(
    `T E L A H   B E R G A B U N G   D I   ${(communityName || 'MANTRA CREATIVE').toUpperCase().split('').join(' ')}`,
    WIDTH / 2,
    statTop + statH + 38
  );
  ctx.textAlign = 'left';

  return canvas.encode('png');
}

/**
 * Format durasi dari `fromDate` sampai `toDate` jadi teks singkat Indonesia,
 * contoh "3 bulan 12 hari" atau "15 hari" atau "Hari ini".
 */
function formatDuration(fromDate, toDate) {
  if (!fromDate) return '-';
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const to = toDate instanceof Date ? toDate : new Date(toDate);
  if (Number.isNaN(from.getTime())) return '-';

  let totalDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
  if (totalDays <= 0) return 'Hari ini';

  const years = Math.floor(totalDays / 365);
  totalDays -= years * 365;
  const months = Math.floor(totalDays / 30);
  totalDays -= months * 30;
  const days = totalDays;

  const parts = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hari`);

  return parts.slice(0, 2).join(' ');
}

/**
 * Render kartu "Goodbye" buat member yang keluar server -- layout sama
 * kayak renderWelcomeCard (logo, avatar tengah, 3 kotak statistik), cuma
 * teks besar & warna aksennya dibuat lebih "pudar/netral" (bukan pink-putih
 * ngejreng kayak welcome) biar kesannya beda, tapi tetap senada branding.
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderGoodbyeCard({ avatarUrl, displayName, username, memberCount, joinedAt, communityName }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ---- Background (sama kayak welcome, lebih gelap/muram) ----
  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGradient.addColorStop(0, COLORS.bgTop);
  bgGradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob1 = ctx.createRadialGradient(WIDTH / 2, 40, 10, WIDTH / 2, 40, 320);
  blob1.addColorStop(0, 'rgba(120, 120, 130, 0.14)');
  blob1.addColorStop(1, 'rgba(120, 120, 130, 0)');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const blob2 = ctx.createRadialGradient(WIDTH / 2, HEIGHT, 10, WIDTH / 2, HEIGHT, 300);
  blob2.addColorStop(0, 'rgba(255, 47, 156, 0.08)');
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
  ctx.strokeStyle = 'rgba(216, 201, 210, 0.35)';
  ctx.stroke();

  ctx.save();
  roundRectPath(ctx, panelX, panelY, panelW, panelH, 30);
  ctx.clip();
  const stripGradient = ctx.createLinearGradient(panelX, panelY, panelX + 320, panelY + 6);
  stripGradient.addColorStop(0, COLORS.grayDim);
  stripGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = stripGradient;
  ctx.fillRect(panelX, panelY, panelW, 6);
  ctx.restore();

  // ---- Header: logo + nama komunitas (kiri atas) ----
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
  ctx.fillStyle = COLORS.gray;
  ctx.font = '600 13px sans-serif';
  ctx.fillText('M E M B E R   L E A V E', headerTextX, headerY + 32);

  // ---- Teks besar "GOODBYE" (tengah, di bawah header) -- pudar/netral ----
  ctx.textAlign = 'center';
  ctx.font = 'italic bold 56px sans-serif';
  const goodbyeText = 'GOODBYE';
  const goodbyeGradient = ctx.createLinearGradient(WIDTH / 2 - 180, 0, WIDTH / 2 + 180, 0);
  goodbyeGradient.addColorStop(0, COLORS.grayDimmer);
  goodbyeGradient.addColorStop(0.55, COLORS.gray);
  goodbyeGradient.addColorStop(1, COLORS.gray);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = goodbyeGradient;
  ctx.fillText(goodbyeText, WIDTH / 2, headerY + 112);
  ctx.restore();
  ctx.textAlign = 'left';

  // ---- Avatar member (tengah, desaturated-feel lewat border abu) ----
  const avatarSize = 160;
  const avatarX = WIDTH / 2 - avatarSize / 2;
  const avatarY = headerY + 140;

  const avatarImg = await safeLoadImage(avatarUrl);
  ctx.save();
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(216, 201, 210, 0.7)';
  ctx.shadowBlur = 16;
  roundRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  ctx.strokeStyle = COLORS.grayDim;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // ---- Nama member (di bawah avatar) ----
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 30px sans-serif';
  let nameText = displayName || username || '-';
  const nameMaxWidth = panelW - 120;
  if (ctx.measureText(nameText).width > nameMaxWidth) {
    while (nameText.length > 3 && ctx.measureText(nameText + '…').width > nameMaxWidth) {
      nameText = nameText.slice(0, -1);
    }
    nameText += '…';
  }
  const nameY = avatarY + avatarSize + 44;
  ctx.fillText(nameText, WIDTH / 2, nameY);
  ctx.textAlign = 'left';

  // ---- Baris statistik (bawah): lama bergabung, bergabung sejak, sisa member ----
  const statTop = nameY + 36;
  const statH = 76;
  const gridLeft = panelX + 56;
  const gridRight = panelX + panelW - 56;
  const gridW = gridRight - gridLeft;
  const colGap = 16;
  const colW = (gridW - colGap * 2) / 3;

  drawStatBox(ctx, gridLeft, statTop, colW, statH, 'Lama Bergabung', formatDuration(joinedAt, new Date()));
  drawStatBox(ctx, gridLeft + colW + colGap, statTop, colW, statH, 'Bergabung Sejak', formatDate(joinedAt));
  drawStatBox(ctx, gridLeft + (colW + colGap) * 2, statTop, colW, statH, 'Sisa Member', `${memberCount}`);

  // ---- Teks penutup, di bawah baris statistik ----
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gray;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(
    `T E L A H   M E N I N G G A L K A N   ${(communityName || 'MANTRA CREATIVE').toUpperCase().split('').join(' ')}`,
    WIDTH / 2,
    statTop + statH + 38
  );
  ctx.textAlign = 'left';

  return canvas.encode('png');
}

module.exports = { renderWelcomeCard, renderGoodbyeCard };
