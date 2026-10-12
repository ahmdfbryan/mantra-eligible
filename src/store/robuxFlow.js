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
const { COLOR_PINK, formatRupiah, priceForRobux } = require('./storePanel');

const USERNAME_MODAL_ID = 'store_username_modal';
const USERNAME_INPUT_ID = 'store_username_input';

const BTN_CONFIRM_YES = 'store_confirm_yes';
const BTN_CONFIRM_NO = 'store_confirm_no';

const ROBUX_AMOUNT_SELECT_ID = 'store_robux_amount_select';

function buildRobloxUsernameModal() {
  const usernameInput = new TextInputBuilder()
    .setCustomId(USERNAME_INPUT_ID)
    .setLabel('Username Roblox kamu')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Contoh: builderman')
    .setMinLength(3)
    .setMaxLength(20)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(USERNAME_MODAL_ID)
    .setTitle('Beli Robux -- Username Roblox')
    .addComponents(new ActionRowBuilder().addComponents(usernameInput));
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
          .setEmoji('💎')
      )
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildRobuxAmountEmbed(robloxUser) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('💎 Pilih Jumlah Robux')
    .setDescription(`Akun terverifikasi: \`${robloxUser.username}\`\n\nSilakan pilih jumlah Robux yang ingin dibeli.`);
}

module.exports = {
  USERNAME_MODAL_ID,
  USERNAME_INPUT_ID,
  BTN_CONFIRM_YES,
  BTN_CONFIRM_NO,
  ROBUX_AMOUNT_SELECT_ID,
  buildRobloxUsernameModal,
  buildConfirmAccountEmbed,
  buildConfirmAccountComponents,
  buildRobuxAmountComponents,
  buildRobuxAmountEmbed,
};
