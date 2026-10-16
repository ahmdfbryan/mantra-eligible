const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLOR_GOLD = 0xf5a623;
const SAWERIA_URL = 'https://saweria.co/mantracreative';

/**
 * Embed info "Gold Donation" -- bagian "Cara Kerja: Ikuti seluruh panduan
 * yang tersedia di channel #how-to-donate" DIHAPUS, karena sekarang
 * tombol donasinya langsung ada di panel ini (tidak perlu pindah channel).
 */
function buildGoldDonationEmbed({ guild, communityName } = {}) {
  const name = communityName || guild?.name || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 256 }) || undefined;

  return new EmbedBuilder()
    .setColor(COLOR_GOLD)
    .setTitle('🪙 Gold Donation')
    .setDescription(
      `Setiap Gold yang kamu berikan adalah dukungan nyata untuk **${name}**. ` +
        'Dari sinilah kami terus mengembangkan komunitas, merawat setiap layanan, dan ' +
        'menghadirkan pembaruan yang lebih baik untuk kalian semua.'
    )
    .addFields(
      {
        name: 'Cara Kerja',
        value:
          '• Setelah donasi kamu berhasil, dukunganmu akan **tercatat sebagai bentuk kontribusi** ' +
          'untuk perkembangan komunitas kami.\n' +
          '• Namamu juga akan **tercatat di leaderboard Gold Donation** sebagai bentuk apresiasi dari kami.',
        inline: false,
      },
      {
        name: 'Terima Kasih',
        value:
          'Setiap dukungan yang kalian berikan, sekecil apa pun, sangat berarti bagi perjalanan kami. ' +
          `Terima kasih sudah menjadi bagian dari komunitas ${name}.`,
        inline: false,
      }
    )
    .setThumbnail(iconURL || null)
    .setFooter({ text: 'Klik tombol di bawah untuk melakukan donasi Gold' });
}

function buildGoldDonationComponents() {
  const donateButton = new ButtonBuilder()
    .setLabel('Gold Donation')
    .setEmoji('🪙')
    .setStyle(ButtonStyle.Link)
    .setURL(SAWERIA_URL);

  return [new ActionRowBuilder().addComponents(donateButton)];
}

module.exports = {
  COLOR_GOLD,
  SAWERIA_URL,
  buildGoldDonationEmbed,
  buildGoldDonationComponents,
};
