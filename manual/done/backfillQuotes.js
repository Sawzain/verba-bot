// One-off backfill: pulls existing message history from #quotes-highlights
// and #poetry-corner into the quotes table, applying the same substance
// filter as the live capture in messageCreate.js (>=10 words, OR starts
// with '>', OR has an attachment). Safe to re-run — uses upsert with
// ignoreDuplicates against the unique constraint on discord_message_url
// (run 06_add_unique_constraint.sql first).
//
// Usage:  node scripts/backfillQuotes.js
//
// Uses the same bot token / client setup your bot normally uses — adjust
// the Client construction below if your index.js configures intents
// differently.

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// dotenv/config loads .env relative to the current working directory,
// but this script lives in manual/done/, two levels below the project
// root where the actual .env file is — so point it there explicitly.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../.env') });

// supabase.js reads process.env at module load time and throws if it's
// missing, so it (and roleTiers.js, for consistency) must be imported
// AFTER config() has run above — a static `import` here would be hoisted
// by ESM and run before config(), reproducing the original error.
import { Client, GatewayIntentBits } from 'discord.js';
const { supabase } = await import('../../src/db/supabase.js');
const { default: roleTiers } = await import('../../src/config/roleTiers.js');

const TARGET_KEYS = ['quotes-highlights', 'poetry-corner'];

function passesSubstanceFilter(message) {
  const hasAttachment = message.attachments.size > 0;
  const wordCount = message.content.trim().split(/\s+/).filter(Boolean).length;
  const isQuote = message.content.trim().startsWith('>');
  return wordCount >= 10 || isQuote || hasAttachment;
}

async function backfillChannel(guild, channelConfig) {
  const channel = await guild.channels.fetch(channelConfig.channelId);
  if (!channel) {
    console.warn(`⚠️  Channel not found for key "${channelConfig.key}"`);
    return { fetched: 0, saved: 0, skipped: 0 };
  }

  console.log(`\nFetching history for #${channel.name} (${channelConfig.key})...`);

  let fetched = 0;
  let saved = 0;
  let skipped = 0;
  let beforeId;

  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before: beforeId });
    if (batch.size === 0) break;

    for (const message of batch.values()) {
      fetched++;
      beforeId = message.id;

      if (message.author.bot) continue;
      if (!passesSubstanceFilter(message)) {
        skipped++;
        continue;
      }

      const text = message.content?.trim();
      if (!text) {
        skipped++;
        continue;
      }

      const messageUrl = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`;

      const { error } = await supabase
        .from('quotes')
        .upsert(
          {
            discord_user_id: message.author.id,
            display_name: message.member?.displayName ?? message.author.username,
            quote_text: text,
            book_title: null,
            discord_message_url: messageUrl,
            channel_id: channel.id,
            source_channel: channelConfig.key,
          },
          { onConflict: 'discord_message_url', ignoreDuplicates: true }
        );

      if (error) {
        console.error(`  ❌ Failed to save message ${message.id}:`, error.message);
      } else {
        saved++;
      }
    }

    console.log(`  ...processed ${fetched} messages so far`);
  }

  return { fetched, saved, skipped };
}

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  await client.login(process.env.DISCORD_TOKEN);
  console.log(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.first(); // adjust if the bot is in multiple guilds
  if (!guild) {
    console.error('❌ Bot is not in any guild.');
    process.exit(1);
  }

  const channelConfigs = roleTiers.CHANNELS.filter((c) =>
    TARGET_KEYS.includes(c.key)
  );

  if (channelConfigs.length === 0) {
    console.error('❌ No matching channel configs found for', TARGET_KEYS);
    process.exit(1);
  }

  const totals = { fetched: 0, saved: 0, skipped: 0 };

  for (const config of channelConfigs) {
    const result = await backfillChannel(guild, config);
    totals.fetched += result.fetched;
    totals.saved += result.saved;
    totals.skipped += result.skipped;
  }

  console.log('\n✅ Backfill complete');
  console.log(`   Messages scanned: ${totals.fetched}`);
  console.log(`   Saved:            ${totals.saved}`);
  console.log(`   Skipped:          ${totals.skipped}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});