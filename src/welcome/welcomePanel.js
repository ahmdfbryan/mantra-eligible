const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLOR_PINK = 0xff2f9c;

/**
 * Embed keterangan welcome -- TIDAK berisi gambar (gambar welcome card
 * dikirim terpisah sebagai attachment biasa, bukan lewat setImage, supaya
 * tidak "nempel" jadi 1 kotak sama teks) dan TIDAK ada footer/timestamp,
 * biar bersih kayak referensi.
 */
function buildWelcomeEmbed({ member, communityName, memberNumber }) {
  const name = communityName || 'MANTRA CREATIVE';
  // Catatan: embed TITLE di Discord tidak bisa resolve mention (<@id> bakal
  // tampil mentah, bukan jadi tag yang bisa diklik), jadi di judul dipakai
  // username polos ("@username"), bukan mention beneran.
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`Selamat datang di ${name}!`)
    .setDescription(
      `Kamu <@${member.id}> member ke **#${memberNumber}**. Pastikan untuk membaca Rules & Guide Server di bawah ini.`
    );
}

/**
 * Embed keterangan goodbye -- gambar goodbye card dikirim terpisah sebagai
 * attachment (sama pola kayak buildWelcomeEmbed). Tidak ada tombol Rules/
 * Take Role di sini (sudah gak relevan buat member yang keluar).
 */
function buildGoodbyeEmbed({ member, communityName, memberCount }) {
  const name = communityName || 'MANTRA CREATIVE';
  const tag = member.user?.tag || member.displayName || 'Seseorang';
  return new EmbedBuilder()
    .setColor(0x6c6c74)
    .setTitle(`Sampai jumpa, ${member.displayName || tag} 👋`)
    .setDescription(`**${tag}** baru saja keluar dari ${name}. Sisa member sekarang: **${memberCount}**.`);
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

module.exports = { buildWelcomeEmbed, buildGoodbyeEmbed, buildWelcomeComponents };
