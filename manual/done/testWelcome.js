import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { handleGuildMemberAdd } from '../../src/events/guildMemberAdd.js';
const GUILD_ID = process.env.GUILD_ID;
const TEST_USER_ID = process.env.TEST_USER_ID || '557289409347715103';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once('clientReady', async () => {
  console.log('Bot ready, simulating member join...\n');

  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(TEST_USER_ID).catch(() => null);

  if (!member) {
    console.error(
      `❌ Could not find member with ID ${TEST_USER_ID} in this guild.`
    );
    client.destroy();
    return;
  }

  console.log(`Simulating join for ${member.user.tag}...`);
  await handleGuildMemberAdd(member);

  console.log('\n✅ Done! Check your welcome channel and bot-logs channel.');
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
