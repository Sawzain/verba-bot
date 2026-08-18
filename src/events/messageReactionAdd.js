import { supabase } from '../db/supabase.js';
import { MOD_ROLE_IDS } from '../config/channelIds.js';
import roleTiers from '../config/roleTiers.js';

const APPROVAL_EMOJI = '✅';
const CAPTURE_CHANNEL_KEYS = ['quotes-highlights', 'poetry-corner'];

export function isModerator(member) {
  if (!member) return false;
  return member.roles.cache.some((role) => MOD_ROLE_IDS.includes(role.id));
}

export async function handleMessageReactionAdd(reaction, user) {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error(
        '[verba-wall approval] Failed to fetch partial reaction:',
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
        '[verba-wall approval] Failed to fetch partial message:',
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

  const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const isApprovalReact =
    reaction.emoji.name === APPROVAL_EMOJI && isModerator(member);

  if (isApprovalReact) {
    const { data, error } = await supabase
      .from('quotes')
      .update({ is_approved: true })
      .eq('discord_message_url', messageUrl)
      .select();

    if (error) {
      console.error('[verba-wall approval] Failed to approve:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    await message
      .react('🌟')
      .catch((err) =>
        console.error(
          '[verba-wall approval] Failed to react with star:',
          err.message
        )
      );
    return;
  }

  // Any other reaction — including a non-mod ✅ — counts as audience
  // interest. Mod ✅ is a workflow signal (approval), not engagement,
  // so it's excluded above rather than falling through to here.
  const { error: countError } = await supabase.rpc('increment_reaction_count', {
    target_url: messageUrl,
    delta: 1,
  });

  if (countError) {
    console.error(
      '[verba-wall reactions] Failed to increment count:',
      countError.message
    );
  }
}
