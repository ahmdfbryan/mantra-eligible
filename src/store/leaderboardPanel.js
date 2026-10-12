const { EmbedBuilder } = require('discord.js');
const { COLOR_PINK, formatRupiah } = require('./storePanel');
const ticketStore = require('./ticketStore');

const MEDALS = ['🥇', '🥈', '🥉'];

function formatEntry(entry, index) {
  const rank = index + 1;
  const prefix = rank <= 3 ? MEDALS[rank - 1] : `**${rank}.**`;
  return `${prefix} <@${entry.userId}> — **${formatRupiah(entry.total)}**`;
}

/**
 * Embed "Top 10 Spender Leaderboard" -- sticky, auto-refresh tiap kali ada
 * ticket Completed (lihat refreshStoreLeaderboard di index.js).
 */
function buildLeaderboardEmbed({ guildIconUrl, communityName }) {
  const top = ticketStore.getTopSpenders(10);
  const name = communityName || 'MANTRA CREATIVE';

  const embed = new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle(`🏆 Top 10 Spender Leaderboard | ${name} STORE`)
    .setThumbnail(guildIconUrl || null)
    .setTimestamp(new Date())
    .setFooter({ text: name });

  if (top.length === 0) {
    embed.setDescription('Belum ada pembeli. Jadilah yang pertama belanja di Store! 🛍️');
    return embed;
  }

  embed.setDescription(top.map((entry, i) => formatEntry(entry, i)).join('\n\n'));
  return embed;
}

module.exports = { buildLeaderboardEmbed };
