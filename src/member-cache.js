/**
 * Cache member per-guild yang disinkronkan lewat event gateway (intent
 * GuildMembers), bukan fetch berulang. Tujuannya: request opcode 8
 * ("Request Guild Members") ke Discord cuma dilakukan SEKALI per guild
 * (saat bot baru nyala / pertama kali dibutuhkan) -- setelahnya semua
 * fitur (member-list, filter, search, dst) baca dari cache di memori,
 * jadi nggak mungkin lagi kena rate-limit opcode 8.
 *
 * 1. Ambil sekali saja -- lihat primeGuildCache().
 * 2. Cache ter-update sendiri lewat guildMemberAdd/Remove/Update -- lihat
 *    initMemberCache().
 * 3. Fitur lain baca dari cache -- lihat getGuildMembers().
 * 4. Permintaan bersamaan digabung (inflightFetches), dan kalau tetap kena
 *    rate-limit, nunggu sesuai retry_after dari Discord lalu coba lagi --
 *    lihat fetchWithRetry().
 */

// guildId -> Map<memberId, entry>
const guildMemberCaches = new Map();
// guildId -> Promise (request yang masih berjalan, buat di-gabung kalau
// ada beberapa fitur minta daftar member guild yang sama bersamaan)
const inflightFetches = new Map();

function toEntry(member) {
  return {
    id: member.id,
    tag: member.user.tag,
    displayName: member.displayName,
    bot: member.user.bot,
    joinedTimestamp: member.joinedTimestamp,
  };
}

/**
 * Fetch seluruh member guild dari Discord, dengan retry otomatis kalau
 * kena rate-limit opcode 8 -- nunggu persis sesuai `retry_after` yang
 * dikasih Discord (plus sedikit buffer), bukan nebak-nebak.
 */
async function fetchWithRetry(guild, { maxRetries = 3 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await guild.members.fetch();
    } catch (error) {
      const retryAfterSec = error?.data?.retry_after;
      attempt += 1;
      if (retryAfterSec && attempt <= maxRetries) {
        const waitMs = Math.ceil(retryAfterSec * 1000) + 250;
        console.warn(
          `[member-cache] Kena rate-limit opcode 8 di guild ${guild.id}, nunggu ${(waitMs / 1000).toFixed(1)}s lalu coba lagi (percobaan ${attempt}/${maxRetries})...`
        );
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Isi cache sebuah guild (sekali saja). Kalau sudah pernah diisi,
 * langsung return cache yang ada. Kalau sedang dalam proses fetch,
 * request baru ikut "nebeng" promise yang sama (request coalescing) --
 * jadi dipanggil barengan dari beberapa tempat tetap cuma 1x fetch ke
 * Discord.
 */
async function primeGuildCache(guild) {
  if (guildMemberCaches.has(guild.id)) {
    return guildMemberCaches.get(guild.id);
  }

  if (inflightFetches.has(guild.id)) {
    return inflightFetches.get(guild.id);
  }

  const promise = (async () => {
    const members = await fetchWithRetry(guild);
    const cache = new Map();
    members.forEach((member) => cache.set(member.id, toEntry(member)));
    guildMemberCaches.set(guild.id, cache);
    return cache;
  })();

  inflightFetches.set(guild.id, promise);
  try {
    return await promise;
  } finally {
    inflightFetches.delete(guild.id);
  }
}

/**
 * Ambil daftar member (array of entry) sebuah guild. Kalau cache guild
 * ini belum pernah diisi, baru fetch sekali lewat primeGuildCache();
 * setelah itu selalu baca dari cache tanpa request baru ke Discord.
 */
async function getGuildMembers(guild) {
  const cache = await primeGuildCache(guild);
  return Array.from(cache.values());
}

function isGuildPrimed(guildId) {
  return guildMemberCaches.has(guildId);
}

function upsertMember(member) {
  const cache = guildMemberCaches.get(member.guild.id);
  // Guild belum pernah di-prime -- biarkan saja, nanti ke-fetch utuh
  // (sudah termasuk member ini) pas pertama kali benar-benar dibutuhkan.
  if (!cache) return;
  cache.set(member.id, toEntry(member));
}

function removeMember(member) {
  const cache = guildMemberCaches.get(member.guild.id);
  if (!cache) return;
  cache.delete(member.id);
}

/**
 * Pasang listener event gateway supaya cache tiap guild otomatis
 * ter-update real-time (member masuk/keluar/ganti nickname atau role),
 * tanpa perlu fetch ulang ke Discord sama sekali. Panggil ini SEKALI
 * waktu bot start (event 'ready').
 */
function initMemberCache(client) {
  client.on('guildMemberAdd', (member) => upsertMember(member));
  client.on('guildMemberRemove', (member) => removeMember(member));
  // guildMemberUpdate nyakup ganti nickname & ganti role (keduanya emit
  // event yang sama di discord.js).
  client.on('guildMemberUpdate', (oldMember, newMember) => upsertMember(newMember));
}

/**
 * Prime cache semua guild yang bot ini ada di dalamnya -- dipanggil
 * sekali waktu bot baru nyala (event 'ready'), fire-and-forget (nggak
 * nge-block proses startup lain). Kalau sampai gagal, nggak masalah --
 * nanti tetap ke-prime on-demand pas ada fitur yang butuh (getGuildMembers).
 */
function primeAllGuilds(client) {
  for (const guild of client.guilds.cache.values()) {
    primeGuildCache(guild).catch((error) =>
      console.error(`[member-cache] Gagal prime cache member guild ${guild.id} saat startup:`, error)
    );
  }
}

module.exports = {
  initMemberCache,
  primeAllGuilds,
  getGuildMembers,
  isGuildPrimed,
};
