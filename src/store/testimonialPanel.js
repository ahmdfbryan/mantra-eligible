const { EmbedBuilder } = require('discord.js');
const { COLOR_PINK, DIVIDER, formatRupiah } = require('./storePanel');

/**
 * Embed testimoni yang diposting ke channel testimoni khusus, setelah
 * ticket ditutup dengan status Completed dan buyer mengisi rating+komentar.
 * Layout niru referensi "TESTIMONI 0078" -- tiap baris info pakai bullet
 * "»", dikelompokkan jadi beberapa field dipisah divider tipis.
 */
function buildTestimonialEmbed({
  ticketNumber,
  buyerId,
  buyerUsername,
  adminHandlerId,
  productLabel,
  price,
  rating,
  comment,
  buyerAvatarUrl,
  totalSpend,
}) {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, rating)));
  const commentText = comment && comment.trim() ? comment.trim() : '-';

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`TESTIMONI ${ticketNumber}`)
    .addFields(
      { name: '​', value: DIVIDER },
      {
        name: '​',
        value:
          `» **Buyer** : <@${buyerId}>${buyerUsername ? ` (\`${buyerUsername}\`)` : ''}\n` +
          `» **Admin Handler** : <@${adminHandlerId}>`,
      },
      { name: '​', value: DIVIDER },
      {
        name: '​',
        value: `» **Order ID** : ${ticketNumber}\n» **Produk** : ${productLabel}\n» **Harga** : ${formatRupiah(price)}`,
      },
      { name: '​', value: `» **Rating** : ${stars}` },
      { name: '​', value: DIVIDER },
      { name: '​', value: `**Komentar**\n> ${commentText}` },
      { name: '​', value: DIVIDER },
      { name: '​', value: `🐾 **Total Spend** : ${formatRupiah(totalSpend)}` }
    )
    .setThumbnail(buyerAvatarUrl || null)
    .setTimestamp(new Date());
}

module.exports = { buildTestimonialEmbed };
