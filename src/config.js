require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Variabel ${name} belum diisi di .env`);
  }
  return value;
}

module.exports = {
  discordToken: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: process.env.GUILD_ID || null,

  robloxGroupId: required('ROBLOX_GROUP_ID'),
  robloxApiKey: required('ROBLOX_API_KEY'),

  eligibilityDays: Number(process.env.ELIGIBILITY_DAYS || 14),

  colors: {
    eligible: parseInt(process.env.EMBED_COLOR_ELIGIBLE || '2ECC71', 16),
    pending: parseInt(process.env.EMBED_COLOR_PENDING || 'F1C40F', 16),
    notMember: parseInt(process.env.EMBED_COLOR_NOT_MEMBER || 'E74C3C', 16),
    error: parseInt('992D22', 16),
  },

  community: {
    name: process.env.COMMUNITY_NAME || 'MANTRA CREATIVE',
    url:
      process.env.COMMUNITY_URL ||
      'https://www.roblox.com/id/communities/783602348/MANTRA-CREATIVE',
  },

  // Role yang otomatis dipasang ke Top 1/2/3 Quiz Arena Leaderboard.
  quizTopRoles: {
    1: process.env.QUIZ_ROLE_TOP1 || '1553133641587105942',
    2: process.env.QUIZ_ROLE_TOP2 || '1553133806456930435',
    3: process.env.QUIZ_ROLE_TOP3 || '1553133866460647485',
  },

  // Channel tempat pesan + gambar "Terima kasih boost" dikirim.
  boostChannelId: process.env.BOOST_CHANNEL_ID || null,

  // ==== Music / Voice 24/7 ====
  // Voice channel yang bot otomatis join & tetap "nempel" di situ 24/7.
  musicVoiceChannelId: process.env.MUSIC_VOICE_CHANNEL_ID || null,
  // Channel teks tempat panel kontrol musik (sticky) dipasang.
  musicPanelChannelId: process.env.MUSIC_PANEL_CHANNEL_ID || null,

  // ==== Member ID Card + Level ====
  // Channel tempat notif "Level Up!" (+ gambar) dikirim. Kosongkan supaya
  // notif dikirim di channel yang sama tempat member itu chat.
  levelUpChannelId: process.env.LEVEL_UP_CHANNEL_ID || null,

  // Role yang otomatis dipasang begitu member mencapai LEVEL_VERIFIED_MIN_LEVEL
  // (default level 10). Kosongkan LEVEL_VERIFIED_ROLE_ID untuk mematikan fitur ini.
  levelVerifiedRoleId: process.env.LEVEL_VERIFIED_ROLE_ID || '1549779005945684078',
  levelVerifiedMinLevel: Number(process.env.LEVEL_VERIFIED_MIN_LEVEL || 10),
};
