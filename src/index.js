const { Client, GatewayIntentBits, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const config = require('./config');
const { lookupMember, getGroupIconUrl, RobloxApiError } = require('./roblox');
const {
  buildEligibilityEmbed,
  buildNotMemberEmbed,
  buildUsernameNotFoundEmbed,
  buildErrorEmbed,
  buildProfileButtonRow,
} = require('./ui');
const {
  CHECK_BUTTON_ID,
  CHECK_MODAL_ID,
  CHECK_MODAL_USERNAME_ID,
  buildPanelEmbed,
  buildPanelComponents,
  buildCheckModal,
} = require('./panel');
const store = require('./store');
const quizStore = require('./quizStore');
const { buildLeaderboardEmbed, syncTopRoles, refreshLeaderboardMessage } = require('./quiz');
const { renderBoostCard } = require('./boostCard');
const boostStore = require('./boostStore');
const musicPlayer = require('./music/player');
const musicPanelStore = require('./music/panelStore');
const {
  resolveTrack,
} = require('./music/resolve');
const {
  BTN_TOGGLE: MUSIC_BTN_TOGGLE,
  BTN_SKIP: MUSIC_BTN_SKIP,
  BTN_STOP: MUSIC_BTN_STOP,
  BTN_PLAY: MUSIC_BTN_PLAY,
  BTN_AUTOPLAY: MUSIC_BTN_AUTOPLAY,
  BTN_QUEUE: MUSIC_BTN_QUEUE,
  MODAL_PLAY_ID: MUSIC_MODAL_PLAY_ID,
  MODAL_PLAY_INPUT_ID: MUSIC_MODAL_PLAY_INPUT_ID,
  buildPlayModal,
  buildMusicEmbed,
  buildMusicComponents,
  buildTrackAddedEmbed,
  buildQueueEmbed,
} = require('./music/panel');
const idCardStore = require('./idcard/idCardStore');
const levelStore = require('./idcard/levelStore');
const { renderIdCard } = require('./idcard/idCardCanvas');
const {
  BTN_CREATE_ID: IDCARD_BTN_CREATE_ID,
  BTN_VIEW_ID: IDCARD_BTN_VIEW_ID,
  MODAL_ID: IDCARD_MODAL_ID,
  MODAL_NAMA_ID: IDCARD_MODAL_NAMA_ID,
  MODAL_GENDER_ID: IDCARD_MODAL_GENDER_ID,
  MODAL_DOMISILI_ID: IDCARD_MODAL_DOMISILI_ID,
  MODAL_CITACITA_ID: IDCARD_MODAL_CITACITA_ID,
  MODAL_HOBI_ID: IDCARD_MODAL_HOBI_ID,
  buildIdCardPanelEmbed,
  buildIdCardPanelComponents,
  buildIdCardModal,
} = require('./idcard/idCardPanel');

const client = new Client({
  // GuildMembers (privileged) wajib diaktifkan juga di Discord Developer
  // Portal (Bot -> Server Members Intent) supaya event boost bisa terdeteksi.
  // GuildVoiceStates (TIDAK privileged, tapi wajib di-request) dibutuhkan
  // buat fitur voice/music -- tanpa ini bot gak akan pernah bisa join voice
  // channel sama sekali.
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Debounce per-channel supaya panel sticky tidak spam re-post saat chat ramai.
const STICKY_DEBOUNCE_MS = 1500;
const stickyTimers = new Map();
// Channel yang sedang dalam proses hapus+kirim-ulang panel (anti race/loop).
const repostingChannels = new Set();

// Sama seperti di atas, tapi khusus buat panel kontrol musik (sticky sendiri,
// terpisah dari panel "Cek Status Akun" supaya tidak saling ganggu kalau
// kebetulan dipasang di channel yang sama).
const musicStickyTimers = new Map();
const musicRepostingChannels = new Set();

client.once('clientReady', async () => {
  console.log(`🤖 Login sebagai ${client.user.tag}`);

  // Discord.js hanya emit event `guildMemberUpdate` untuk member yang SUDAH
  // ada di cache sebelum perubahan terjadi. Tanpa ini, member yang belum
  // pernah "kelihatan" oleh bot (belum pernah kirim pesan/pakai command/dll)
  // tidak akan memicu event boost sama sekali walau intent sudah aktif.
  // Jadi kita fetch semua member tiap guild sekali saat bot online, supaya
  // cache-nya lengkap dan event boost bisa terdeteksi untuk semua member.
  for (const guild of client.guilds.cache.values()) {
    try {
      const members = await guild.members.fetch();
      console.log(`[boost] Cache ${members.size} member di guild "${guild.name}" untuk deteksi boost.`);
    } catch (error) {
      console.error(`[boost] Gagal fetch member guild "${guild.name}":`, error);
    }

    // Auto-join voice channel musik (kalau di-set) supaya bot langsung
    // "nempel" 24/7 begitu online, tanpa perlu staff jalanin command dulu.
    if (config.musicVoiceChannelId) {
      try {
        const voiceChannel = await guild.channels.fetch(config.musicVoiceChannelId).catch(() => null);
        if (voiceChannel && typeof voiceChannel.isVoiceBased === 'function' && voiceChannel.isVoiceBased()) {
          musicPlayer.onStateChange(guild.id, () => {
            refreshMusicPanel(guild.id).catch((error) =>
              console.error('[music] Gagal refresh panel musik:', error)
            );
          });
          await musicPlayer.connect(voiceChannel);
          console.log(`[music] Auto-join voice channel "${voiceChannel.name}" di guild "${guild.name}".`);
        } else {
          console.error(
            `[music] MUSIC_VOICE_CHANNEL_ID (${config.musicVoiceChannelId}) bukan voice channel yang valid/bisa diakses di guild "${guild.name}".`
          );
        }
      } catch (error) {
        console.error(`[music] Gagal auto-join voice channel di guild "${guild.name}":`, error);
      }
    }

    // Pastikan panel kontrol musik selalu ada: kalau sudah pernah dipasang
    // (tersimpan di data/music-panel.json), refresh isinya; kalau belum ada
    // sama sekali dan MUSIC_PANEL_CHANNEL_ID di-set, auto-pasang di situ.
    try {
      const existingPanel = musicPanelStore.getPanel(guild.id);
      if (existingPanel) {
        await refreshMusicPanel(guild.id);
      } else if (config.musicPanelChannelId) {
        const panelChannel = await guild.channels.fetch(config.musicPanelChannelId).catch(() => null);
        if (panelChannel) {
          const panelMessage = await panelChannel.send({
            embeds: [buildMusicEmbed(guild.id)],
            components: buildMusicComponents(guild.id),
          });
          musicPanelStore.setPanel(guild.id, {
            channelId: panelChannel.id,
            messageId: panelMessage.id,
          });
          console.log(`[music] Auto-pasang panel kontrol musik di channel "${panelChannel.name}".`);
        } else {
          console.error(
            `[music] MUSIC_PANEL_CHANNEL_ID (${config.musicPanelChannelId}) tidak ditemukan/tidak bisa diakses di guild "${guild.name}".`
          );
        }
      }
    } catch (error) {
      console.error(`[music] Gagal siapkan panel kontrol musik di guild "${guild.name}":`, error);
    }
  }
});

/**
 * Pasang ulang panel musik dari nol di channel ini (kirim pesan baru +
 * simpan messageId barunya). Dipakai buat self-heal waktu pesan panel lama
 * sudah tidak ada lagi (dihapus manual, kena purge, dsb) supaya panel tidak
 * "hilang" permanen sampai ada yang jalanin /musicpanel manual.
 */
async function recreateMusicPanel(guildId, channel) {
  try {
    const newMessage = await channel.send({
      embeds: [buildMusicEmbed(guildId)],
      components: buildMusicComponents(guildId),
    });
    musicPanelStore.setPanel(guildId, { channelId: channel.id, messageId: newMessage.id });
  } catch (error) {
    console.error('[music] Gagal pasang ulang panel musik otomatis:', error);
    musicPanelStore.clearPanel(guildId);
  }
}

/**
 * Refresh (edit in-place) pesan panel musik yang lagi live di guild ini,
 * kalau ada. Non-fatal: dipanggil tiap ada perubahan state player (play,
 * skip, pause, volume, dst).
 */
async function refreshMusicPanel(guildId) {
  const panel = musicPanelStore.getPanel(guildId);
  if (!panel) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = await guild.channels.fetch(panel.channelId).catch(() => null);
  if (!channel) {
    musicPanelStore.clearPanel(guildId);
    return;
  }

  const message = await channel.messages.fetch(panel.messageId).catch(() => null);
  if (!message) {
    // Pesan panel lama sudah hilang -> pasang ulang otomatis daripada cuma
    // dibiarkan (sebelumnya di titik ini panel jadi "hilang" permanen).
    await recreateMusicPanel(guildId, channel);
    return;
  }

  await message
    .edit({ embeds: [buildMusicEmbed(guildId)], components: buildMusicComponents(guildId) })
    .catch(async (error) => {
      if (error?.code === 10008) {
        // Message ternyata sudah ke-hapus (race antara fetch & edit) -> sama,
        // pasang ulang otomatis.
        await recreateMusicPanel(guildId, channel);
      } else {
        console.error('[music] Gagal edit pesan panel musik:', error);
      }
    });
}

/**
 * Cek username Roblox lalu balas ke interaction (dipakai bareng oleh
 * /verifikasi dan modal panel "Cek Akun Anda").
 */
async function handleUsernameCheck(interaction, username) {
  const requestedBy = interaction.user.username;

  try {
    const member = await lookupMember(username);
    const embed = buildEligibilityEmbed({
      member,
      eligibilityDays: config.eligibilityDays,
      requestedBy,
    });

    await interaction.editReply({
      embeds: [embed],
      components: [buildProfileButtonRow(member.profileUrl)],
    });
  } catch (error) {
    if (error instanceof RobloxApiError) {
      if (error.code === 'USER_NOT_FOUND') {
        await interaction.editReply({
          embeds: [buildUsernameNotFoundEmbed({ username, requestedBy })],
        });
        return;
      }

      if (error.code === 'NOT_MEMBER') {
        const groupIconUrl = await getGroupIconUrl(config.robloxGroupId).catch(() => null);
        await interaction.editReply({
          embeds: [buildNotMemberEmbed({ username, groupIconUrl, requestedBy })],
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          buildErrorEmbed({
            title: 'Gagal Menghubungi Roblox API',
            description: `${error.message}\n\nCoba lagi beberapa saat lagi. Jika terus terjadi, cek ROBLOX_API_KEY dan permission group di dashboard Roblox Creator.`,
            requestedBy,
          }),
        ],
      });
      return;
    }

    console.error('Unexpected error saat cek username:', error);
    await interaction.editReply({
      embeds: [
        buildErrorEmbed({
          title: 'Terjadi Kesalahan Tak Terduga',
          description: 'Coba lagi beberapa saat lagi. Jika terus terjadi, hubungi admin.',
          requestedBy,
        }),
      ],
    });
  }
}

async function handlePanelCommand(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: '❌ Kamu butuh permission **Manage Server** untuk pasang panel ini.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  repostingChannels.add(interaction.channelId);
  try {
    // Kalau sudah ada panel lama di channel ini, hapus dulu biar tidak dobel.
    const existing = store.getPanel(interaction.channelId);
    if (existing?.messageId) {
      const oldMessage = await interaction.channel.messages
        .fetch(existing.messageId)
        .catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => null);
    }

    const panelMessage = await interaction.channel.send({
      embeds: [buildPanelEmbed()],
      components: [buildPanelComponents()],
    });

    store.setPanel(interaction.channelId, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: panelMessage.id,
    });
  } finally {
    repostingChannels.delete(interaction.channelId);
  }

  await interaction.editReply('✅ Panel "Cek Status Akun" dipasang & sticky aktif di channel ini.');
}

async function handleUnpanelCommand(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: '❌ Kamu butuh permission **Manage Server** untuk melepas panel ini.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const existing = store.getPanel(interaction.channelId);
  if (!existing) {
    await interaction.editReply('ℹ️ Tidak ada panel aktif di channel ini.');
    return;
  }

  if (existing.messageId) {
    const oldMessage = await interaction.channel.messages.fetch(existing.messageId).catch(() => null);
    if (oldMessage) await oldMessage.delete().catch(() => null);
  }

  store.deletePanel(interaction.channelId);
  await interaction.editReply('✅ Panel "Cek Status Akun" sudah dilepas dari channel ini.');
}

function requireManageGuild(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  interaction.reply({
    content: '❌ Kamu butuh permission **Manage Server** untuk pakai command ini.',
    ephemeral: true,
  });
  return false;
}

/**
 * Setelah poin berubah: sinkronkan role top 1/2/3, lalu refresh pesan
 * leaderboard yang lagi live (kalau ada).
 */
async function afterQuizPointsChanged(interaction) {
  if (interaction.guild) {
    await syncTopRoles(interaction.guild).catch((error) => {
      console.error('[quiz] Gagal sinkron role top 1/2/3:', error);
    });
  }
  await refreshLeaderboardMessage(interaction.client).catch((error) => {
    console.error('[quiz] Gagal refresh pesan leaderboard:', error);
  });
}

async function handleQuizMenangCommand(interaction) {
  if (!requireManageGuild(interaction)) return;

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('poin') ?? 1;

  await interaction.deferReply({ ephemeral: true });

  const updatedPoints = quizStore.addPoints(targetUser.id, amount);
  await afterQuizPointsChanged(interaction);

  await interaction.editReply(
    `✅ <@${targetUser.id}> +**${amount}** poin — total sekarang **${updatedPoints}** poin.`
  );
}

async function handleQuizKurangCommand(interaction) {
  if (!requireManageGuild(interaction)) return;

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('poin') ?? 1;

  await interaction.deferReply({ ephemeral: true });

  const updatedPoints = quizStore.addPoints(targetUser.id, -amount);
  await afterQuizPointsChanged(interaction);

  await interaction.editReply(
    `✅ <@${targetUser.id}> -**${amount}** poin — total sekarang **${updatedPoints}** poin.`
  );
}

async function handleQuizSetCommand(interaction) {
  if (!requireManageGuild(interaction)) return;

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('poin', true);

  await interaction.deferReply({ ephemeral: true });

  const updatedPoints = quizStore.setPoints(targetUser.id, amount);
  await afterQuizPointsChanged(interaction);

  await interaction.editReply(`✅ Poin <@${targetUser.id}> di-set jadi **${updatedPoints}** poin.`);
}

async function handleQuizLeaderboardCommand(interaction) {
  if (!requireManageGuild(interaction)) return;

  await interaction.deferReply({ ephemeral: true });

  const existing = quizStore.getPanel();
  if (existing?.messageId) {
    const oldChannel = await interaction.client.channels.fetch(existing.channelId).catch(() => null);
    if (oldChannel) {
      const oldMessage = await oldChannel.messages.fetch(existing.messageId).catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => null);
    }
  }

  const guildIconUrl = interaction.guild?.iconURL({ size: 256 }) || null;
  const panelMessage = await interaction.channel.send({
    embeds: [buildLeaderboardEmbed(guildIconUrl)],
  });

  quizStore.setPanel({
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    messageId: panelMessage.id,
  });

  await interaction.editReply('✅ Panel Quiz Arena Leaderboard dipasang & live di channel ini.');
}

