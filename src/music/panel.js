const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const player = require('./player');

const BTN_TOGGLE = 'music_toggle';
const BTN_SKIP = 'music_skip';
const BTN_STOP = 'music_stop';
const BTN_PLAY = 'music_play_open_modal';
const BTN_AUTOPLAY = 'music_autoplay_toggle';
const BTN_QUEUE = 'music_queue_show';

const MODAL_PLAY_ID = 'music_play_modal';
const MODAL_PLAY_INPUT_ID = 'music_play_modal_input';

// Palet hitam + pink/magenta, konsisten dengan brand MANTRA CREATIVE
// (sama seperti yang dipakai di boostCard.js) supaya semua embed bot ini
// kelihatan "satu keluarga" desain.
const COLOR_PINK = 0xff2f9c;

function formatQueueLine(track, index) {
  const duration = track.durationText ? ` \`${track.durationText}\`` : '';
  return `**${index + 1}.** [${track.title}](${track.url})${duration}`;
}

/**
 * Embed konfirmasi setelah `/play` (atau modal "▶️ Play") berhasil -- dipakai
 * baik saat track langsung diputar maupun saat cuma masuk antrian.
 */
function buildTrackAddedEmbed(track, { position, isNowPlaying }) {
  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(isNowPlaying ? '🎶 Now Playing' : '✅ Added Track')
    .setDescription(`[${track.title}](${track.url})`);

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);

  embed.addFields({
    name: 'Track Length',
    value: track.durationText ? `\`${track.durationText}\`` : '`-`',
    inline: true,
  });

  if (!isNowPlaying) {
    embed.addFields({
      name: 'Position in Queue',
      value: `\`#${position}\``,
      inline: true,
    });
  }

  return embed;
}

/**
 * Embed daftar antrian lengkap -- ditampilkan waktu tombol "📋 Queue" di
 * panel diklik (dulu daftar ini nempel di badan panel, sekarang dipindah ke
 * sini supaya panelnya lebih ringkas).
 */
function buildQueueEmbed(guildId) {
  const state = player.getState(guildId);
  const queue = state?.queue || [];

  const embed = new EmbedBuilder().setColor(COLOR_PINK).setTitle('📋 Queue');

  if (!queue.length) {
    embed.setDescription('_Antrian kosong._');
    return embed;
  }

  const lines = queue.slice(0, 15).map(formatQueueLine).join('\n');
  const extra = queue.length > 15 ? `\n_+${queue.length - 15} lagu lagi..._` : '';
  embed.setDescription(`${lines}${extra}`);

  return embed;
}

/**
 * Modal buat input link/judul lagu langsung dari tombol "▶️ Play" di panel,
 * tanpa perlu ngetik `/play` manual -- mirror dari pola `buildCheckModal()`
 * di src/panel.js.
 */
function buildPlayModal() {
  const input = new TextInputBuilder()
    .setCustomId(MODAL_PLAY_INPUT_ID)
    .setLabel('Link atau judul lagu')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Link YouTube/Spotify, atau kata kunci judul lagu')
    .setMinLength(2)
    .setMaxLength(200)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(MODAL_PLAY_ID)
    .setTitle('🎶 Putar Lagu')
    .addComponents(new ActionRowBuilder().addComponents(input));
}

function buildMusicEmbed(guildId) {
  const state = player.getState(guildId);
  const autoplay = player.isAutoplay(guildId);
  const paused = player.isPaused(guildId);

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('🎧  M U S I C   P A N E L');

  if (state?.current) {
    const duration = state.current.durationText ? `\n\`${state.current.durationText}\`` : '';
    const statusLabel = paused ? '⏸️ Dipause' : '▶️ Sedang diputar';
    embed.setDescription(
      `${statusLabel}\n### [${state.current.title}](${state.current.url})${duration}`
    );
    if (state.current.thumbnail) embed.setThumbnail(state.current.thumbnail);
  } else {
    embed.setDescription(
      '_Tidak ada yang sedang diputar._\n\n' +
        'Klik tombol **▶️ Play** di bawah, atau pakai `/play` -- bisa link YouTube, link Spotify, atau kata kunci judul lagu.'
    );
  }

  const queueLength = state?.queue?.length || 0;

  embed.addFields(
    {
      name: 'Autoplay',
      value: autoplay ? '`Aktif`' : '`Nonaktif`',
      inline: true,
    },
    {
      name: '📋 Queue',
      value: `\`${queueLength}\``,
      inline: true,
    },
    {
      name: 'Koneksi',
      value: state?.connection ? '`Connect`' : '`Not Connect`',
      inline: true,
    }
  );

  embed.setFooter({ text: 'Mantra Creative Studios' }).setTimestamp(new Date());

  return embed;
}

function buildMusicComponents(guildId) {
  const paused = player.isPaused(guildId);
  const autoplay = player.isAutoplay(guildId);

  return [
    // Baris 1: kontrol pemutaran utama (transport), urut sesuai alur pakai --
    // mulai, jeda/lanjut, lompat, berhenti.
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(BTN_PLAY)
        .setLabel('Play')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(BTN_TOGGLE)
        .setLabel(paused ? 'Resume' : 'Pause')
        .setEmoji(paused ? '▶️' : '⏸️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BTN_SKIP)
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BTN_STOP)
        .setLabel('Stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
    ),
    // Baris 2: info/pengaturan tambahan, dipisah dari transport supaya lebih
    // rapi -- lihat antrian, atau toggle autoplay.
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(BTN_QUEUE)
        .setLabel('Queue')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BTN_AUTOPLAY)
        .setLabel(`Autoplay: ${autoplay ? 'ON' : 'OFF'}`)
        .setEmoji('🔁')
        .setStyle(autoplay ? ButtonStyle.Success : ButtonStyle.Secondary)
    ),
  ];
}

module.exports = {
  BTN_TOGGLE,
  BTN_SKIP,
  BTN_STOP,
  BTN_PLAY,
  BTN_AUTOPLAY,
  BTN_QUEUE,
  MODAL_PLAY_ID,
  MODAL_PLAY_INPUT_ID,
  buildPlayModal,
  buildMusicEmbed,
  buildMusicComponents,
  buildTrackAddedEmbed,
  buildQueueEmbed,
};
