const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const config = require('../config');
const ticketStore = require('./ticketStore');

const COLOR_PINK = 0xff2f9c;
// Lebih pendek dari divider di panel lain (rolePanel.js dkk) -- yang versi
// 25 karakter kepotong jadi 2 baris di layar HP (lebar sempit), ini aman di
// HP maupun PC.
const DIVIDER = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

const PRODUCT_SELECT_ID = 'store_product_select';
const PRODUCT_ROBUX = 'robux';
const PRODUCT_COMING_SOON = 'coming_soon';

// Emoji custom server buat ikon Robux (ganti emoji unicode 💎 di seluruh
// panel Store/Ticket). Nama HARUS persis sama kayak nama emoji aslinya di
// server supaya Discord bisa resolve gambarnya.
const ROBUX_EMOJI = { id: config.store.robuxEmoji.id, name: config.store.robuxEmoji.name };

function robuxEmojiTag() {
  return ROBUX_EMOJI.id ? `<:${ROBUX_EMOJI.name}:${ROBUX_EMOJI.id}>` : '💎';
}

function formatRupiah(amount) {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

/**
 * Harga linear: rate per 100 Robux dikali kelipatannya.
 */
function priceForRobux(amount, ratePer100) {
  return Math.round((amount / 100) * ratePer100);
}

/**
 * Teks "Total Transaksi" + "Rating Toko" (rata-rata dari semua testimoni
 * yang masuk) -- dihitung ulang tiap kali panel Store dibangun/di-refresh.
 */
function buildStoreStatsText() {
  const completedCount = ticketStore.getCompletedCount();
  const { average, count: ratingCount } = ticketStore.getAverageRating();

  const ratingText = ratingCount > 0 ? `${average.toFixed(1)}/5 (${ratingCount} testimoni)` : 'Belum ada rating';

  return `**Total Transaksi** : ${completedCount}\n**Rating Toko** : ${ratingText}`;
}

/**
 * Panel utama "Store" -- info toko, tata cara pembelian, dan status
 * buka/tutup yang auto-refresh begitu admin jalankan /toko-buka atau
 * /toko-tutup (embed yang sama di-edit ulang, bukan dikirim pesan baru).
 */
function buildStorePanelEmbed({ guild, communityName, open, attachmentName }) {
  const name = communityName || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 128 }) || undefined;

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('🛍️ MANTRA CREATIVE STORE')
    .setDescription(
      `Selamat datang di **${name} Store** -- tempat resmi buat top up & beli produk digital komunitas kami.\n${DIVIDER}`
    )
    .addFields(
      {
        name: '🛒 Cara Pembelian',
        value:
          '1️⃣ Pilih produk di dropdown di bawah\n' +
          '2️⃣ Ikuti proses verifikasi (khusus Robux: masukkan username Roblox kamu)\n' +
          '3️⃣ Pilih jumlah/varian produk yang diinginkan\n' +
          '4️⃣ Ticket privat otomatis dibuat untuk lanjut ke pembayaran\n' +
          '5️⃣ Tunggu staff memproses & mengonfirmasi pesanan kamu',
        inline: false,
      },
      {
        name: '📌 Status Toko',
        value: open
          ? '🟢 **BUKA** — silakan pilih produk di bawah.'
          : '🔴 **TUTUP** — mohon tunggu sampai toko dibuka kembali.',
        inline: false,
      },
      {
        name: '📊 Statistik Toko',
        value: buildStoreStatsText(),
        inline: false,
      }
    )
    .setThumbnail(iconURL || null)
    .setFooter({ text: `${name} -- transaksi aman lewat ticket privat` });

  if (attachmentName) {
    embed.setImage(`attachment://${attachmentName}`);
  }

  return embed;
}

function buildStorePanelComponents({ open }) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(PRODUCT_SELECT_ID)
    .setPlaceholder(open ? 'Pilih produk yang ingin dibeli...' : 'Toko sedang tutup')
    .setDisabled(!open)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Robux')
        .setDescription('Top up Robux ke akun Roblox kamu')
        .setValue(PRODUCT_ROBUX)
        .setEmoji(ROBUX_EMOJI),
      new StringSelectMenuOptionBuilder()
        .setLabel('Coming Soon')
        .setDescription('Produk lain segera hadir')
        .setValue(PRODUCT_COMING_SOON)
        .setEmoji('🕒')
    );

  return [new ActionRowBuilder().addComponents(select)];
}

module.exports = {
  COLOR_PINK,
  DIVIDER,
  PRODUCT_SELECT_ID,
  PRODUCT_ROBUX,
  PRODUCT_COMING_SOON,
  ROBUX_EMOJI,
  robuxEmojiTag,
  formatRupiah,
  priceForRobux,
  buildStorePanelEmbed,
  buildStorePanelComponents,
};
