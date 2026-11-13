const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config');
const ticketStore = require('./ticketStore');
const stockStore = require('./stockStore');

const COLOR_PINK = 0xff2f9c;
// Lebih pendek dari divider di panel lain (rolePanel.js dkk) -- yang versi
// 25 karakter kepotong jadi 2 baris di layar HP (lebar sempit), ini aman di
// HP maupun PC.
const DIVIDER = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

// Dropdown produk diganti jadi tombol -- lebih enak diklik & kelihatan
// jelas statusnya (aktif/nonaktif) langsung di panel, tanpa harus buka
// dropdown dulu.
const BTN_PRODUCT_ROBUX = 'store_btn_product_robux';
const BTN_PRODUCT_SKINROD = 'store_btn_product_skinrod';
const BTN_PRODUCT_ROYALPET = 'store_btn_product_royalpet';
const PRODUCT_ROBUX = 'robux';
const PRODUCT_SKINROD = 'skinrod';
const PRODUCT_ROYALPET = 'royalpet';

// Emoji custom server buat ikon Robux (ganti emoji unicode 💎 di seluruh
// panel Store/Ticket). Nama HARUS persis sama kayak nama emoji aslinya di
// server supaya Discord bisa resolve gambarnya.
const ROBUX_EMOJI = { id: config.store.robuxEmoji.id, name: config.store.robuxEmoji.name };

function robuxEmojiTag() {
  return ROBUX_EMOJI.id ? `<:${ROBUX_EMOJI.name}:${ROBUX_EMOJI.id}>` : '💎';
}

/**
 * Teks "Stock Robux Hari Ini" -- kalau admin belum pernah /toko-stock,
 * dianggap tidak dibatasi (tetap tampilkan status apa adanya).
 */
function buildStockText() {
  const stock = stockStore.getStock();
  if (stock.total === null || stock.remaining === null) {
    return 'Belum di-set';
  }
  return `${stock.remaining.toLocaleString('id-ID')} / ${stock.total.toLocaleString('id-ID')} tersisa`;
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
          '1️⃣ Klik tombol produk di bawah\n' +
          '2️⃣ Masukkan username Roblox kamu & konfirmasi akunnya\n' +
          '3️⃣ Pilih jumlah/varian produk yang diinginkan\n' +
          '4️⃣ Ticket privat otomatis dibuat untuk lanjut ke pembayaran\n' +
          '5️⃣ Tunggu staff memproses & mengonfirmasi pesanan kamu',
        inline: false,
      },
      {
        name: `${robuxEmojiTag()} Stock Robux Hari Ini`,
        value: buildStockText(),
        inline: false,
      },
      {
        name: '🏔️ Produk Map Mount Mellow',
        value:
          '🎣 **Paket Skin Rod**\n' +
          config.store.skinRodPackages
            .map((p) => `• ${p.label} (${p.skins} Skin) -- ${formatRupiah(p.price)}`)
            .join('\n') +
          `\n\n👑 **Royal Pet** -- ${formatRupiah(config.store.royalPetPrice)}`,
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

/**
 * `open` = toko buka. `closedReason` 'stock' (stock Robux habis) cuma
 * mengunci tombol Robux -- produk Mount Mellow tidak pakai stock, jadi
 * tetap bisa dibeli. Tutup manual (/toko-tutup) mengunci semuanya.
 */
function buildStorePanelComponents({ open, closedReason = null }) {
  const robuxOpen = open;
  const otherOpen = open || closedReason === 'stock';

  const robuxButton = new ButtonBuilder()
    .setCustomId(BTN_PRODUCT_ROBUX)
    .setLabel(robuxOpen ? 'Beli Robux' : 'Robux Tutup')
    .setStyle(robuxOpen ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setEmoji(ROBUX_EMOJI)
    .setDisabled(!robuxOpen);

  const skinRodButton = new ButtonBuilder()
    .setCustomId(BTN_PRODUCT_SKINROD)
    .setLabel(otherOpen ? 'Paket Skin Rod' : 'Toko Tutup')
    .setStyle(otherOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setEmoji('🎣')
    .setDisabled(!otherOpen);

  const royalPetButton = new ButtonBuilder()
    .setCustomId(BTN_PRODUCT_ROYALPET)
    .setLabel(otherOpen ? 'Royal Pet' : 'Toko Tutup')
    .setStyle(otherOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setEmoji('👑')
    .setDisabled(!otherOpen);

  return [new ActionRowBuilder().addComponents(robuxButton, skinRodButton, royalPetButton)];
}

module.exports = {
  COLOR_PINK,
  DIVIDER,
  BTN_PRODUCT_ROBUX,
  BTN_PRODUCT_SKINROD,
  BTN_PRODUCT_ROYALPET,
  PRODUCT_ROBUX,
  PRODUCT_SKINROD,
  PRODUCT_ROYALPET,
  ROBUX_EMOJI,
  robuxEmojiTag,
  formatRupiah,
  priceForRobux,
  buildStorePanelEmbed,
  buildStorePanelComponents,
};
