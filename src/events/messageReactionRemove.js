import { supabase } from '../db/supabase.js';
import roleTiers from '../config/roleTiers.js';
import { isModerator } from './messageReactionAdd.js';

const APPROVAL_EMOJI = '✅';
const CAPTURE_CHANNEL_KEYS = ['quotes-highlights', 'poetry-corner'];

export async function handleMessageReactionRemove(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error(
        '[verba-wall reactions] Failed to fetch partial reaction:',
        err.message
      );
      return;
    }
  }
  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
    } catch (err) {
      console.error(
        '[verba-wall reactions] Failed to fetch partial message:',
        err.message
      );
      return;
    }
  }

  const message = reaction.message;
  if (!message.guild) return; // ignore DMs

  const channelConfig = roleTiers.CHANNELS.find(
    (c) => c.channelId === message.channel.id
  );
  if (!channelConfig || !CAPTURE_CHANNEL_KEYS.includes(channelConfig.key))
    return;

  // A mod's ✅ never counted toward reaction_count in the first place
  // (see messageReactionAdd.js), so removing it shouldn't decrement it
  // either — otherwise a mod approving then later un-reacting would push
  // the count negative relative to what was ever actually added.
  if (reaction.emoji.name === APPROVAL_EMOJI) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (isModerator(member)) return;
  }

  const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

  const { error } = await supabase.rpc('increment_reaction_count', {
    target_url: messageUrl,
    delta: -1,
  });

  if (error) {
    console.error(
      '[verba-wall reactions] Failed to decrement count:',
      error.message
    );
  }
}
