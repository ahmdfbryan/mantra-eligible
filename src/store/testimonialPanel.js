const { EmbedBuilder } = require('discord.js');
const { COLOR_PINK, DIVIDER, formatRupiah } = require('./storePanel');

/**
 * Embed testimoni yang diposting ke channel testimoni khusus, setelah
 * ticket ditutup dengan status Completed dan buyer mengisi rating+komentar.
 * Semua konten ditaruh di 1 setDescription() (bukan addFields terpisah) --
 * field Discord punya padding/nama sendiri yang bikin jarak kosong antar
 * baris, description polos lebih rapat & konsisten kayak referensi.
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
  communityName,
}) {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, rating)));
  const commentText = comment && comment.trim() ? comment.trim() : '-';

  const description = [
    DIVIDER,
    `» **Buyer** : <@${buyerId}>${buyerUsername ? ` (\`${buyerUsername}\`)` : ''}`,
    `» **Admin Handler** : <@${adminHandlerId}>`,
    DIVIDER,
    `» **Order ID** : #${ticketNumber}`,
    `» **Produk** : ${productLabel}`,
    `» **Harga** : ${formatRupiah(price)}`,
    `» **Rating** : ${stars}`,
    DIVIDER,
    '**Komentar**',
    `\`\`\`${commentText}\`\`\``,
    DIVIDER,
    `🐾 **Total Spend** : ${formatRupiah(totalSpend)}`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`📝 TESTIMONI #${ticketNumber}`)
    .setDescription(description)
    .setThumbnail(buyerAvatarUrl || null);
}

module.exports = { buildTestimonialEmbed };
