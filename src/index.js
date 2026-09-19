const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { lookupMember, getGroupIconUrl, RobloxApiError } = require('./roblox');
const {
  buildEligibilityEmbed,
  buildNotMemberEmbed,
  buildErrorEmbed,
  buildProfileButtonRow,
} = require('./ui');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('clientReady', () => {
  console.log(`🤖 Login sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'verifikasi') return;

  const username = interaction.options.getString('username', true).trim();
  const requestedBy = interaction.user.username;

  await interaction.deferReply();

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
          embeds: [
            buildErrorEmbed({
              title: 'Username Tidak Ditemukan',
              description: `❌ Username Roblox \`${username}\` tidak ditemukan. Periksa lagi ejaannya.`,
              requestedBy,
            }),
          ],
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

    console.error('Unexpected error saat /verifikasi:', error);
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
});

client.login(config.discordToken).catch((error) => {
  console.error('❌ Gagal login ke Discord. Cek DISCORD_TOKEN di .env.', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
