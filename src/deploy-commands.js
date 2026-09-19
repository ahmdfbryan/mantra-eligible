const { REST, Routes, SlashCommandBuilder } = require('discord.js');
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
