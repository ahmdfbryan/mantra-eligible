const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
  WELCOME_TEXT,
  RULES_TITLE,
  RULES_INTRO,
  RULES_NOTE_LABEL,
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
 * Embed 2: "📜 Server Rules" -- versi final sesuai request:
 *  - judul statis "📜 Server Rules" (tanpa author, tanpa nama komunitas)
 *  - intro paragraf asli ("Berikut peraturan resmi ...")
 *  - tiap aturan = 1 field, name-nya "`Aturan N` Judul" (field name otomatis
 *    bold di Discord -- ini satu-satunya cara bikin "Aturan N" + judulnya
 *    tebal tanpa markdown heading, yang memang tidak didukung di embed)
 *  - field penutup label "Catatan" (plain, bukan "📌 Catatan")
 */
function buildServerRulesEmbed(lang, communityName) {
  const safeLang = lang === 'en' ? 'en' : 'id';
  const name = communityName || 'MANTRA CREATIVE';
  const label = safeLang === 'en' ? 'Rule' : 'Aturan';

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(RULES_TITLE[safeLang])
    .setDescription(RULES_INTRO[safeLang](name));

  RULES.forEach((rule, index) => {
    const content = rule[safeLang] || rule.id;
    // Field NAME di embed otomatis dirender bold sama Discord -- jadi
    // "`Aturan N` Judul" ini tampil bold tanpa markdown heading (yang
    // memang tidak didukung di dalam embed, cuma di pesan teks biasa).
    embed.addFields({
      name: `\`${label} ${index + 1}\` ${content.title}`,
      value: content.body,
    });
  });

  embed.addFields({
    name: RULES_NOTE_LABEL[safeLang],
    value: RULES_NOTE[safeLang](name),
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
