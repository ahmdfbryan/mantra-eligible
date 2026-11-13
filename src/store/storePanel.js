const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const config = require('../config');
const ticketStore = require('./ticketStore');
const stockStore = require('./stockStore');

const COLOR_PINK = 0xff2f9c;
// Lebih pendek dari divider di panel lain (rolePanel.js dkk) -- yang versi
// 25 karakter kepotong jadi 2 baris di layar HP (lebar sempit), ini aman di
// HP maupun PC. Masih dipakai embed ticket/testimoni/leaderboard.
const DIVIDER = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

// Tombol produk -- sekarang jadi accessory di sebelah tiap baris produk
// (Components V2), bukan deretan tombol terpisah di bawah.
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
 * Teks stock Robux hari ini -- kalau admin belum pernah /toko-stock,
 * dianggap tidak dibatasi (tampilkan "Belum di-set").
 */
function buildStockText() {
  const stock = stockStore.getStock();
  if (stock.total === null || stock.remaining === null) {
    return 'Belum di-set';
  }
  return `${stock.remaining.toLocaleString('id-ID')} / ${stock.total.toLocaleString('id-ID')} tersisa`;
}

/**
 * Teks "Total Transaksi" + "Rating Toko" (rata-rata dari semua testimoni
 * yang masuk) -- dihitung ulang tiap kali panel Store dibangun/di-refresh.
 */
function buildStoreStatsText() {
  const completedCount = ticketStore.getCompletedCount();
  const { average, count: ratingCount } = ticketStore.getAverageRating();

  const ratingText = ratingCount > 0 ? `⭐ ${average.toFixed(1)}/5 (${ratingCount} testimoni)` : 'Belum ada rating';

  return `🧾 **Total Transaksi** : ${completedCount}\n⭐ **Rating Toko** : ${ratingText}`;
}

/**
 * Panel utama "Store" -- Components V2 (card premium): banner, status toko,
 * tiap produk satu baris lengkap dengan tombol beli di sampingnya, tata
 * cara pembelian, dan statistik. Auto-refresh begitu admin jalankan
 * /toko-buka, /toko-tutup, atau stock berubah (pesan yang sama di-edit
 * ulang, bukan dikirim pesan baru).
 *
 * `closedReason` 'stock' (stock Robux habis) cuma mengunci produk Robux --
 * produk Mount Mellow tidak pakai stock. Tutup manual (/toko-tutup)
 * mengunci semuanya.
 *
 * Return { components, flags } -- flags WAJIB IsComponentsV2 saat
 * dikirim/di-edit. Banner dikirim sebagai attachment `attachmentName`.
 */
function buildStorePanel({ guild, communityName, open, closedReason = null, attachmentName }) {
  const name = communityName || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 256 }) || undefined;

  const robuxOpen = open;
  const otherOpen = open || closedReason === 'stock';

  const container = new ContainerBuilder().setAccentColor(COLOR_PINK);

  // ---- Banner ----
  if (attachmentName) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${attachmentName}`))
    );
  }

  // ---- Header (SectionBuilder WAJIB punya accessory -- kalau server nggak
  // punya icon, pakai TextDisplay polos) ----
  // Sengaja TANPA keterangan "Status Toko" (permintaan admin) -- status
  // buka/tutup cukup kelihatan dari tombol produk di bawah.
  const headerTexts = [
    `# 🛍️ ${name} STORE`,
    'Pilih produk di bawah sesuai kebutuhanmu untuk membuka tiket pemesanan. Tim admin akan membantu proses selanjutnya. Pastikan kamu memilih kategori yang tepat agar pesanan dapat ditangani dengan lancar!',
  ];
  if (iconURL) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(...headerTexts.map((t) => new TextDisplayBuilder().setContent(t)))
        .setThumbnailAccessory((thumbnail) => thumbnail.setURL(iconURL).setDescription(name))
    );
  } else {
    container.addTextDisplayComponents(...headerTexts.map((t) => new TextDisplayBuilder().setContent(t)));
  }

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));

  // ---- Produk 1: Robux ----
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${robuxEmojiTag()} Robux\n` +
            `Mulai ${formatRupiah(config.store.robuxRatePer100)} / 100 Robux (100 -- ${config.store.robuxOptions[
              config.store.robuxOptions.length - 1
            ].toLocaleString('id-ID')} Robux)\n` +
            `📦 Stock hari ini: **${buildStockText()}**`
        )
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId(BTN_PRODUCT_ROBUX)
          .setLabel(robuxOpen ? 'Beli Robux' : 'Robux Tutup')
          .setStyle(robuxOpen ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setEmoji(ROBUX_EMOJI)
          .setDisabled(!robuxOpen)
      )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // ---- Produk 2: Paket Skin Rod ----
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '### 🎣 Paket Skin Rod · Mount Mellow\n' +
            config.store.skinRodPackages
              .map((p) => `**${p.label}** (${p.skins} Skin) -- ${formatRupiah(p.price)}`)
              .join('\n')
        )
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId(BTN_PRODUCT_SKINROD)
          .setLabel(otherOpen ? 'Beli Skin Rod' : 'Toko Tutup')
          .setStyle(otherOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('🎣')
          .setDisabled(!otherOpen)
      )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // ---- Produk 3: Royal Pet ----
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👑 Royal Pet · Mount Mellow\nPet eksklusif -- ${formatRupiah(config.store.royalPetPrice)}`
        )
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId(BTN_PRODUCT_ROYALPET)
          .setLabel(otherOpen ? 'Beli Royal Pet' : 'Toko Tutup')
          .setStyle(otherOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji('👑')
          .setDisabled(!otherOpen)
      )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));

  // ---- Cara pembelian ----
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### 🛒 Cara Pembelian\n' +
        '1️⃣ Klik tombol **Beli** di produk yang kamu mau\n' +
        '2️⃣ Masukkan username Roblox kamu & konfirmasi akunnya\n' +
        '3️⃣ Pilih jumlah/varian produk yang diinginkan\n' +
        '4️⃣ Ticket privat otomatis dibuat untuk lanjut ke pembayaran\n' +
        '5️⃣ Tunggu staff memproses & mengonfirmasi pesanan kamu'
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  // ---- Statistik + footer ----
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### 📊 Statistik Toko\n${buildStoreStatsText()}`),
    new TextDisplayBuilder().setContent(`-# 🔒 ${name} -- transaksi aman lewat ticket privat`)
  );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
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
  buildStorePanel,
};
