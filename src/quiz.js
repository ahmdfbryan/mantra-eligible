const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const store = require('./quizStore');

const MEDALS = ['🥇', '🥈', '🥉'];

function formatEntry(entry, index) {
  const rank = index + 1;
  const prefix = rank <= 3 ? MEDALS[rank - 1] : `**${rank}.**`;
  return `${prefix} <@${entry.userId}> — **${entry.points}** poin`;
}

/**
 * Embed leaderboard: Top 1-3 (medali) di description, lalu Top 4-10 dan
 * Top 11-20 masing-masing jadi field terpisah.
 */
function buildLeaderboardEmbed() {
  const leaderboard = store.getSortedLeaderboard();

  const embed = new EmbedBuilder()
    .setColor(0xf5a623)
    .setTitle('🏆 Quiz Arena Leaderboard')
    .setTimestamp(new Date())
    .setFooter({ text: config.community.name });

  if (leaderboard.length === 0) {
    embed.setDescription('Belum ada peserta yang punya poin. Menangkan quiz untuk masuk leaderboard! 🎯');
    return embed;
  }

  const top3 = leaderboard.slice(0, 3);
  const top4to10 = leaderboard.slice(3, 10);
  const top11to20 = leaderboard.slice(10, 20);

  embed.setDescription(top3.map((entry, i) => formatEntry(entry, i)).join('\n'));

  if (top4to10.length > 0) {
    embed.addFields({
      name: 'Top 4 - 10',
      value: top4to10.map((entry, i) => formatEntry(entry, i + 3)).join('\n'),
      inline: false,
    });
  }

  if (top11to20.length > 0) {
    embed.addFields({
      name: 'Top 11 - 20',
      value: top11to20.map((entry, i) => formatEntry(entry, i + 10)).join('\n'),
      inline: false,
    });
  }

  if (leaderboard.length > 20) {
    embed.addFields({
      name: '​',
      value: `-# +${leaderboard.length - 20} peserta lainnya`,
      inline: false,
    });
  }

  return embed;
}

/**
 * Samakan role top 1/2/3 dengan posisi leaderboard sekarang. Dipanggil
 * setiap kali ada perubahan poin. Non-fatal: kalau fetch member/role gagal
 * (user keluar server, dll), di-skip tanpa bikin proses lain gagal.
 */
async function syncTopRoles(guild) {
  if (!guild) return;

  const leaderboard = store.getSortedLeaderboard();
  const newTop = {
    1: leaderboard[0]?.userId || null,
    2: leaderboard[1]?.userId || null,
    3: leaderboard[2]?.userId || null,
  };
  const oldTop = store.getTopRoles();
  const roleIds = config.quizTopRoles;

  for (const rank of [1, 2, 3]) {
    const oldUserId = oldTop[rank];
    const newUserId = newTop[rank];
    if (oldUserId === newUserId) continue;

    const roleId = roleIds[rank];
    if (!roleId) continue;

    if (oldUserId) {
      const oldMember = await guild.members.fetch(oldUserId).catch(() => null);
      if (oldMember) {
        await oldMember.roles.remove(roleId).catch((error) => {
          console.error(`[quiz] Gagal lepas role top${rank} dari ${oldUserId}:`, error.message);
        });
      }
    }

    if (newUserId) {
      const newMember = await guild.members.fetch(newUserId).catch(() => null);
      if (newMember) {
        await newMember.roles.add(roleId).catch((error) => {
          console.error(`[quiz] Gagal pasang role top${rank} ke ${newUserId}:`, error.message);
        });
      }
    }
  }

  store.setTopRoles(newTop);
}

/**
 * Edit ulang pesan leaderboard yang lagi live (kalau ada) supaya selalu
 * menampilkan data terbaru. Kalau pesan/channel-nya sudah tidak ada,
 * lokasi panel dibersihkan otomatis dari store.
 */
async function refreshLeaderboardMessage(client) {
  const panel = store.getPanel();
  if (!panel) return;

  try {
    const channel = await client.channels.fetch(panel.channelId).catch(() => null);
    if (!channel) {
      store.clearPanel();
      return;
    }

    const message = await channel.messages.fetch(panel.messageId).catch(() => null);
    if (!message) {
      store.clearPanel();
      return;
    }

    await message.edit({ embeds: [buildLeaderboardEmbed()] });
  } catch (error) {
    console.error('[quiz] Gagal refresh pesan leaderboard:', error);
  }
}

module.exports = { buildLeaderboardEmbed, syncTopRoles, refreshLeaderboardMessage };
