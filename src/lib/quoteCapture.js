import { supabase } from '../db/supabase.js';

// Channel keys (from roleTiers.CHANNELS) that should be captured to the
// Quote Wall. Both quotes-highlights and poetry-corner already have the
// "needs substance" filter applied in messageCreate.js before this runs.
const CAPTURE_CHANNEL_KEYS = ['quotes-highlights', 'poetry-corner'];

export function shouldCaptureQuote(channelConfig) {
  return channelConfig && CAPTURE_CHANNEL_KEYS.includes(channelConfig.key);
}

export async function captureQuote(message, channelConfig) {
  const text = message.content?.trim();
  if (!text) return; // e.g. attachment-only poetry post — nothing to save as text

  const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

  const { error } = await supabase.from('quotes').insert({
    discord_user_id: message.author.id,
    display_name: message.member?.displayName ?? message.author.username,
    quote_text: text,
    book_title: null,
    discord_message_url: messageUrl,
    channel_id: message.channelId,
    source_channel: channelConfig.key, // 'quotes-highlights' or 'poetry-corner'
  });

  if (error) {
    console.error('[quote-wall] failed to save quote/poem:', error.message);
    return;
  }

  await message.react('📝').catch(() => {});
}
