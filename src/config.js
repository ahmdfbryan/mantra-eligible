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

  // ==== Welcome Card ====
  // Channel tempat kartu + embed welcome dikirim tiap ada member baru join.
  // WAJIB diisi -- kalau kosong, fitur welcome tidak aktif (cuma di-log).
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || null,
  // Channel yang dituju tombol "📜 Rules" dan "🎭 Take Role" di embed welcome.
  welcomeRulesChannelId: process.env.WELCOME_RULES_CHANNEL_ID || '1546874949690728545',
  welcomeTakeRoleChannelId: process.env.WELCOME_TAKE_ROLE_CHANNEL_ID || '1546890906475696188',

  // ==== Take Role ====
  // Role gender (saling eksklusif -- ambil satu otomatis lepas yang lain).
  genderRoles: {
    boys: process.env.ROLE_MC_BOYS || '1546892185558056960',
    girls: process.env.ROLE_MC_GIRLS || '1546892258572501042',
  },
  // Role game favorit (boleh ambil lebih dari satu, independen satu sama lain).
  gameRoles: {
    roblox: process.env.ROLE_GAME_ROBLOX || '1558938545371222076',
    mobileLegends: process.env.ROLE_GAME_ML || '1558938383181553836',
    pubg: process.env.ROLE_GAME_PUBG || '1558938735658139659',
    freeFire: process.env.ROLE_GAME_FF || '1558939013094707200',
  },
  // Emoji custom server (sudah di-upload di Mantra Creative) buat ikon
  // tombol & teks di panel Take Role, ganti emoji unicode biasa.
  gameEmojis: {
    roblox: process.env.EMOJI_GAME_ROBLOX || '1558945799495225405',
    mobileLegends: process.env.EMOJI_GAME_ML || '1558946488854384681',
    pubg: process.env.EMOJI_GAME_PUBG || '1558946583008256061',
    freeFire: process.env.EMOJI_GAME_FF || '1558946703527256078',
  },

  // ==== Store / Ticket Order ====
  store: {
    // Channel tempat panel "Store" (dropdown pilih produk) dipasang.
    panelChannelId: process.env.STORE_PANEL_CHANNEL_ID || '1559059457806303353',
    // Channel tempat testimoni pembeli diposting setelah ticket Completed.
    testimonialChannelId: process.env.STORE_TESTIMONIAL_CHANNEL_ID || '1559059134098440192',
    // Channel tempat panel "Top 10 Spender Leaderboard" (sticky) dipasang.
    leaderboardChannelId: process.env.STORE_LEADERBOARD_CHANNEL_ID || '1559058905319870504',
    // Role staff yang berhak menutup & mengakses ticket.
    staffRoleId: process.env.STORE_STAFF_ROLE_ID || '1546870723216150639',
    // Prefix nama category tempat channel ticket dibuat otomatis. Kalau 1
    // category sudah penuh (50 channel, limit Discord), bot otomatis bikin
    // category baru dengan suffix angka (mis. "🎫 Tickets 2").
    ticketCategoryPrefix: process.env.STORE_TICKET_CATEGORY_PREFIX || '🎫 Tickets',
    // Rate harga Robux per 100 Robux (linear -- 200 Robux = 2x rate, dst).
    robuxRatePer100: Number(process.env.STORE_ROBUX_RATE_PER_100 || 12000),
    robuxOptions: [
      100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
      1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
    ],
    // Emoji custom server buat ikon Robux (ganti emoji unicode 💎).
    robuxEmoji: {
      id: process.env.EMOJI_ROBUX_ID || '1559070786088730735',
      name: process.env.EMOJI_ROBUX_NAME || 'robux',
    },
    // Channel tempat pengumuman update stock Robux harian dikirim (tag
    // @everyone tiap admin set stock baru lewat /toko-stock).
    stockAnnounceChannelId: process.env.STORE_STOCK_ANNOUNCE_CHANNEL_ID || '1559188375552925727',
  },
};
