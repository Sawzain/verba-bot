// One-off script: removes the Book Sage role from everyone who currently
// has it, so the next Veteran Reader check re-grants it (and sends the DM).
//
// Usage: node src/scripts/resetBookSage.js
// Run this once, then trigger/wait for the Veteran Reader check to re-run.

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv'; dotenv.config({ path: '../../.env' });
import roleConfig from '../../src/config/roleTiers.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const GUILD_ID = process.env.GUILD_ID;
const BOOK_SAGE_ROLE_ID = roleConfig.ROLE_IDS.BOOK_SAGE;

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();

    let removedCount = 0;
    for (const member of members.values()) {
      if (member.roles.cache.has(BOOK_SAGE_ROLE_ID)) {
        try {
          await member.roles.remove(BOOK_SAGE_ROLE_ID);
          removedCount++;
          console.log(`Removed Book Sage from ${member.user.tag}`);
        } catch (err) {
          console.error(
            `Failed to remove Book Sage from ${member.user.tag}:`,
            err.message
          );
        }
      }
    }

    console.log(`Done. Removed Book Sage from ${removedCount} member(s).`);
  } catch (err) {
    console.error('Error running resetBookSage script:', err);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
