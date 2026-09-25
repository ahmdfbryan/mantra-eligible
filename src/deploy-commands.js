const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('verifikasi')
    .setDescription('Cek eligibility member Roblox (minimal hari bergabung di komunitas)')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Username Roblox yang mau dicek')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Pasang panel "Cek Status Akun" (sticky) di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('unpanel')
    .setDescription('Lepas panel "Cek Status Akun" dari channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('quiz-menang')
    .setDescription('Tambah poin Quiz Arena untuk pemenang (leaderboard & role top 3 auto update)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User yang menang quiz').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('poin')
        .setDescription('Jumlah poin yang ditambahkan (default 1)')
        .setMinValue(1)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('quiz-kurang')
    .setDescription('Kurangi poin Quiz Arena user (buat koreksi)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User yang mau dikurangi poinnya').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('poin')
        .setDescription('Jumlah poin yang dikurangi (default 1)')
        .setMinValue(1)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('quiz-set')
    .setDescription('Set poin Quiz Arena user langsung ke nilai tertentu (koreksi/import data)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User yang mau di-set poinnya').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('poin').setDescription('Poin baru').setMinValue(0).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('quiz-leaderboard')
    .setDescription('Pasang/pindahkan panel Quiz Arena Leaderboard (live, auto-update) ke channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.discordToken);

(async () => {
  try {
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      console.log(`✅ Slash command terdaftar di guild ${config.guildId} (instan).`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('✅ Slash command terdaftar secara global (propagasi ~1 jam).');
    }
  } catch (error) {
    console.error('❌ Gagal deploy slash command:', error);
    process.exit(1);
  }
})();
