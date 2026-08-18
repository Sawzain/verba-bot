import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { supabase } from '../../src/db/supabase.js';
import { MOD_ROLE_IDS } from '../../src/config/channelIds.js';

// One-off / rerunnable script — NOT wired into the bot's event loop.
// Run manually with: node manual/backfillReactionCounts.js
//
// For every quote in Supabase, fetches the live Discord message and
// recomputes reaction_count from its *current* reactions. This is a
// snapshot, not a delta, so it's safe to run more than once — it just
// resyncs the stored count to match what's actually on the message,
// using the same rule as the live listener (messageReactionAdd.js):
// bot reactions never count, and a moderator's ✅ (approval) never
// counts, but a non-mod ✅ counts like any other reaction.

const APPROVAL_EMOJI = '✅';

function isModerator(member) {
  if (!member) return false;
  return member.roles.cache.some((role) => MOD_ROLE_IDS.includes(role.id));
}

async function countReactions(message, guild) {
  let total = 0;

  for (const reaction of message.reactions.cache.values()) {
    const users = await reaction.users.fetch();

    for (const user of users.values()) {
      if (user.bot) continue;

      if (reaction.emoji.name === APPROVAL_EMOJI) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (isModerator(member)) continue; // approval react, not interest
      }

      total += 1;
    }
  }

  return total;
}

async function run() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

  await client.login(process.env.DISCORD_TOKEN);
  await new Promise((resolve) => client.once('ready', resolve));
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id, discord_message_url, reaction_count');

  if (error) {
    console.error('Failed to load quotes:', error.message);
    process.exit(1);
  }

  console.log(`Resyncing reaction counts for ${quotes.length} quotes...`);

  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const quote of quotes) {
    const match = quote.discord_message_url?.match(
      /channels\/\d+\/(\d+)\/(\d+)/
    );
    if (!match) {
      console.warn(`Skipping quote ${quote.id} — couldn't parse message URL`);
      skipped++;
      continue;
    }
    const [, channelId, messageId] = match;

    try {
      const channel = await client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);
      const count = await countReactions(message, guild);

      if (count !== quote.reaction_count) {
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ reaction_count: count })
          .eq('id', quote.id);

        if (updateError) {
          console.error(
            `Failed to update quote ${quote.id}:`,
            updateError.message
          );
          continue;
        }
        console.log(`Quote ${quote.id}: ${quote.reaction_count} -> ${count}`);
        updated++;
      } else {
        unchanged++;
      }
    } catch (err) {
      // Message deleted, channel inaccessible, etc. — leave that quote's
      // count as-is rather than zeroing it out.
      console.warn(
        `Skipping quote ${quote.id} (message may be deleted):`,
        err.message
      );
      skipped++;
    }
  }

  console.log(
    `Done. Updated ${updated}, unchanged ${unchanged}, skipped ${skipped}.`
  );
  process.exit(0);
}

run();
