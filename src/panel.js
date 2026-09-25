const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const config = require('./config');

const CHECK_BUTTON_ID = 'panel_check_account';
const CHECK_MODAL_ID = 'panel_check_modal';
const CHECK_MODAL_USERNAME_ID = 'panel_check_modal_username';

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔍 CEK STATUS AKUN')
    .setDescription(
      'Apabila belum bergabung ke komunitas, silakan join terlebih dahulu dan tunggu selama **14 hari** hingga memenuhi syarat untuk verifikasi komunitas.'
    )
    .setFooter({ text: config.community.name })
    .setTimestamp(new Date());
}

function buildPanelComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CHECK_BUTTON_ID)
      .setLabel('Cek Akun Anda')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔍'),
    new ButtonBuilder()
      .setLabel('Link Komunitas MC')
      .setStyle(ButtonStyle.Link)
      .setURL(config.community.url)
      .setEmoji('🔗')
  );
}

function buildCheckModal() {
  const usernameInput = new TextInputBuilder()
    .setCustomId(CHECK_MODAL_USERNAME_ID)
    .setLabel('Username Roblox kamu')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Contoh: builderman')
    .setMinLength(3)
    .setMaxLength(20)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(CHECK_MODAL_ID)
    .setTitle('Cek Status Akun Roblox')
    .addComponents(new ActionRowBuilder().addComponents(usernameInput));
}

module.exports = {
  CHECK_BUTTON_ID,
  CHECK_MODAL_ID,
  CHECK_MODAL_USERNAME_ID,
  buildPanelEmbed,
  buildPanelComponents,
  buildCheckModal,
};
