import 'dotenv/config';
import cron from 'node-cron';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleGuildMemberAdd } from './events/guildMemberAdd.js';
import { handleInteraction } from './events/interactionCreate.js';
import { runVeteranReaderCheck } from './lib/veteranReader.js';
import { scheduleMeetingReminders } from './lib/meetingReminders.js';

const REQUIRED_ENV_VARS = [
  'DISCORD_TOKEN',
  'GUILD_ID',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'LOG_CHANNEL_ID',
  'WELCOME_CHANNEL_ID',
  'GENERAL_CHAT_CHANNEL_ID',
  'MEETING_CHANNEL_ID',
];

const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing required .env variables: ${missingVars.join(', ')}`);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const commands = [
  {
    name: 'rank',
    description: 'Check your activity counts in each channel',
  },
  {
    name: 'leaderboard',
    description: 'Show top members per channel',
    options: [
      {
        name: 'channel',
        description: 'Which channel leaderboard to show',
        type: 3,
        required: true,
        choices: [
          { name: 'Poetry Corner', value: 'poetry-corner' },
          { name: 'Quotes & Highlights', value: 'quotes-highlights' },
          { name: 'Monthly Reviews', value: 'monthly-reviews' },
          { name: 'Reading Goals', value: 'reading-goals' },
          { name: 'General Chat', value: 'general-chat' },
        ],
      },
    ],
  },
  {
    name: 'reset',
    description: "Reset a user's activity count (admin only)",
    options: [
      {
        name: 'user',
        description: 'The user to reset',
        type: 6,
        required: true,
      },
      {
        name: 'channel',
        description: 'Which channel to reset',
        type: 3,
        required: true,
        choices: [
          { name: 'Poetry Corner', value: 'poetry-corner' },
          { name: 'Quotes & Highlights', value: 'quotes-highlights' },
          { name: 'Monthly Reviews', value: 'monthly-reviews' },
          { name: 'Reading Goals', value: 'reading-goals' },
          { name: 'General Chat', value: 'general-chat' },
        ],
      },
    ],
  },
];

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('Slash commands registered!');

  console.log('Running initial Veteran Reader check...');
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await runVeteranReaderCheck(guild);

  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled Veteran Reader check...');
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await runVeteranReaderCheck(guild);
  });
  scheduleMeetingReminders(client);
  console.log('Meeting reminders scheduled!');
});

client.on('messageCreate', handleMessageCreate);
client.on('interactionCreate', handleInteraction);
client.on('guildMemberAdd', handleGuildMemberAdd);

client.login(process.env.DISCORD_TOKEN);
