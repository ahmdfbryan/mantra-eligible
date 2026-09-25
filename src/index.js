const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Debounce per-channel supaya panel sticky tidak spam re-post saat chat ramai.
const STICKY_DEBOUNCE_MS = 1500;
const stickyTimers = new Map();

client.once('clientReady', () => {
  console.log(`🤖 Login sebagai ${client.user.tag}`);
});

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

  // Kalau sudah ada panel lama di channel ini, hapus dulu biar tidak dobel.
  const existing = store.getPanel(interaction.channelId);
  if (existing?.messageId) {
    const oldMessage = await interaction.channel.messages.fetch(existing.messageId).catch(() => null);
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
    }
  }, STICKY_DEBOUNCE_MS);

  stickyTimers.set(channelId, timer);
}

client.on('messageCreate', (message) => {
  if (!message.guild) return;

  const panel = store.getPanel(message.channelId);
  if (!panel) return;

  // Hindari loop: jangan re-trigger kalau pesan ini adalah panel itu sendiri.
  // Pesan LAIN dari bot (misalnya hasil pengecekan dari modal) tetap harus
  // memicu sticky, jadi jangan filter berdasarkan author bot secara umum.
  if (panel.messageId === message.id) return;

  scheduleStickyRepost(message.channel);
});

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