// ==================== Music / Voice 24/7 ====================

/**
 * Pastikan bot sudah konek ke SUATU voice channel di guild ini sebelum
 * lanjut proses command musik. Prioritas: voice channel tempat member yang
 * pakai command sedang berada -> kalau tidak ada, voice channel default
 * dari `MUSIC_VOICE_CHANNEL_ID`. Non-fatal: balikin null + kirim pesan error
 * sendiri kalau gagal, supaya pemanggil cukup `if (!ok) return;`.
 */
async function ensureMusicConnection(interaction) {
  const existing = musicPlayer.getState(interaction.guildId);
  if (existing?.connection) return true;

  const memberVoiceChannel = interaction.member?.voice?.channel;
  const targetChannel =
    memberVoiceChannel ||
    (config.musicVoiceChannelId
      ? await interaction.guild.channels.fetch(config.musicVoiceChannelId).catch(() => null)
      : null);

  if (!targetChannel) {
    await interaction.editReply(
      '❌ Bot belum konek ke voice channel manapun. Join dulu ke salah satu voice channel, atau minta staff jalanin `/musicjoin`.'
    );
    return false;
  }

  musicPlayer.onStateChange(interaction.guildId, () => {
    refreshMusicPanel(interaction.guildId).catch((error) =>
      console.error('[music] Gagal refresh panel musik:', error)
    );
  });

  try {
    await musicPlayer.connect(targetChannel);
    return true;
  } catch (error) {
    console.error('[music] Gagal konek voice channel:', error);
    await interaction.editReply(`❌ Gagal konek ke voice channel: ${error.message}`);
    return false;
  }
}

