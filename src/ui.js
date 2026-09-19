const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SPACER = { name: '​', value: '​', inline: false };

function formatTanggalIndo(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function daysBetween(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Progress bar simpel pakai blok unicode, contoh: ●●●●●●○○○○○○○○ 6/14 hari
 */
function buildProgressBar(current, total, length = 14) {
  const clampedCurrent = Math.max(0, Math.min(current, total));
  const filled = Math.round((clampedCurrent / total) * length);
  const empty = length - filled;
  return `${'●'.repeat(filled)}${'○'.repeat(empty)}  \`${clampedCurrent}/${total} hari\``;
}

function authorConfig(member) {
  return {
    name: `${config.community.name} - Community Verification`,
    iconURL: member?.groupIconUrl || undefined,
    url: config.community.url,
  };
}

/**
 * Embed hasil pengecekan eligibility — fresh & simple:
 * - author: logo bulat komunitas + nama
 * - identitas member ringkas
 * - jarak, lalu Bergabung Sejak & Eligible Pada sebaris (di tampilan desktop)
 * - progress bar
 * - status paling bawah
 */
function buildEligibilityEmbed({ member, eligibilityDays, requestedBy }) {
  const now = new Date();
  const joinedDays = daysBetween(member.joinedAt, now);
  const isEligible = joinedDays >= eligibilityDays;
  const eligibleDate = new Date(member.joinedAt.getTime() + eligibilityDays * MS_PER_DAY);

  const embed = new EmbedBuilder()
    .setAuthor(authorConfig(member))
    .setColor(isEligible ? config.colors.eligible : config.colors.pending)
    .setThumbnail(member.avatarUrl || null)
    .addFields(
      { name: '👤 Username', value: `\`${member.username}\``, inline: true },
      { name: '🏷️ Display Name', value: `\`${member.displayName}\``, inline: true },
      { name: '🆔 ID Roblox', value: `\`${member.id}\``, inline: true },
      SPACER,
      {
        name: '📅 Bergabung Sejak',
        value: `${formatTanggalIndo(member.joinedAt)}\n-# ${joinedDays} hari yang lalu`,
        inline: true,
      },
      {
        name: '🎯 Eligible Pada',
        value: formatTanggalIndo(eligibleDate),
        inline: true,
      },
      {
        name: '📈 Progress',
        value: buildProgressBar(joinedDays, eligibilityDays),
        inline: false,
      },
      {
        name: 'Status',
        value: isEligible
          ? `✅ **Eligible** — sudah memenuhi syarat ${eligibilityDays} hari bergabung.`
          : `⏳ **Belum Eligible** — kurang **${eligibilityDays - joinedDays} hari** lagi.`,
        inline: false,
      }
    )
    .setTimestamp(now)
    .setFooter({ text: requestedBy ? `Diminta oleh ${requestedBy}` : config.community.name });

  return embed;
}

function buildNotMemberEmbed({ username, groupIconUrl, requestedBy }) {
  return new EmbedBuilder()
    .setAuthor(authorConfig({ groupIconUrl }))
    .setTitle(`@${username}`)
    .setColor(config.colors.notMember)
    .setDescription(
      `❌ User ini **belum bergabung** ke komunitas Roblox **${config.community.name}**, atau username salah ketik.`
    )
    .setTimestamp(new Date())
    .setFooter({ text: requestedBy ? `Diminta oleh ${requestedBy}` : config.community.name });
}

function buildErrorEmbed({ title = 'Terjadi Kesalahan', description, requestedBy }) {
  return new EmbedBuilder()
    .setColor(config.colors.error)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp(new Date())
    .setFooter({ text: requestedBy ? `Diminta oleh ${requestedBy}` : config.community.name });
}

function buildProfileButtonRow(profileUrl) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Buka Profil Roblox')
      .setStyle(ButtonStyle.Link)
      .setURL(profileUrl)
      .setEmoji('🔗')
  );
}

module.exports = {
  buildEligibilityEmbed,
  buildNotMemberEmbed,
  buildErrorEmbed,
  buildProfileButtonRow,
  formatTanggalIndo,
  buildProgressBar,
  daysBetween,
};
