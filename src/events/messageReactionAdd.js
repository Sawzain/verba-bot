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

  console.log(
    '[verba-wall] reaction received:',
    reaction.emoji.name,
    'from',
    user.tag
  );

  if (reaction.emoji.name !== APPROVAL_EMOJI) {
    console.log(
      '[verba-wall] emoji mismatch, expected',
      APPROVAL_EMOJI,
      'got',
      reaction.emoji.name
    );
    return;
  }

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
  if (!message.guild) return;

  const channelConfig = roleTiers.CHANNELS.find(
    (c) => c.channelId === message.channel.id
  );
  console.log(
    '[verba-wall] message channel id:',
    message.channel.id,
    '-> matched config:',
    channelConfig?.key ?? 'NONE'
  );
  if (!channelConfig || !CAPTURE_CHANNEL_KEYS.includes(channelConfig.key))
    return;

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  console.log(
    '[verba-wall] member id:',
    user.id,
    'roles:',
    member?.roles.cache.map((r) => r.id)
  );
  console.log('[verba-wall] MOD_ROLE_IDS currently:', MOD_ROLE_IDS);

  if (!isModerator(member)) {
    console.log('[verba-wall] isModerator returned false, skipping approval');
    return;
  }

  const messageUrl = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
  console.log('[verba-wall] attempting update for url:', messageUrl);

  const { data, error } = await supabase
    .from('quotes')
    .update({ is_approved: true })
    .eq('discord_message_url', messageUrl)
    .select();

  if (error) {
    console.error('[verba-wall approval] Failed to approve:', error.message);
    return;
  }

  console.log('[verba-wall] update matched rows:', data?.length ?? 0);

  if (!data || data.length === 0) {
    return;
  }

  await message
    .react('🌟')
    .catch((err) =>
      console.error('[verba-wall] failed to react with star:', err.message)
    );
}
