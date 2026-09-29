const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const checkinStore = require('./checkinStore');

const BTN_CLAIM = 'checkin_claim';

const COLOR_PINK = 0xff2f9c;

/**
 * Embed panel "Daily Check-in" -- konsep sama seperti referensi Salvatore
 * Streak (judul, deskripsi singkat, "Cara kerja" berupa bullet list, footer
 * "Made by ..." + timestamp), tapi pewarnaan & branding ikut Mantra Creative.
 */
function buildCheckinPanelEmbed(guild, communityName, attachmentName) {
  const name = communityName || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 128 }) || undefined;

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setAuthor({ name, iconURL })
    .setTitle('Daily Check-in')
    .setDescription('Nikmati reward harian yang tersedia untukmu. Tekan tombol di bawah untuk melakukan klaim dan menerima reward.')
    .addFields({
      name: '**Cara Kerja:**',
      value:
        `• Reward dasar: **${checkinStore.BASE_REWARD} XP** per check-in\n` +
        `• Check-in lagi besoknya (dalam ${checkinStore.MIN_HOURS_BETWEEN}-${checkinStore.STREAK_BREAK_HOURS} jam) untuk lanjutkan streak, reward naik **+${checkinStore.STREAK_BONUS} XP** per hari streak\n` +
        `• Reward maksimal: **${checkinStore.MAX_REWARD} XP** per check-in\n` +
        `• Kelewat lebih dari **${checkinStore.STREAK_BREAK_HOURS} jam** tanpa check-in, streak balik ke hari 1\n` +
        `• Klaim baru bisa dilakukan lagi setelah **${checkinStore.MIN_HOURS_BETWEEN} jam** dari check-in terakhir`,
    })
    .setThumbnail(iconURL || null)
    .setFooter({ text: `Made by ${name}` })
    .setTimestamp(new Date());

  if (attachmentName) {
    embed.setImage(`attachment://${attachmentName}`);
  }

  return embed;
}

function buildCheckinPanelComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN_CLAIM).setLabel('Daily Check-in').setEmoji('🔥').setStyle(ButtonStyle.Success)
  );
}

/**
 * Format sisa waktu (ms) jadi teks "X jam Y menit" buat pesan cooldown.
 */
function formatRemaining(ms) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} menit`;
  if (minutes <= 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

module.exports = {
  BTN_CLAIM,
  buildCheckinPanelEmbed,
  buildCheckinPanelComponents,
  formatRemaining,
};
