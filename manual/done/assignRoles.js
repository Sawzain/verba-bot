import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { supabase } from '../src/db/supabase.js';
import roleConfig from '../src/config/roleTiers.js';
import {
  findHighestQualifyingTier,
  updateMemberTierRole,
} from '../src/lib/roleManager.js';

const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once('clientReady', async () => {
  console.log('Bot ready, assigning roles...\n');

  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.members.fetch();

  const { data, error } = await supabase
    .from('activity_counts')
    .select('*')
    .eq('guild_id', GUILD_ID);

  if (error) {
    console.error('Supabase error:', error.message);
    client.destroy();
    return;
  }

  for (const row of data) {
    const channelConfig = roleConfig.CHANNELS.find(
      (c) => c.key === row.channel_key
    );
    if (!channelConfig) continue;

    const member = guild.members.cache.get(row.user_id);
    if (!member) {
      console.log(`⚠️  Member not found: ${row.user_id}`);
      continue;
    }

    const qualifyingTier = findHighestQualifyingTier(
      row.count,
      channelConfig.tiers
    );

    if (!qualifyingTier) {
      console.log(
        `⏭️  ${member.user.username} → ${row.channel_key}: count ${row.count}, no tier yet`
      );
      continue;
    }

    const allTierRoleIds = channelConfig.tiers.map((t) => t.roleId);
    const roleChanged = await updateMemberTierRole(
      member,
      allTierRoleIds,
      qualifyingTier
    );

    if (roleChanged) {
      // Send DM notification
      await member
        .send(
          `Congratulations! You have been assigned the **${qualifyingTier.roleName}** role in **${guild.name}** for your activity in **${row.channel_key}**! 🎉`
        )
        .catch(() => {
          console.log(
            `  ⚠️  Could not DM ${member.user.username} (DMs may be closed)`
          );
        });

      console.log(
        `✅ ${member.user.username} → ${row.channel_key}: ${qualifyingTier.roleName} (${row.count} messages) — DM sent`
      );
    } else {
      console.log(
        `⏭️  ${member.user.username} → ${row.channel_key}: already has ${qualifyingTier.roleName}`
      );
    }
  }

  console.log('\nDone!');
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