async function handlePlayCommand(interaction) {
  const query = interaction.options.getString('lagu', true);
  await interaction.deferReply();

  const connected = await ensureMusicConnection(interaction);
  if (!connected) return;

  let track;
  try {
    track = await resolveTrack(query);
  } catch (error) {
    await interaction.editReply(`❌ ${error.message}`);
    return;
  }

  track.requestedBy = interaction.user.id;
  const hadCurrent = Boolean(musicPlayer.getState(interaction.guildId)?.current);
  const position = musicPlayer.enqueue(interaction.guild, track);
  const isNowPlaying = position === 1 && !hadCurrent;

  await interaction.editReply({
    embeds: [buildTrackAddedEmbed(track, { position, isNowPlaying })],
  });
}

async function handleSkipCommand(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const ok = musicPlayer.skip(interaction.guildId);
  await interaction.editReply(ok ? '⏭️ Lagu di-skip.' : 'ℹ️ Tidak ada lagu yang sedang diputar.');
}

async function handlePauseCommand(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const result = musicPlayer.togglePause(interaction.guildId);
  if (result === 'paused') {
    await interaction.editReply('⏸️ Musik di-pause.');
  } else if (result === 'resumed') {
    await interaction.editReply('▶️ Musik dilanjutkan.');
  } else {
    await interaction.editReply('ℹ️ Tidak ada lagu yang sedang diputar.');
  }
}

