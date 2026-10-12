const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { COLOR_PINK, DIVIDER, formatRupiah } = require('./storePanel');

const BTN_CLOSE_TICKET = 'store_ticket_close';
const CLOSE_REASON_SELECT_ID = 'store_ticket_close_reason';

const CLOSE_REASON_LABELS = {
  completed: { label: 'Completed - Produk berhasil dikirim', emoji: '✅' },
  cancelled: { label: 'Cancelled - Dibatalkan', emoji: '❌' },
  refund: { label: 'Refund - Dana dikembalikan', emoji: '💸' },
};

const TESTIMONIAL_RATING_SELECT_ID = 'store_testimonial_rating';
const BTN_TESTIMONIAL_SKIP = 'store_testimonial_skip';
const TESTIMONIAL_COMMENT_MODAL_ID = 'store_testimonial_comment_modal';
const TESTIMONIAL_COMMENT_INPUT_ID = 'store_testimonial_comment_input';

const BTN_DM_OPEN_TICKET = 'store_dm_open_ticket'; // tidak dipakai langsung (link button), disimpan untuk referensi id

/**
 * Embed utama di dalam channel ticket -- info pesanan + username Roblox.
 */
function buildTicketEmbed({ ticketNumber, buyerId, robloxUsername, robuxAmount, price, status }) {
  const statusLabel =
    status === 'open'
      ? '🟡 Menunggu Pembayaran'
      : status === 'completed'
        ? '✅ Completed'
        : status === 'cancelled'
          ? '❌ Cancelled'
          : status === 'refund'
            ? '💸 Refund'
            : status;

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`🎫 Ticket Order #${ticketNumber}`)
    .setDescription(
      `Halo <@${buyerId}>, terima kasih sudah order! Silakan selesaikan pembayaran dan tunggu staff memproses pesanan kamu.\n${DIVIDER}`
    )
    .addFields(
      { name: 'Buyer', value: `<@${buyerId}>`, inline: true },
      { name: 'Produk', value: 'Robux', inline: true },
      { name: 'Status', value: statusLabel, inline: true },
      { name: 'Username Roblox', value: `\`${robloxUsername}\``, inline: true },
      { name: 'Jumlah Robux', value: `💎 ${robuxAmount} Robux`, inline: true },
      { name: 'Harga', value: `${formatRupiah(price)}`, inline: true }
    )
    .setFooter({ text: `Order ID: #${ticketNumber}` })
    .setTimestamp(new Date());
}

function buildTicketComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(BTN_CLOSE_TICKET).setLabel('Tutup Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
    ),
  ];
}

function buildCloseReasonComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId(CLOSE_REASON_SELECT_ID)
    .setPlaceholder('Pilih alasan penutupan ticket...')
    .addOptions(
      Object.entries(CLOSE_REASON_LABELS).map(([value, meta]) =>
        new StringSelectMenuOptionBuilder().setLabel(meta.label).setValue(value).setEmoji(meta.emoji)
      )
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildTestimonialPromptEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('⭐ Berikan Testimoni')
    .setDescription(
      'Pesanan kamu sudah **Completed**! Boleh kasih rating & testimoni singkat? Testimoni kamu bakal dipajang di channel testimoni kami 🙏\n\nPilih rating bintang di bawah, atau klik **Lewati** kalau tidak ingin memberi testimoni.'
    );
}

function buildTestimonialRatingComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId(TESTIMONIAL_RATING_SELECT_ID)
    .setPlaceholder('Pilih rating bintang...')
    .addOptions(
      [5, 4, 3, 2, 1].map((n) =>
        new StringSelectMenuOptionBuilder().setLabel('⭐'.repeat(n)).setValue(String(n))
      )
    );

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(BTN_TESTIMONIAL_SKIP).setLabel('Lewati').setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function buildTestimonialCommentModal() {
  const commentInput = new TextInputBuilder()
    .setCustomId(TESTIMONIAL_COMMENT_INPUT_ID)
    .setLabel('Komentar kamu')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Ceritain pengalaman beli di sini...')
    .setMaxLength(500)
    .setRequired(false);

  return new ModalBuilder()
    .setCustomId(TESTIMONIAL_COMMENT_MODAL_ID)
    .setTitle('Tulis Testimoni')
    .addComponents(new ActionRowBuilder().addComponents(commentInput));
}

/**
 * Embed DM ke buyer begitu ticket berhasil dibuat.
 */
function buildTicketDmEmbed({ communityName, ticketNumber, productLabel }) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('✅ Ticket Order Berhasil Dibuat')
    .setDescription(
      `Ticket order kamu di **${communityName}** sudah berhasil dibuat.\n\nSilakan lanjutkan ke channel ticket kamu untuk menyelesaikan pembayaran:`
    )
    .addFields(
      { name: 'Produk', value: productLabel, inline: true },
      { name: 'Ticket ID', value: `#${ticketNumber}`, inline: true }
    );
}

function buildTicketDmComponents(channelUrl) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Buka Ticket').setStyle(ButtonStyle.Link).setURL(channelUrl).setEmoji('🎫')
    ),
  ];
}

module.exports = {
  BTN_CLOSE_TICKET,
  CLOSE_REASON_SELECT_ID,
  CLOSE_REASON_LABELS,
  TESTIMONIAL_RATING_SELECT_ID,
  BTN_TESTIMONIAL_SKIP,
  TESTIMONIAL_COMMENT_MODAL_ID,
  TESTIMONIAL_COMMENT_INPUT_ID,
  buildTicketEmbed,
  buildTicketComponents,
  buildCloseReasonComponents,
  buildTestimonialPromptEmbed,
  buildTestimonialRatingComponents,
  buildTestimonialCommentModal,
  buildTicketDmEmbed,
  buildTicketDmComponents,
};
