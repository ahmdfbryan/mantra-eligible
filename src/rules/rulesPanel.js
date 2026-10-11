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
 *    zero-width space) supaya seluruh isinya (badge + heading + bullet)
 *    bisa diatur sendiri lewat markdown di value-nya:
 *      `Aturan N`          <- badge kecil (inline code = pill abu-abu)
 *      ### Judul Aturan    <- heading gede/bold (markdown heading level 3)
 *      - bullet 1          <- bullet list beneran, bukan paragraf nyambung
 *      - bullet 2
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
    const bullets = content.bullets.map((line) => `- ${line}`).join('\n');
    embed.addFields({
      name: '​',
      value: `\`${label} ${index + 1}\`\n### ${content.title}\n${bullets}`,
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
