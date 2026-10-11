const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLOR_PINK = 0xff2f9c;

/**
 * Embed keterangan welcome -- dikirim BERSAMA gambar welcome card (gambar =
 * attachment terpisah lewat setImage, attachmentName harus sama dengan nama
 * file di AttachmentBuilder).
 */
function buildWelcomeEmbed({ member, communityName, memberNumber, attachmentName }) {
  const name = communityName || 'MANTRA CREATIVE';
  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setDescription(
      `Selamat datang, <@${member.id}> di **${name}**!\n` +
        `Kamu member ke **#${memberNumber}**. Pastikan untuk membaca Rules & Guide Server di bawah ini.`
    )
    .setTimestamp(new Date());

  if (attachmentName) {
    embed.setImage(`attachment://${attachmentName}`);
  }

  return embed;
}

/**
 * Tombol link ke channel Rules & channel Take Role (bukan tombol aksi --
 * cuma loncat ke channel yang dimaksud, jadi tidak butuh interaction handler).
 */
function buildWelcomeComponents({ guildId, rulesChannelId, takeRoleChannelId }) {
  const row = new ActionRowBuilder();

  if (rulesChannelId) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('📜 Rules')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${guildId}/${rulesChannelId}`)
    );
  }

  if (takeRoleChannelId) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('🎭 Take Role')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${guildId}/${takeRoleChannelId}`)
    );
  }

  return row;
}

module.exports = { buildWelcomeEmbed, buildWelcomeComponents };
