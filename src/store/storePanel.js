const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const COLOR_PINK = 0xff2f9c;
const DIVIDER = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

const PRODUCT_SELECT_ID = 'store_product_select';
const PRODUCT_ROBUX = 'robux';
const PRODUCT_COMING_SOON = 'coming_soon';

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
 * Panel utama "Store" -- info toko, tata cara pembelian, dan status
 * buka/tutup yang auto-refresh begitu admin jalankan /toko-buka atau
 * /toko-tutup (embed yang sama di-edit ulang, bukan dikirim pesan baru).
 */
function buildStorePanelEmbed({ guild, communityName, open, robuxOptions, robuxRatePer100 }) {
  const name = communityName || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 128 }) || undefined;
  const cheapest = robuxOptions[0];
  const priceCheapest = priceForRobux(cheapest, robuxRatePer100);

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setAuthor({ name, iconURL })
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
        name: '📦 Produk Tersedia',
        value: `💎 **Robux** -- mulai dari **${cheapest} Robux** (${formatRupiah(priceCheapest)})\n🕒 **Coming Soon** -- produk lain segera hadir`,
        inline: false,
      },
      {
        name: '📌 Status Toko',
        value: open
          ? '🟢 **BUKA** — silakan pilih produk di bawah.'
          : '🔴 **TUTUP** — mohon tunggu sampai toko dibuka kembali.',
        inline: false,
      }
    )
    .setThumbnail(iconURL || null)
    .setFooter({ text: `${name} -- transaksi aman lewat ticket privat` });
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
        .setEmoji('💎'),
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
  formatRupiah,
  priceForRobux,
  buildStorePanelEmbed,
  buildStorePanelComponents,
};
