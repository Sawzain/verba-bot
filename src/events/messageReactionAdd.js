import { supabase } from '../db/supabase.js';
import { MOD_ROLE_IDS } from '../config/channelIds.js';
import roleTiers from '../config/roleTiers.js';

const APPROVAL_EMOJI = '✅';
const CAPTURE_CHANNEL_KEYS = ['quotes-highlights', 'poetry-corner'];

function isModerator(member) {
  if (!member) return false;
  return member.roles.cache.some((role) => MOD_ROLE_IDS.includes(role.id));
}

export async function handleMessageReactionAdd(reaction, user) {
  if (user.bot) return;
  if (reaction.emoji.name !== APPROVAL_EMOJI) return;

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

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!isModerator(member)) return; // only mod-role reactions approve content

  const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

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
}
