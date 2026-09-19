const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
 * Progress bar premium pakai blok unicode, contoh: ▰▰▰▰▰▰▱▱▱▱▱▱▱▱ 6/14 hari
 */
function buildProgressBar(current, total, length = 14) {
  const clampedCurrent = Math.max(0, Math.min(current, total));
  const filled = Math.round((clampedCurrent / total) * length);
  const empty = length - filled;
  return `${'▰'.repeat(filled)}${'▱'.repeat(empty)}  \`${clampedCurrent}/${total} hari\``;
}

/**
 * Bangun embed hasil pengecekan eligibility, dengan tampilan "premium":
 * - thumbnail avatar Roblox
 * - author = nama komunitas
 * - warna berbeda tergantung status
 * - progress bar untuk yang belum eligible
 */
function buildEligibilityEmbed({ member, eligibilityDays, requestedBy }) {
  const now = new Date();
  const joinedDays = daysBetween(member.joinedAt, now);
  const isEligible = joinedDays >= eligibilityDays;

  const eligibleDate = new Date(member.joinedAt.getTime() + eligibilityDays * MS_PER_DAY);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Verifikasi Eligibility • ${config.community.name}`,
      url: config.community.url,
    })
    .setTitle(`${member.displayName} (@${member.username})`)
    .setURL(member.profileUrl)
    .setColor(isEligible ? config.colors.eligible : config.colors.pending)
    .addFields(
      { name: '🧾 Username', value: `\`${member.username}\``, inline: true },
      { name: '🏷️ Display Name', value: member.displayName, inline: true },
      { name: '🆔 ID Roblox', value: `\`${member.id}\``, inline: true },
      {
        name: '📅 Bergabung Sejak',
        value: `${formatTanggalIndo(member.joinedAt)}\n-# ${joinedDays} hari yang lalu`,
        inline: false,
      }
    )
    .setThumbnail(member.avatarUrl || null)
    .setTimestamp(now)
    .setFooter({
      text: requestedBy ? `Diminta oleh ${requestedBy}` : config.community.name,
    });

  if (isEligible) {
    embed.addFields({
      name: '✅ Status',
      value: `**Eligible** — sudah memenuhi syarat ${eligibilityDays} hari bergabung.`,
      inline: false,
    });
  } else {
    const remainingDays = eligibilityDays - joinedDays;
    embed.addFields(
      {
        name: '⏳ Status',
        value: `**Belum Eligible** — kurang **${remainingDays} hari** lagi.`,
        inline: false,
      },
      {
        name: '📈 Progress',
        value: buildProgressBar(joinedDays, eligibilityDays),
        inline: false,
      },
      {
        name: '🎯 Eligible Pada',
        value: formatTanggalIndo(eligibleDate),
        inline: false,
      }
    );
  }

  return embed;
}

function buildNotMemberEmbed({ username, requestedBy }) {
  return new EmbedBuilder()
    .setAuthor({ name: `Verifikasi Eligibility • ${config.community.name}` })
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
