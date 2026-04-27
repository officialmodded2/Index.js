const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');

// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────

const TOKEN = "";     // Replace with your bot token
const CLIENT_ID = "1494334094442631188"; // Replace with your bot's application/client ID

// Role IDs exempt from the filter (staff/admins) — add as strings
const EXEMPT_ROLE_IDS = [];

// ─────────────────────────────────────────────
//  DETECTION RULES
// ─────────────────────────────────────────────

const LINK_REGEX = /https?:\/\/\S+|www\.\S+/i;

// ─────────────────────────────────────────────
//  REGISTER SLASH COMMANDS
// ─────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive and see its latency')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered!');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();

// ─────────────────────────────────────────────
//  BOT SETUP
// ─────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag} — filter active.`);
});

// ─────────────────────────────────────────────
//  SLASH COMMAND HANDLER
// ─────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    await interaction.reply(
      `🏓 **Pong!**\n📶 Bot Latency: \`${latency}ms\`\n💙 API Latency: \`${apiLatency}ms\``
    );
  }
});

// ─────────────────────────────────────────────
//  MESSAGE FILTER
// ─────────────────────────────────────────────

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const memberRoles = message.member?.roles?.cache;
  const isExempt = EXEMPT_ROLE_IDS.some(id => memberRoles?.has(id));
  if (isExempt) return;

  if (/^\/bypass(\s|$)/i.test(message.content.trim())) return;

  const contentLower = message.content.toLowerCase();
  const mentionsBypass = contentLower.includes('bypass');
  const containsLink = LINK_REGEX.test(message.content);

  if (mentionsBypass && containsLink) {
    try {
      await message.delete();

      await message.channel.send(
        `**How to bypass links?**\n\n` +
        `First type \`/bypass:(add your link here!)\`\n` +
        `Then wait for your link to be bypassed\n` +
        `If it's there it's done 👍`
      );
    } catch (err) {
      console.error('Could not delete message or send reply:', err);
    }
  }
});

// ─────────────────────────────────────────────
//  RUN
// ─────────────────────────────────────────────
client.login(TOKEN);
