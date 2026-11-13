const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const { COLOR_PINK, ROBUX_EMOJI, robuxEmojiTag, formatRupiah, priceForRobux } = require('./storePanel');

const USERNAME_MODAL_ID = 'store_username_modal';
const USERNAME_INPUT_ID = 'store_username_input';

const BTN_CONFIRM_YES = 'store_confirm_yes';
const BTN_CONFIRM_NO = 'store_confirm_no';

const ROBUX_AMOUNT_SELECT_ID = 'store_robux_amount_select';

const SKINROD_PACKAGE_SELECT_ID = 'store_skinrod_package_select';

const PRODUCT_TITLES = {
  robux: 'Beli Robux',
  skinrod: 'Paket Skin Rod',
  royalpet: 'Royal Pet',
};

/**
 * Modal username Roblox. customId Robux tetap `store_username_modal` (tidak
 * berubah); produk lain ditambah suffix `:<produk>` supaya handler tahu
 * alur mana yang dipakai.
 */
function buildRobloxUsernameModal(product = 'robux') {
  const usernameInput = new TextInputBuilder()
    .setCustomId(USERNAME_INPUT_ID)
    .setLabel('Username Roblox kamu')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Contoh: builderman')
    .setMinLength(3)
    .setMaxLength(20)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(product === 'robux' ? USERNAME_MODAL_ID : `${USERNAME_MODAL_ID}:${product}`)
    .setTitle(`${PRODUCT_TITLES[product] || 'Order'} -- Username Roblox`.slice(0, 45))
    .addComponents(new ActionRowBuilder().addComponents(usernameInput));
}

/**
 * Dropdown pilih paket Skin Rod (Starter / Premium / All in Skin).
 */
function buildSkinRodPackageComponents(packages) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(SKINROD_PACKAGE_SELECT_ID)
    .setPlaceholder('Pilih paket Skin Rod...')
    .addOptions(
      packages.map((pkg) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${pkg.label} (${pkg.skins} Skin)`)
          .setDescription(formatRupiah(pkg.price))
          .setValue(pkg.id)
          .setEmoji('🎣')
      )
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildSkinRodPackageEmbed(pending) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('🎣 Pilih Paket Skin Rod')
    .setDescription(
      `Akun terverifikasi: \`${pending.robloxUsername}\`\n\nSilakan pilih paket Skin Rod yang ingin dibeli (map Mount Mellow).`
    );
}

/**
 * Embed "Confirm Your Roblox Account" -- ephemeral, cuma yang beli yang lihat.
 */
function buildConfirmAccountEmbed(robloxUser) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('🔍 Confirm Your Roblox Account')
    .setDescription('Is this really your Roblox account?')
    .setThumbnail(robloxUser.avatarUrl || null)
    .addFields(
      { name: '👤 Username', value: `\`${robloxUser.username}\``, inline: true },
      { name: '🏷️ Display Name', value: `\`${robloxUser.displayName}\``, inline: true }
    );
}

function buildConfirmAccountComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(BTN_CONFIRM_YES).setLabel('Ya, Lanjutkan').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(BTN_CONFIRM_NO).setLabel('Tidak, Batalkan').setStyle(ButtonStyle.Danger)
    ),
  ];
}

/**
 * Dropdown pilih jumlah Robux -- harga dihitung linear dari rate per 100.
 */
function buildRobuxAmountComponents(robuxOptions, robuxRatePer100) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(ROBUX_AMOUNT_SELECT_ID)
    .setPlaceholder('Pilih jumlah Robux...')
    .addOptions(
      robuxOptions.map((amount) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${amount} Robux`)
          .setDescription(formatRupiah(priceForRobux(amount, robuxRatePer100)))
          .setValue(String(amount))
          .setEmoji(ROBUX_EMOJI)
      )
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildRobuxAmountEmbed(pending) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`${robuxEmojiTag()} Pilih Jumlah Robux`)
    .setDescription(`Akun terverifikasi: \`${pending.robloxUsername}\`\n\nSilakan pilih jumlah Robux yang ingin dibeli.`);
}

module.exports = {
  USERNAME_MODAL_ID,
  USERNAME_INPUT_ID,
  BTN_CONFIRM_YES,
  BTN_CONFIRM_NO,
  ROBUX_AMOUNT_SELECT_ID,
  SKINROD_PACKAGE_SELECT_ID,
  buildSkinRodPackageComponents,
  buildSkinRodPackageEmbed,
  buildRobloxUsernameModal,
  buildConfirmAccountEmbed,
  buildConfirmAccountComponents,
  buildRobuxAmountComponents,
  buildRobuxAmountEmbed,
};
