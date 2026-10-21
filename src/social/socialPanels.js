const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

// Warna aksen sama kayak panel Store/Gold Donation -- biar brand-nya
// konsisten di semua panel "premium" (Components V2) milik Mantra Creative.
const COLOR_PINK = 0xff2f9c;

const COMMUNITY_URL = 'https://www.roblox.com/share/g/783602348';
const TIKTOK_URL = 'https://www.tiktok.com/@mantra_creative';

/**
 * Panel info "Komunitas Mantra Creative" -- link join komunitas Roblox.
 * Pakai Components V2 (ContainerBuilder dkk) biar tampilannya kayak card
 * custom, bukan embed klasik. Return { components, flags } -- flags WAJIB
 * di-set MessageFlags.IsComponentsV2 saat dikirim/di-edit, kalau nggak
 * Discord bakal nolak pesannya.
 */
function buildCommunityPanel({ guild, communityName } = {}) {
  const name = communityName || guild?.name || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 256 }) || undefined;

  const container = new ContainerBuilder().setAccentColor(COLOR_PINK);

  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🌐 Komunitas Mantra Creative'),
      new TextDisplayBuilder().setContent(
        `Gabung ke komunitas Roblox resmi **${name}** buat ikutan event, main bareng member lain, ` +
          'dan dapetin update terbaru langsung dari developer.'
      )
    );
  if (iconURL) {
    headerSection.setThumbnailAccessory((thumbnail) => thumbnail.setURL(iconURL).setDescription(name));
  }
  container.addSectionComponents(headerSection);

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Kenapa harus join?**\n' +
        '• Akses semua map & update terbaru komunitas\n' +
        '• Event, giveaway, dan aktivitas rutin\n' +
        '• Terhubung langsung dengan sesama member Mantra Creative'
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Join Komunitas')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL(COMMUNITY_URL)
    )
  );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Panel info "TikTok Mantra Creative" -- link follow akun TikTok resmi.
 * Sama polanya kayak buildCommunityPanel, cuma kontennya beda.
 */
function buildTiktokPanel({ guild, communityName } = {}) {
  const name = communityName || guild?.name || 'MANTRA CREATIVE';
  const iconURL = guild?.iconURL({ size: 256 }) || undefined;

  const container = new ContainerBuilder().setAccentColor(COLOR_PINK);

  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🎵 TikTok Mantra Creative'),
      new TextDisplayBuilder().setContent(
        `Follow TikTok resmi **${name}** buat nonton konten seru, behind the scene, ` +
          'dan info terbaru seputar komunitas kami.'
      )
    );
  if (iconURL) {
    headerSection.setThumbnailAccessory((thumbnail) => thumbnail.setURL(iconURL).setDescription(name));
  }
  container.addSectionComponents(headerSection);

  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '**Kenapa harus follow?**\n' +
        '• Update event & aktivitas komunitas dalam bentuk video\n' +
        '• Konten seru seputar Mantra Creative\n' +
        '• Dukung channel resmi kami biar makin berkembang'
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Follow TikTok').setEmoji('🎵').setStyle(ButtonStyle.Link).setURL(TIKTOK_URL)
    )
  );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = {
  COLOR_PINK,
  COMMUNITY_URL,
  TIKTOK_URL,
  buildCommunityPanel,
  buildTiktokPanel,
};
