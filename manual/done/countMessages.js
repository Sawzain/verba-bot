import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

const CHANNELS = [
  { id: '1485692154360758423', name: 'poetry-corner' },
  { id: '1465764322797162700', name: 'quotes-highlights' },
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('clientReady', async () => {
  console.log('Bot ready, fetching messages...');

  const results = {};

  for (const { id, name } of CHANNELS) {
    console.log(`\nScanning #${name}...`);
    const channel = await client.channels.fetch(id);
    let lastId = null;
    let total = 0;
    results[name] = {};

    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const messages = await channel.messages.fetch(options).catch(() => null);
      if (!messages || messages.size === 0) break;

      messages.forEach((msg) => {
        if (msg.author.bot) return;
        const wordCount = msg.content
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        if (wordCount < 10) return; // ← skip short messages
        const key = `${msg.author.username} (${msg.author.id})`;
        results[name][key] = (results[name][key] || 0) + 1;
        total++;
      });
      lastId = messages.last().id;
      console.log(`  Fetched ${total} messages so far...`);
    }

    console.log(`  → Done. ${total} total messages.`);
  }

  console.log('\n===== RESULTS =====');
  for (const [channelName, userCounts] of Object.entries(results)) {
    const entries = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      console.log(`\n#${channelName} — no messages found`);
      continue;
    }

    console.log(`\n#${channelName}`);
    entries.forEach(([user, count]) => {
      console.log(`  ${user}: ${count}`);
    });
  }

  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
