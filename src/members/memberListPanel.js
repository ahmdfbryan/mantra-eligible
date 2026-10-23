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
const { getGuildMembers } = require('../member-cache');

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

/**
 * Ambil & urutkan member non-bot sebuah guild -- datanya dibaca dari
 * cache di memori (lihat ../member-cache.js), yang cuma fetch ke Discord
 * SEKALI (saat prime pertama kali) dan setelahnya ter-update otomatis
 * lewat event gateway. Jadi fungsi ini TIDAK PERNAH bikin request baru
 * ke Discord di luar prime pertama itu -- aman dari rate-limit opcode 8.
 */
async function fetchMemberSnapshot(guild) {
  const entries = await getGuildMembers(guild);
  return entries
    .filter((entry) => !entry.bot)
    .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0));
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
