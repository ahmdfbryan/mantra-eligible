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

/**
 * Ambil & urutkan semua member guild (berdasarkan tanggal join, paling
 * lama di atas) -- dipanggil sekali waktu command /member-list dijalankan,
 * hasilnya di-"snapshot" supaya tombol Next/Prev/Download berikutnya nggak
 * perlu fetch ulang & urutannya konsisten selama panel itu masih ada.
 */
async function fetchMemberSnapshot(guild) {
  const members = await guild.members.fetch();
  return members
    .map((member) => ({
      id: member.id,
      tag: member.user.tag,
      displayName: member.displayName,
      bot: member.user.bot,
      joinedTimestamp: member.joinedTimestamp,
    }))
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
            const botTag = member.bot ? ' `BOT`' : '';
            return `**${number}.** ${member.displayName} (\`${member.tag}\`)${botTag}\n　└ Bergabung: ${joined}`;
          })
          .join('\n')
      : 'Belum ada member di halaman ini.';

  const container = new ContainerBuilder().setAccentColor(COLOR_PINK);

  const headerSection = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## 👥 Daftar Member ${name}`),
    new TextDisplayBuilder().setContent(`Total Member: **${members.length.toLocaleString('id-ID')}**`)
  );
  if (iconURL) {
    headerSection.setThumbnailAccessory((thumbnail) => thumbnail.setURL(iconURL).setDescription(name));
  }
  container.addSectionComponents(headerSection);

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
 * Bikin file .txt berisi daftar LENGKAP member (bukan cuma 1 halaman) --
 * dikirim ephemeral ke orang yang klik tombol Download.
 */
function buildMemberListFile(members, guildName) {
  const header = `Daftar Member ${guildName || 'Server'} -- Total: ${members.length}\nDiexport pada: ${formatTanggalIndo(new Date())}\n${'='.repeat(60)}\n\n`;
  const lines = members.map((member, index) => {
    const joined = member.joinedTimestamp ? formatTanggalIndo(new Date(member.joinedTimestamp)) : 'Tidak diketahui';
    const botTag = member.bot ? ' [BOT]' : '';
    return `${index + 1}. ${member.displayName} (${member.tag}) [ID: ${member.id}]${botTag} -- Bergabung: ${joined}`;
  });

  const content = header + lines.join('\n') + '\n';
  const safeName = (guildName || 'server').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: `daftar-member-${safeName || 'server'}.txt` });
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
