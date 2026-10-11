const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { WELCOME_TEXT, RULES_TITLE, RULES_INTRO, RULES_NOTE, RULES } = require('./rulesContent');

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
 * Embed 2: "📜 Server Rules" -- tiap aturan jadi 1 field ("Aturan N -
 * Judul") biar rapi & gampang di-scan, bukan 1 paragraf panjang nyambung.
 * Field terakhir ("Catatan") nampung kalimat penutup soal rules bisa
 * berubah sewaktu-waktu.
 */
function buildServerRulesEmbed(lang) {
  const safeLang = lang === 'en' ? 'en' : 'id';
  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(RULES_TITLE[safeLang])
    .setDescription(RULES_INTRO[safeLang]);

  RULES.forEach((rule, index) => {
    const content = rule[safeLang] || rule.id;
    const label = safeLang === 'en' ? 'Rule' : 'Aturan';
    embed.addFields({
      name: `${label} ${index + 1} -- ${content.title}`,
      value: content.body,
    });
  });

  embed.addFields({
    name: safeLang === 'en' ? '📌 Note' : '📌 Catatan',
    value: RULES_NOTE[safeLang],
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
