const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

const COLOR_PINK = 0xff2f9c;

// Emoji custom server (sudah di-upload di Mantra Creative), dipakai di
// tombol & teks embed gantiin emoji unicode biasa. Nama di objek ini cuma
// label/fallback -- yang nentuin gambar yang muncul tetap ID-nya.
const GAME_EMOJI = {
  roblox: { id: config.gameEmojis.roblox, name: 'roblox' },
  mobileLegends: { id: config.gameEmojis.mobileLegends, name: 'mobilelegends' },
  pubg: { id: config.gameEmojis.pubg, name: 'pubg' },
  freeFire: { id: config.gameEmojis.freeFire, name: 'freefire' },
};

function emojiTag(key) {
  const emoji = GAME_EMOJI[key];
  return emoji?.id ? `<:${emoji.name}:${emoji.id}>` : '';
}

// customId tombol -- dipakai juga di index.js buat nentuin role mana yang
// di-toggle pas tombolnya diklik.
const BTN_GENDER_BOYS = 'role_gender_boys';
const BTN_GENDER_GIRLS = 'role_gender_girls';
const BTN_GAME_ROBLOX = 'role_game_roblox';
const BTN_GAME_ML = 'role_game_ml';
const BTN_GAME_PUBG = 'role_game_pubg';
const BTN_GAME_FF = 'role_game_ff';

const DIVIDER = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯';

/**
 * Embed "Take Role" versi premium -- author pakai ikon server, title besar
 * dengan emoji mahkota, divider custom, 2 seksi (Gender & Game Favorit)
 * dijelaskan lewat fields supaya rapi & "berkelas", bukan cuma 1 paragraf polos.
 */
function buildTakeRoleEmbed(guild, communityName) {
  const name = communityName || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 128 }) || undefined;

  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setAuthor({ name, iconURL })
    .setTitle('👑 TAKE ROLE')
    .setDescription(
      `Pilih role yang menggambarkan dirimu di **${name}**.\n` +
        `Tinggal klik tombol di bawah -- klik lagi kalau mau dilepas.\n${DIVIDER}`
    )
    .addFields(
      {
        name: '👤 GENDER',
        value: '👦 **MC Boys**\n👧 **MC Girls**\n> *Pilih salah satu -- ambil yang baru otomatis lepas yang lama.*',
        inline: true,
      },
      {
        name: '🎮 GAME FAVORIT',
        value:
          `${emojiTag('roblox')} **Roblox**\n${emojiTag('mobileLegends')} **Mobile Legends**\n` +
          `${emojiTag('pubg')} **PUBG**\n${emojiTag('freeFire')} **Free Fire**\n` +
          '> *Boleh pilih lebih dari satu.*',
        inline: true,
      }
    )
    .setThumbnail(iconURL || null)
    .setFooter({ text: `Made by ${name}` });
}

function buildGenderRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN_GENDER_BOYS).setLabel('MC Boys').setEmoji('👦').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(BTN_GENDER_GIRLS).setLabel('MC Girls').setEmoji('👧').setStyle(ButtonStyle.Danger)
  );
}

function buildGameRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BTN_GAME_ROBLOX)
      .setLabel('Roblox')
      .setEmoji(GAME_EMOJI.roblox)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BTN_GAME_ML)
      .setLabel('Mobile Legends')
      .setEmoji(GAME_EMOJI.mobileLegends)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BTN_GAME_PUBG)
      .setLabel('PUBG')
      .setEmoji(GAME_EMOJI.pubg)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BTN_GAME_FF)
      .setLabel('Free Fire')
      .setEmoji(GAME_EMOJI.freeFire)
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  BTN_GENDER_BOYS,
  BTN_GENDER_GIRLS,
  BTN_GAME_ROBLOX,
  BTN_GAME_ML,
  BTN_GAME_PUBG,
  BTN_GAME_FF,
  buildTakeRoleEmbed,
  buildGenderRow,
  buildGameRow,
};
