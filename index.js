require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const API_BASE = 'https://catalog.roproxy.com/v1/search/items';

// Register the /emote slash command
const commands = [
  new SlashCommandBuilder()
    .setName('emote')
    .setDescription('Look up a Roblox emote ID')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Emote name to search')
        .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('✅ Slash commands registered!');
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'emote') return;

  const query = interaction.options.getString('name');
  await interaction.deferReply();

  try {
    const res = await fetch(`${API_BASE}?category=12&keyword=${encodeURIComponent(query)}&limit=5&salesTypeFilter=1`);
    const json = await res.json();
    const results = json.data;

    if (!results || results.length === 0) {
      return interaction.editReply('❌ No emotes found for that name.');
    }

    const embed = new EmbedBuilder()
      .setTitle(`🕹️ Roblox Emote: "${query}"`)
      .setColor(0x00b4d8)
      .setDescription(
        results.map(e =>
          `**${e.name}**\n\`\`\`${e.id}\`\`\`\n📋 Ready to use:\n\`\`\`lua\nlocal anim = Instance.new("Animation")\nanim.AnimationId = "rbxassetid://${e.id}"\nhumanoid:LoadAnimation(anim):Play()\n\`\`\``
        ).join('\n―――――――――――\n')
      )
      .setFooter({ text: 'Copy the ID and use it in your Roblox script!' });

    interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error(err);
    interaction.editReply('⚠️ Something went wrong. Try again later.');
  }
});

client.login(process.env.DISCORD_TOKEN);