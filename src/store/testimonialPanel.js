const { EmbedBuilder } = require('discord.js');
const { COLOR_PINK, DIVIDER, formatRupiah } = require('./storePanel');

/**
 * Embed testimoni yang diposting ke channel testimoni khusus, setelah
 * ticket ditutup dengan status Completed dan buyer mengisi rating+komentar.
 */
function buildTestimonialEmbed({
  ticketNumber,
  buyerId,
  adminHandlerId,
  productLabel,
  price,
  rating,
  comment,
  buyerAvatarUrl,
  totalSpend,
}) {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, rating)));

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`📝 TESTIMONI #${ticketNumber}`)
    .addFields(
      { name: '​', value: DIVIDER },
      { name: 'Buyer', value: `<@${buyerId}>`, inline: true },
      { name: 'Admin Handler', value: `<@${adminHandlerId}>`, inline: true },
      { name: '​', value: DIVIDER },
      { name: 'Order ID', value: `#${ticketNumber}`, inline: true },
      { name: 'Produk', value: productLabel, inline: true },
      { name: 'Harga', value: formatRupiah(price), inline: true },
      { name: 'Rating', value: stars, inline: false },
      { name: '​', value: DIVIDER },
      { name: 'Komentar', value: `\`\`\`${comment && comment.trim() ? comment.trim() : '-'}\`\`\``, inline: false },
      { name: '​', value: DIVIDER },
      { name: 'Total Spend', value: formatRupiah(totalSpend), inline: false }
    )
    .setThumbnail(buyerAvatarUrl || null)
    .setTimestamp(new Date());
}

module.exports = { buildTestimonialEmbed };
