import 'dotenv/config';
import cron from 'node-cron';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleGuildMemberAdd } from './events/guildMemberAdd.js';
import { handleInteraction } from './events/interactionCreate.js';
import { runVeteranReaderCheck } from './lib/veteranReader.js';
import { scheduleMeetingReminders } from './lib/meetingReminders.js';

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

  try {
    const rest = new REST({ version: '10' }).setToken(
      process.env.DISCORD_TOKEN
    );
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (error) {
    console.error('Failed to register slash commands:', error.message);
  }

  try {
    console.log('Running initial Veteran Reader check...');
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await runVeteranReaderCheck(guild);
  } catch (error) {
    console.error('Initial Veteran Reader check failed:', error.message);
  }

  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running scheduled Veteran Reader check...');
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      await runVeteranReaderCheck(guild);
    } catch (error) {
      console.error('Scheduled Veteran Reader check failed:', error.message);
    }
  });
  scheduleMeetingReminders(client);
  console.log('Meeting reminders scheduled!');
});

client.on('messageCreate', handleMessageCreate);
client.on('interactionCreate', handleInteraction);
client.on('guildMemberAdd', handleGuildMemberAdd);

// Global safety nets — without these, an error thrown outside a local
// try/catch (or a rejected promise nobody awaited) can crash the whole
// process with no useful context in the host's logs.
client.on('error', (error) => {
  console.error('[client] Discord client error:', error);
});

client.on('shardError', (error) => {
  console.error('[client] Websocket shard error:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[process] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[process] Uncaught exception:', error);
});

client.login(process.env.DISCORD_TOKEN);