async function handleStopCommand(interaction) {
  await interaction.deferReply({ ephemeral: true });
  musicPlayer.stopAndClear(interaction.guildId);
  await interaction.editReply('⏹️ Musik dihentikan & antrian dikosongkan.');
}

async function handleQueueCommand(interaction) {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({ embeds: [buildQueueEmbed(interaction.guildId)] });
}

async function handleVolumeCommand(interaction) {
  const percent = interaction.options.getInteger('persen', true);
  await interaction.deferReply({ ephemeral: true });
  musicPlayer.setVolume(interaction.guildId, percent / 100);
  await interaction.editReply(`🔊 Volume di-set ke **${percent}%**.`);
}

async function handleMusicJoinCommand(interaction) {
  if (!requireManageGuild(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const targetChannel =
    interaction.member?.voice?.channel ||
    (config.musicVoiceChannelId
      ? await interaction.guild.channels.fetch(config.musicVoiceChannelId).catch(() => null)
      : null);

  if (!targetChannel) {
    await interaction.editReply(
      '❌ Kamu harus join ke voice channel dulu, atau set `MUSIC_VOICE_CHANNEL_ID` di `.env`.'
    );
    return;
  }

  musicPlayer.onStateChange(interaction.guildId, () => {
    refreshMusicPanel(interaction.guildId).catch((error) =>
      console.error('[music] Gagal refresh panel musik:', error)
    );
  });

  try {
    await musicPlayer.connect(targetChannel);
    await interaction.editReply(`✅ Konek ke voice channel **${targetChannel.name}**.`);
  } catch (error) {
    await interaction.editReply(`❌ Gagal konek: ${error.message}`);
  }
}

async function handleMusicPanelCommand(interaction) {
  if (!requireManageGuild(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const existing = musicPanelStore.getPanel(interaction.guildId);
  if (existing?.messageId) {
    const oldChannel = await interaction.client.channels.fetch(existing.channelId).catch(() => null);
    if (oldChannel) {
      const oldMessage = await oldChannel.messages.fetch(existing.messageId).catch(() => null);
      if (oldMessage) await oldMessage.delete().catch(() => null);
    }
  }

  const panelMessage = await interaction.channel.send({
    embeds: [buildMusicEmbed(interaction.guildId)],
    components: buildMusicComponents(interaction.guildId),
  });

  musicPanelStore.setPanel(interaction.guildId, {
    channelId: interaction.channelId,
    messageId: panelMessage.id,
  });

  await interaction.editReply('✅ Panel kontrol musik dipasang & live di channel ini.');
}

// ==================== Member ID Card + Level ====================

async function handleIdCardPanelCommand(interaction) {
  if (!requireManageGuild(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  await interaction.channel.send({
    embeds: [buildIdCardPanelEmbed(config.community.name)],
    components: [buildIdCardPanelComponents()],
  });

  await interaction.editReply('✅ Panel "Member ID Card" dipasang di channel ini.');
}

/**
 * Render ID Card 1 member jadi attachment PNG siap dikirim. Balikin null
 * (+ pesan alasan) kalau member belum pernah bikin ID.
 */
async function buildIdCardAttachment(guild, userId, avatarUrl) {
  const card = idCardStore.getCard(guild.id, userId);
  if (!card) return null;

  const member = await guild.members.fetch(userId).catch(() => null);
  const levelInfo = levelStore.getUserLevel(guild.id, userId);

  const buffer = await renderIdCard({
    avatarUrl,
    idNo: card.idNo,
    nama: card.nama,
    jenisKelamin: card.jenisKelamin,
    domisili: card.domisili,
    citaCita: card.citaCita,
    hobi: card.hobi,
    joinedAt: member?.joinedAt || null,
    createdAt: card.createdAt,
    level: levelInfo.level,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    communityName: config.community.name,
  });

  return new AttachmentBuilder(buffer, { name: `id-card-${userId}.png` });
}

async function handleRankCommand(interaction) {
  const target = interaction.options.getUser('user') || interaction.user;
  await interaction.deferReply({ ephemeral: true });

  const levelInfo = levelStore.getUserLevel(interaction.guildId, target.id);
  await interaction.editReply(
    `📊 **${target.username}** -- Level **${levelInfo.level}** (${levelInfo.xpIntoLevel}/${levelInfo.xpForNextLevel} XP menuju level berikutnya, total ${levelInfo.totalXp} XP).`
  );
}

/**
 * Jadwalkan repost panel supaya tetap jadi pesan paling bawah/terbaru
 * (sticky), dengan debounce supaya tidak spam saat chat lagi ramai.
 */
function scheduleStickyRepost(channel) {
  const channelId = channel.id;
  if (stickyTimers.has(channelId)) clearTimeout(stickyTimers.get(channelId));

  const timer = setTimeout(async () => {
    stickyTimers.delete(channelId);

    const panel = store.getPanel(channelId);
    if (!panel) return;

    // Ditandai SEBELUM ada request network apa pun, supaya event "pesan baru"
    // untuk hapus/kirim ulang panel ini pasti diabaikan walau gateway event-nya
    // sempat nyampe lebih dulu daripada respons REST-nya (race condition yang
    // bikin panel kedip-kedip/infinite repost kalau tidak ditangani).
    repostingChannels.add(channelId);

    try {
      if (panel.messageId) {
        const oldMessage = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (oldMessage) await oldMessage.delete().catch(() => null);
      }

      const newMessage = await channel.send({
        embeds: [buildPanelEmbed()],
        components: [buildPanelComponents()],
      });

      store.setPanel(channelId, { ...panel, messageId: newMessage.id });
    } catch (error) {
      console.error(`[sticky] Gagal repost panel di channel ${channelId}:`, error);
    } finally {
      repostingChannels.delete(channelId);
    }
  }, STICKY_DEBOUNCE_MS);

  stickyTimers.set(channelId, timer);
}

/**
 * Sama seperti `scheduleStickyRepost`, tapi buat panel kontrol musik --
 * panel-nya disimpan per-guild (bukan per-channel) jadi perlu ambil ulang
 * `channelId`-nya dari store setiap kali repost.
 */
function scheduleMusicStickyRepost(channel, guildId) {
  const channelId = channel.id;
  if (musicStickyTimers.has(channelId)) clearTimeout(musicStickyTimers.get(channelId));

  const timer = setTimeout(async () => {
    musicStickyTimers.delete(channelId);

    const panel = musicPanelStore.getPanel(guildId);
    if (!panel || panel.channelId !== channelId) return;

    musicRepostingChannels.add(channelId);

    try {
      if (panel.messageId) {
        const oldMessage = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (oldMessage) await oldMessage.delete().catch(() => null);
      }

      const newMessage = await channel.send({
        embeds: [buildMusicEmbed(guildId)],
        components: buildMusicComponents(guildId),
      });

      musicPanelStore.setPanel(guildId, { channelId, messageId: newMessage.id });
    } catch (error) {
      console.error(`[music-sticky] Gagal repost panel musik di channel ${channelId}:`, error);
    } finally {
      musicRepostingChannels.delete(channelId);
    }
  }, STICKY_DEBOUNCE_MS);

  musicStickyTimers.set(channelId, timer);
}

client.on('messageCreate', (message) => {
  if (!message.guild) return;

  // ==== Level system: kasih XP buat pesan asli dari member (bukan bot) ====
  // Non-fatal & murah (baca/tulis JSON kecil) -- ada cooldown 1 menit per
  // user di dalam tryAddXp sendiri, jadi aman dipanggil tiap pesan tanpa
  // takut spam XP.
  if (!message.author.bot) {
    try {
      const result = levelStore.tryAddXp(message.guildId, message.author.id);
      if (result?.leveledUp) {
        message.channel
          .send(`🎉 Selamat <@${message.author.id}>, kamu naik ke **Level ${result.level}**!`)
          .catch((error) => console.error('[level] Gagal kirim notif level up:', error));
      }
    } catch (error) {
      console.error('[level] Gagal proses XP:', error);
    }
  }

  // Sedang proses hapus+kirim-ulang panel di channel ini -> abaikan dulu,
  // supaya echo dari aksi kita sendiri tidak dianggap "pesan baru dari user".
  const reposting = repostingChannels.has(message.channelId) || musicRepostingChannels.has(message.channelId);
  if (reposting) return;

  const panel = store.getPanel(message.channelId);
  const musicPanel = musicPanelStore.getPanel(message.guildId);

  // Kalau pesan ini PERSIS salah satu panel yang sedang aktif (eligibility
  // ATAU musik), jangan dipakai buat memicu sticky panel MANAPUN. Tanpa
  // pengecekan silang ini, repost satu panel akan dianggap "pesan baru" oleh
  // panel yang lain (kalau dipasang di channel yang sama) dan memicu repost
  // balik tanpa henti. Pesan lain (termasuk balasan interaction seperti
  // hasil /verifikasi atau embed "Added Track", yang justru HARUS memicu
  // sticky) tetap diproses normal di bawah.
  const isOwnPanelMessage =
    (panel && panel.messageId === message.id) || (musicPanel && musicPanel.messageId === message.id);
  if (isOwnPanelMessage) return;

  if (panel) {
    scheduleStickyRepost(message.channel);
  }

  if (musicPanel && musicPanel.channelId === message.channelId) {
    scheduleMusicStickyRepost(message.channel, message.guildId);
  }
});

/**
 * Kirim pesan + gambar "Terima kasih" boost ke channel boost untuk satu
 * member, lalu catat di boostStore supaya tidak dikirim dobel (baik oleh
 * event live maupun oleh /boost-sync). Dipakai bareng oleh event
 * `guildMemberUpdate` dan command `/boost-sync`.
 * @returns {Promise<boolean>} true kalau berhasil dikirim
 */
async function sendBoostThankYou(guild, member, { force = false } = {}) {
  if (!force && boostStore.isNotified(member.id)) return false;

  if (!config.boostChannelId) {
    console.warn('[boost] BOOST_CHANNEL_ID belum diisi di .env, notifikasi boost dilewati.');
    return false;
  }

  const channel = await guild.channels.fetch(config.boostChannelId).catch(() => null);
  if (!channel) {
    console.error(`[boost] Channel ${config.boostChannelId} tidak ditemukan/tidak bisa diakses.`);
    return false;
  }

  const boostNumber = guild.premiumSubscriptionCount || 0;

  let imageBuffer = null;
  try {
    imageBuffer = await renderBoostCard({
      avatarUrl: member.displayAvatarURL({ extension: 'png', size: 256 }),
      username: member.user.username,
      boostNumber,
      communityName: config.community.name,
    });
  } catch (error) {
    console.error('[boost] Gagal generate gambar boost:', error);
  }

  const payload = {
    content: `🎉 Terima kasih! **${member.displayName}** baru saja melakukan Boost pada server!`,
  };
  if (imageBuffer) {
    payload.files = [{ attachment: imageBuffer, name: 'boost-thanks.png' }];
  }

  const sent = await channel.send(payload).catch((error) => {
    console.error('[boost] Gagal kirim pesan boost:', error);
    return null;
  });

  if (sent) {
    boostStore.markNotified(member.id);
    return true;
  }
  return false;
}

/**
 * Deteksi member yang BARU MULAI boost server (premiumSince berubah dari
 * kosong -> terisi), lalu kirim pesan + gambar "Terima kasih" ke channel
 * boost. Non-fatal di setiap langkah: kalau channel/gambar gagal, cukup
 * di-log tanpa bikin bot crash.
 */
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    const wasBoosting = Boolean(oldMember.premiumSinceTimestamp);
    const isBoosting = Boolean(newMember.premiumSinceTimestamp);
    console.log(
      `[boost] guildMemberUpdate diterima untuk ${newMember.user.tag} (wasBoosting=${wasBoosting}, isBoosting=${isBoosting})`
    );
    if (wasBoosting || !isBoosting) return; // hanya trigger pas baru mulai boost, bukan lanjut boost

    await sendBoostThankYou(newMember.guild, newMember);
  } catch (error) {
    console.error('[boost] Gagal proses guildMemberUpdate:', error);
  }
});

/**
 * Backfill: kirim notif "Terima kasih boost" untuk semua member yang SAAT
 * INI sedang boost tapi belum pernah dikirimi notif (misalnya boost terjadi
 * sebelum bot online / sebelum intent GuildMembers aktif, jadi event live-nya
 * kelewat). Staff-only, khusus buat nutup notif yang kelewat itu.
 */
async function handleBoostSyncCommand(interaction) {
  if (!requireManageGuild(interaction)) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;

  // Cache member sudah di-warm sekali pas bot startup (lihat handler
  // `clientReady`). Kalau cache-nya sudah lengkap, langsung pakai itu — tidak
  // perlu fetch ulang ke Discord, karena request "REQUEST_GUILD_MEMBERS"
  // (opcode 8) gampang kena rate limit kalau dipanggil berkali-kali dalam
  // waktu berdekatan (misalnya /boost-sync dijalankan tidak lama setelah
  // bot baru restart).
  let members = guild.members.cache;
  if (members.size < guild.memberCount) {
    members = await guild.members.fetch().catch((error) => {
      console.error('[boost] Gagal fetch member guild (boost-sync):', error);
      return null;
    });

    if (!members) {
      // Fetch gagal (misal kena rate limit) -> tetap coba pakai cache yang
      // ada sekarang daripada langsung gagal total.
      members = guild.members.cache;
      if (members.size === 0) {
        await interaction.editReply(
          '❌ Gagal fetch daftar member guild dan cache masih kosong. Cek log server (`pm2 logs mantra-eligible-bot`) untuk detail error-nya, lalu coba lagi sebentar (kemungkinan kena rate limit Discord, biasanya reda dalam ~30 detik).'
        );
        return;
      }
      console.warn(
        `[boost] Fetch gagal, lanjut pakai cache seadanya (${members.size}/${guild.memberCount} member).`
      );
    }
  }

  const force = interaction.options.getBoolean('force') ?? false;

  const boosters = members.filter(
    (m) => Boolean(m.premiumSinceTimestamp) && (force || !boostStore.isNotified(m.id))
  );

  if (boosters.size === 0) {
    await interaction.editReply('ℹ️ Tidak ada booster yang belum dikirimi notif — semua sudah ter-cover.');
    return;
  }

  let successCount = 0;
  for (const member of boosters.values()) {
    const ok = await sendBoostThankYou(interaction.guild, member, { force });
    if (ok) successCount += 1;
  }

  await interaction.editReply(
    force
      ? `✅ Selesai. Terkirim ulang **${successCount}/${boosters.size}** notif boost (mode force).`
      : `✅ Selesai. Terkirim **${successCount}/${boosters.size}** notif boost yang sebelumnya kelewat.`
  );
}

client.on('interactionCreate', async (interaction) => {
  // ==== Slash commands ====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'verifikasi') {
      const username = interaction.options.getString('username', true).trim();
      await interaction.deferReply();
      await handleUsernameCheck(interaction, username);
      return;
    }

    if (interaction.commandName === 'panel') {
      await handlePanelCommand(interaction);
      return;
    }

    if (interaction.commandName === 'unpanel') {
      await handleUnpanelCommand(interaction);
      return;
    }

    if (interaction.commandName === 'quiz-menang') {
      await handleQuizMenangCommand(interaction);
      return;
    }

    if (interaction.commandName === 'quiz-kurang') {
      await handleQuizKurangCommand(interaction);
      return;
    }

    if (interaction.commandName === 'quiz-set') {
      await handleQuizSetCommand(interaction);
      return;
    }

    if (interaction.commandName === 'quiz-leaderboard') {
      await handleQuizLeaderboardCommand(interaction);
      return;
    }

    if (interaction.commandName === 'boost-sync') {
      await handleBoostSyncCommand(interaction);
      return;
    }

    if (interaction.commandName === 'play') {
      await handlePlayCommand(interaction);
      return;
    }

    if (interaction.commandName === 'skip') {
      await handleSkipCommand(interaction);
      return;
    }

    if (interaction.commandName === 'pause') {
      await handlePauseCommand(interaction);
      return;
    }

    if (interaction.commandName === 'stop') {
      await handleStopCommand(interaction);
      return;
    }

    if (interaction.commandName === 'queue') {
      await handleQueueCommand(interaction);
      return;
    }

    if (interaction.commandName === 'volume') {
      await handleVolumeCommand(interaction);
      return;
    }

    if (interaction.commandName === 'musicjoin') {
      await handleMusicJoinCommand(interaction);
      return;
    }

    if (interaction.commandName === 'musicpanel') {
      await handleMusicPanelCommand(interaction);
      return;
    }

    if (interaction.commandName === 'idcardpanel') {
      await handleIdCardPanelCommand(interaction);
      return;
    }

    if (interaction.commandName === 'rank') {
      await handleRankCommand(interaction);
      return;
    }

    return;
  }

  // ==== Tombol "🪪 Buat ID" di panel ID Card -> buka modal isian data ====
  // Sama seperti tombol "▶️ Play" musik, showModal HARUS jadi respons
  // pertama, jadi ditangani terpisah sebelum handler tombol lainnya.
  if (interaction.isButton() && interaction.customId === IDCARD_BTN_CREATE_ID) {
    const existing = idCardStore.getCard(interaction.guildId, interaction.user.id);
    await interaction.showModal(buildIdCardModal(existing));
    return;
  }

  // ==== Tombol "🔍 Lihat ID Saya" di panel ID Card ====
  if (interaction.isButton() && interaction.customId === IDCARD_BTN_VIEW_ID) {
    await interaction.deferReply({ ephemeral: true });

    const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
    const attachment = await buildIdCardAttachment(interaction.guild, interaction.user.id, avatarUrl).catch(
      (error) => {
        console.error('[idcard] Gagal render ID card:', error);
        return undefined;
      }
    );

    if (attachment === undefined) {
      await interaction.editReply('❌ Gagal membuat gambar ID Card. Coba lagi beberapa saat.');
      return;
    }
    if (!attachment) {
      await interaction.editReply('ℹ️ Kamu belum punya ID Card. Klik tombol **🪪 Buat ID** dulu.');
      return;
    }

    await interaction.editReply({ files: [attachment] });
    return;
  }

  // ==== Tombol "▶️ Play" di panel musik -> buka modal input link/judul ====
  // Harus jadi respons PERTAMA ke interaction ini (showModal tidak bisa
  // dipanggil setelah reply/defer), jadi ditangani terpisah dari tombol
  // musik lainnya di bawah.
  if (interaction.isButton() && interaction.customId === MUSIC_BTN_PLAY) {
    await interaction.showModal(buildPlayModal());
    return;
  }

  // ==== Tombol "📋 Queue" di panel musik -> tampilkan daftar antrian ====
  // Cuma nampilin embed (ephemeral, cuma yang klik yang lihat), gak ubah
  // state player apa pun, jadi tidak perlu refresh panel setelahnya.
  if (interaction.isButton() && interaction.customId === MUSIC_BTN_QUEUE) {
    await interaction.reply({
      embeds: [buildQueueEmbed(interaction.guildId)],
      ephemeral: true,
    });
    return;
  }

  // ==== Tombol panel kontrol musik lainnya ====
  if (
    interaction.isButton() &&
    [MUSIC_BTN_TOGGLE, MUSIC_BTN_SKIP, MUSIC_BTN_STOP, MUSIC_BTN_AUTOPLAY].includes(interaction.customId)
  ) {
    const guildId = interaction.guildId;

    if (interaction.customId === MUSIC_BTN_TOGGLE) {
      const result = musicPlayer.togglePause(guildId);
      await interaction.reply({
        content: result ? '✅ Diproses.' : 'ℹ️ Tidak ada lagu yang sedang diputar.',
      });
    } else if (interaction.customId === MUSIC_BTN_SKIP) {
      const ok = musicPlayer.skip(guildId);
      await interaction.reply({
        content: ok ? '⏭️ Lagu di-skip.' : 'ℹ️ Tidak ada lagu yang sedang diputar.',
      });
    } else if (interaction.customId === MUSIC_BTN_STOP) {
      musicPlayer.stopAndClear(guildId);
      await interaction.reply({ content: '⏹️ Musik dihentikan & antrian dikosongkan.' });
    } else if (interaction.customId === MUSIC_BTN_AUTOPLAY) {
      const enabled = musicPlayer.toggleAutoplay(guildId);
      await interaction.reply({
        content: enabled
          ? '🔁 Autoplay diaktifkan -- bot akan otomatis lanjut ke lagu senada kalau antrian habis.'
          : '⚪ Autoplay dimatikan.',
        ephemeral: true,
      });
    }

    await refreshMusicPanel(guildId).catch((error) =>
      console.error('[music] Gagal refresh panel musik setelah tombol dipencet:', error)
    );
    return;
  }

  // ==== Tombol "Cek Akun Anda" di panel -> buka modal ====
  if (interaction.isButton()) {
    if (interaction.customId === CHECK_BUTTON_ID) {
      await interaction.showModal(buildCheckModal());
    }
    return;
  }

  // ==== Submit modal username dari panel ====
  if (interaction.isModalSubmit()) {
    if (interaction.customId === CHECK_MODAL_ID) {
      const username = interaction.fields.getTextInputValue(CHECK_MODAL_USERNAME_ID).trim();
      await interaction.deferReply();
      await handleUsernameCheck(interaction, username);
      return;
    }

    // ==== Submit modal "▶️ Play" dari panel musik ====
    if (interaction.customId === MUSIC_MODAL_PLAY_ID) {
      const query = interaction.fields.getTextInputValue(MUSIC_MODAL_PLAY_INPUT_ID).trim();
      await interaction.deferReply();

      const connected = await ensureMusicConnection(interaction);
      if (!connected) return;

      let track;
      try {
        track = await resolveTrack(query);
      } catch (error) {
        await interaction.editReply(`❌ ${error.message}`);
        return;
      }

      track.requestedBy = interaction.user.id;
      const hadCurrent = Boolean(musicPlayer.getState(interaction.guildId)?.current);
      const position = musicPlayer.enqueue(interaction.guild, track);
      const isNowPlaying = position === 1 && !hadCurrent;

      await interaction.editReply({
        embeds: [buildTrackAddedEmbed(track, { position, isNowPlaying })],
      });

      await refreshMusicPanel(interaction.guildId).catch((error) =>
        console.error('[music] Gagal refresh panel musik setelah play via modal:', error)
      );
      return;
    }

    // ==== Submit modal "Buat ID Card" ====
    if (interaction.customId === IDCARD_MODAL_ID) {
      await interaction.deferReply({ ephemeral: true });

      idCardStore.upsertCard(interaction.guildId, interaction.user.id, {
        nama: interaction.fields.getTextInputValue(IDCARD_MODAL_NAMA_ID).trim(),
        jenisKelamin: interaction.fields.getTextInputValue(IDCARD_MODAL_GENDER_ID).trim(),
        domisili: interaction.fields.getTextInputValue(IDCARD_MODAL_DOMISILI_ID).trim(),
        citaCita: interaction.fields.getTextInputValue(IDCARD_MODAL_CITACITA_ID).trim(),
        hobi: interaction.fields.getTextInputValue(IDCARD_MODAL_HOBI_ID).trim(),
      });

      const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
      const attachment = await buildIdCardAttachment(interaction.guild, interaction.user.id, avatarUrl).catch(
        (error) => {
          console.error('[idcard] Gagal render ID card setelah submit modal:', error);
          return undefined;
        }
      );

      if (!attachment) {
        await interaction.editReply('✅ Data ID Card kamu tersimpan, tapi gagal generate gambarnya. Coba klik **🔍 Lihat ID Saya** lagi.');
        return;
      }

      await interaction.editReply({ content: '✅ ID Card kamu berhasil dibuat!', files: [attachment] });
      return;
    }

    return;
  }
});

client.login(config.discordToken).catch((error) => {
  console.error('❌ Gagal login ke Discord. Cek DISCORD_TOKEN di .env.', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Jaring pengaman terakhir: exception yang lolos dari semua try/catch (misal
// event 'error' dari EventEmitter tanpa listener, seperti kasus VoiceConnection
// sebelumnya) sebelumnya bikin proses mati TOTAL tanpa stack trace yang jelas
// -> bot restart terus-menerus dan fitur lain (verifikasi, dst) ikut kena
// imbas. Sekarang cukup di-log, bot tetap jalan.
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception (bot tetap jalan):', error);
});
