const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const ExcelJS = require('exceljs');
const { formatTanggalIndo } = require('../ui');

const COLOR_PINK = 0xff2f9c;
const PAGE_SIZE = 10;

const BTN_PREV = 'memberlist_prev';
const BTN_NEXT = 'memberlist_next';
const BTN_DOWNLOAD = 'memberlist_download';

function encodeCustomId(action, page) {
  return `${action}:${page}`;
}

function decodeCustomId(customId) {
  const [action, pageRaw] = customId.split(':');
  return { action, page: Number(pageRaw) || 0 };
}

// Request opcode 8 (Request Guild Members) ke gateway Discord dibatasi
// cukup ketat, apalagi tipe "ambil semua member tanpa query" kayak di
// sini -- kalau dipanggil berkali-kali dalam waktu singkat (misal admin
// coba /member-list berulang), cooldown-nya makin lama tiap kali kena
// limit. Makanya hasil fetch di-cache per guild beberapa menit, supaya
// command/tombol yang dipanggil berdekatan nggak nembak ulang ke gateway.
const GUILD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit
const guildMemberCache = new Map(); // guildId -> { members, fetchedAt }

/**
 * Ambil & urutkan semua member guild (berdasarkan tanggal join, paling
 * lama di atas). Hasilnya di-cache per guild selama GUILD_CACHE_TTL_MS --
 * panggilan berikutnya dalam rentang itu pakai cache, nggak fetch ulang ke
 * gateway. Set `forceRefresh: true` untuk sengaja ambil data paling baru
 * (dipakai command /member-list biar nggak nampilin data basi terus).
 */
async function fetchMemberSnapshot(guild, { forceRefresh = false } = {}) {
  const cached = guildMemberCache.get(guild.id);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < GUILD_CACHE_TTL_MS) {
    return cached.members;
  }

  let members;
  try {
    members = await guild.members.fetch();
  } catch (error) {
    // Lagi kena rate-limit opcode 8 dari Discord -- daripada gagal total,
    // mending pakai cache lama (biarpun basi) kalau ada, ketimbang bikin
    // command/tombolnya error ke user.
    if (cached) {
      console.warn('[member-list] Gagal fetch ulang (rate-limit?), pakai cache lama:', error.message);
      return cached.members;
    }
    throw error;
  }

  const snapshot = members
    .filter((member) => !member.user.bot)
    .map((member) => ({
      id: member.id,
      tag: member.user.tag,
      displayName: member.displayName,
      joinedTimestamp: member.joinedTimestamp,
    }))
    .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0));

  guildMemberCache.set(guild.id, { members: snapshot, fetchedAt: Date.now() });
  return snapshot;
}

function totalPagesFor(members) {
  return Math.max(1, Math.ceil(members.length / PAGE_SIZE));
}

function clampPage(page, totalPages) {
  return Math.min(Math.max(page, 0), totalPages - 1);
}

/**
 * Panel "Daftar Member" -- Components V2 (card custom), list member di
 * halaman tertentu + tombol Prev/Next (otomatis terkunci di ujung-ujung
 * halaman) dan tombol Download (ambil daftar lengkap sebagai file .txt).
 */
function buildMemberListPanel({ guild, members, page, communityName }) {
  const name = communityName || guild?.name || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 256 }) || undefined;
  const totalPages = totalPagesFor(members);
  const safePage = clampPage(page, totalPages);

  const start = safePage * PAGE_SIZE;
  const pageMembers = members.slice(start, start + PAGE_SIZE);

  const listText =
    pageMembers.length > 0
      ? pageMembers
          .map((member, index) => {
            const number = start + index + 1;
            const joined = member.joinedTimestamp ? formatTanggalIndo(new Date(member.joinedTimestamp)) : 'Tidak diketahui';
            return `**${number}.** ${member.displayName} (\`${member.tag}\`)\n　└ Bergabung: ${joined}`;
          })
          .join('\n')
      : 'Belum ada member di halaman ini.';

  const container = new ContainerBuilder().setAccentColor(COLOR_PINK);

  // SectionBuilder WAJIB punya accessory (thumbnail/button) -- kalau guild
  // kebetulan nggak punya icon, jangan pakai Section sama sekali (fallback
  // ke TextDisplay polos) daripada bikin pesan ini gagal terkirim.
  if (iconURL) {
    const headerSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 👥 Daftar Member ${name}`),
        new TextDisplayBuilder().setContent(`Total Member: **${members.length.toLocaleString('id-ID')}**`)
      )
      .setThumbnailAccessory((thumbnail) => thumbnail.setURL(iconURL).setDescription(name));
    container.addSectionComponents(headerSection);
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 👥 Daftar Member ${name}`),
      new TextDisplayBuilder().setContent(`Total Member: **${members.length.toLocaleString('id-ID')}**`)
    );
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(listText));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`📄 Halaman **${safePage + 1}** dari **${totalPages}**`)
  );

  const prevButton = new ButtonBuilder()
    .setCustomId(encodeCustomId(BTN_PREV, safePage))
    .setLabel('Sebelumnya')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(safePage <= 0);

  const nextButton = new ButtonBuilder()
    .setCustomId(encodeCustomId(BTN_NEXT, safePage))
    .setLabel('Selanjutnya')
    .setEmoji('▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(safePage >= totalPages - 1);

  const downloadButton = new ButtonBuilder()
    .setCustomId(encodeCustomId(BTN_DOWNLOAD, safePage))
    .setLabel('Download Daftar')
    .setEmoji('📥')
    .setStyle(ButtonStyle.Success);

  container.addActionRowComponents(new ActionRowBuilder().addComponents(prevButton, nextButton, downloadButton));

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Bikin file Excel (.xlsx) berisi daftar LENGKAP member (bukan cuma 1
 * halaman) -- dikirim ephemeral ke orang yang klik tombol Download.
 */
async function buildMemberListFile(members, guildName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = guildName || 'Mantra Creative Bot';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Daftar Member');
  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nama Tampilan', key: 'displayName', width: 28 },
    { header: 'Username', key: 'tag', width: 24 },
    { header: 'User ID', key: 'id', width: 22 },
    { header: 'Tanggal Bergabung', key: 'joined', width: 24 },
  ];

  // Header row -- bold putih di atas warna pink senada branding Mantra Creative.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF2F9C' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  members.forEach((member, index) => {
    const joined = member.joinedTimestamp ? formatTanggalIndo(new Date(member.joinedTimestamp)) : 'Tidak diketahui';
    sheet.addRow({
      no: index + 1,
      displayName: member.displayName,
      tag: member.tag,
      id: member.id,
      joined,
    });
  });

  // Selang-seling warna baris biar enak dibaca (striped rows).
  for (let rowNumber = 2; rowNumber <= members.length + 1; rowNumber += 1) {
    if (rowNumber % 2 === 0) {
      sheet.getRow(rowNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF0F8' } };
    }
  }

  sheet.getColumn('no').alignment = { horizontal: 'center' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = (guildName || 'server').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return new AttachmentBuilder(Buffer.from(buffer), { name: `daftar-member-${safeName || 'server'}.xlsx` });
}

module.exports = {
  PAGE_SIZE,
  BTN_PREV,
  BTN_NEXT,
  BTN_DOWNLOAD,
  encodeCustomId,
  decodeCustomId,
  fetchMemberSnapshot,
  totalPagesFor,
  clampPage,
  buildMemberListPanel,
  buildMemberListFile,
};
