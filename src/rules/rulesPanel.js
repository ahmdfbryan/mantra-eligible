const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
  WELCOME_TEXT,
  RULES_AUTHOR,
  RULES_TITLE_TEMPLATE,
  RULES_INTRO,
  RULES_NOTE,
  RULES,
} = require('./rulesContent');

const COLOR_PINK = 0xff2f9c;

const BTN_LANG_EN = 'rules_lang_en';

/**
 * Embed 1: sapaan "Welcome to Mantra Creative".
 */
function buildWelcomeTextEmbed(lang) {
  const text = WELCOME_TEXT[lang] || WELCOME_TEXT.id;
  return new EmbedBuilder().setColor(COLOR_PINK).setTitle(text.title).setDescription(text.body);
}

/**
 * Embed 2: "Peraturan Server" -- layout niru referensi:
 *  - author kecil "📜 Peraturan Server" di atas judul besar
 *  - judul besar "Aturan di <nama komunitas>"
 *  - tiap aturan = 1 field TANPA nama (field name dikosongkan pakai
 *    zero-width space) supaya seluruh isinya diatur sendiri lewat markdown
 *    di value-nya:
 *      ### `Aturan N` -- Judul Aturan   <- "Aturan N" (gaya badge/code) DAN
 *                                          judulnya jadi 1 heading gede
 *                                          (markdown heading level 3)
 *      Paragraf penjelasan ...          <- teks biasa di bawahnya
 */
function buildServerRulesEmbed(lang, communityName) {
  const safeLang = lang === 'en' ? 'en' : 'id';
  const name = communityName || 'MANTRA CREATIVE';
  const label = safeLang === 'en' ? 'Rule' : 'Aturan';

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setAuthor({ name: RULES_AUTHOR[safeLang] })
    .setTitle(RULES_TITLE_TEMPLATE[safeLang](name))
    .setDescription(RULES_INTRO[safeLang]);

  RULES.forEach((rule, index) => {
    const content = rule[safeLang] || rule.id;
    // Field NAME di embed otomatis dirender bold sama Discord (beda dari
    // markdown heading "###" yang tidak didukung di dalam embed, cuma di
    // pesan teks biasa) -- ini cara paling pas biar tiap judul aturan
    // keliatan menonjol & bold tanpa nulis markdown yang tidak kebaca.
    embed.addFields({
      name: `${label} ${index + 1} -- ${content.title}`,
      value: content.body,
    });
  });

  embed.addFields({
    name: '​',
    value: `*${RULES_NOTE[safeLang]}*`,
  });

  return embed;
}

/**
 * Tombol "Versi Bahasa Inggris" di bawah embed rules (versi default = ID).
 * Pas diklik, ephemeral reply nampilin ulang embed yang sama tapi versi EN.
 */
function buildRulesComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN_LANG_EN).setLabel('Versi Bahasa Inggris').setEmoji('🇬🇧').setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  BTN_LANG_EN,
  buildWelcomeTextEmbed,
  buildServerRulesEmbed,
  buildRulesComponents,
};
