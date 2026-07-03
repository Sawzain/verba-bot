import roleTiers from '../config/roleTiers.js';
import {
  incrementActivityCount,
  findHighestQualifyingTier,
  updateMemberTierRole,
} from '../lib/roleManager.js';

const cooldowns = new Map();

export const handleMessageCreate = async (message) => {
  if (message.author.bot) return;

  const channelConfig = roleTiers.CHANNELS.find(
    (c) => c.channelId === message.channel.id
  );

  if (!channelConfig) return;

  const hasAttachment = message.attachments.size > 0;
  const wordCount = message.content.trim().split(/\s+/).filter(Boolean).length;
  const isQuote = message.content.trim().startsWith('>');

  // Stricter rule for poetry/quotes: needs substance, a quote marker, or an attached image
  const strictKeys = ['poetry-corner', 'quotes-highlights'];
  if (strictKeys.includes(channelConfig.key)) {
    if (wordCount < 10 && !isQuote && !hasAttachment) {
      console.log(`SKIPPED: ${channelConfig.key} message too short`);
      return;
    }
  }

  // Light anti-farm rule for general-chat: blocks single-word spam, allows attachments through
  if (channelConfig.key === 'general-chat') {
    if (wordCount < 3 && !hasAttachment) {
      console.log('SKIPPED: general-chat message too short');
      return;
    }
  }

  const cooldownKey = `${message.author.id}-${message.channelId}`;
  if (cooldowns.has(cooldownKey)) {
    console.log('SKIPPED: on cooldown');
    return;
  }

  cooldowns.set(cooldownKey, Date.now());
  setTimeout(() => cooldowns.delete(cooldownKey), 60 * 1000);

  try {
    let newCount = await incrementActivityCount(
      message.author.id,
      message.guild.id,
      channelConfig.key
    );

    if (newCount === null) return;

    const qualifyingTier = findHighestQualifyingTier(
      newCount,
      channelConfig.tiers
    );

    if (qualifyingTier) {
      const allTierRoleIds = channelConfig.tiers.map((tier) => tier.roleId);
      const roleChanged = await updateMemberTierRole(
        message.member,
        allTierRoleIds,
        qualifyingTier
      );
      if (roleChanged) {
        try {
          await message.author.send(
            `Congratulations! You are now a **${qualifyingTier.roleName}**! 🎉`
          );
        } catch (err) {
          console.warn(
            `Could not DM ${message.author.tag} about role ${qualifyingTier.roleName}:`,
            err.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `Error handling message create for ${message.author.tag}:`,
      error
    );
  }
};
