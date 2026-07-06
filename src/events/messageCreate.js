import { PermissionsBitField } from 'discord.js';
import roleTiers from '../config/roleTiers.js';
import { LOG_CHANNEL_ID, MOD_ROLE_IDS } from '../config/channelIds.js';
import {
  incrementActivityCount,
  findHighestQualifyingTier,
  updateMemberTierRole,
} from '../lib/roleManager.js';
import {
  incrementEveryonePingStrike,
  resetEveryonePingStrike,
} from '../lib/moderationStrikes.js';

const cooldowns = new Map();

const EVERYONE_PING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const STRIKES_BEFORE_BAN = 3;

const handleUnauthorizedEveryonePing = async (message) => {
  const member = message.member;

  const isTrusted =
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    MOD_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId));

  if (isTrusted) return false; // not handled, let normal flow continue

  const contentPreview =
    message.content?.slice(0, 500) || '*[no text content]*';

  // Message is always deleted, regardless of strike count
  try {
    await message.delete();
  } catch (err) {
    console.error(
      'Failed to delete unauthorized @everyone/@here ping:',
      err.message
    );
  }

  const strikeCount = await incrementEveryonePingStrike(
    member.id,
    message.guild.id
  );
  // If Supabase failed, fall back to treating it as strike 1 so the member
  // still gets timed out rather than silently ignored
  const effectiveStrikeCount = strikeCount ?? 1;
  const isBan = effectiveStrikeCount >= STRIKES_BEFORE_BAN;

  let actionTaken;

  if (isBan) {
    try {
      await member.ban({
        reason: `Unauthorized @everyone/@here ping — strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN} (auto-mod)`,
      });
      actionTaken = `Banned (strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN})`;
      await resetEveryonePingStrike(member.id, message.guild.id);
    } catch (err) {
      console.error(
        'Failed to ban member for repeated @everyone/@here pings:',
        err.message
      );
      actionTaken = `Ban FAILED (strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN}) — check bot permissions/role hierarchy`;
    }
  } else {
    try {
      await member.timeout(
        EVERYONE_PING_TIMEOUT_MS,
        `Unauthorized @everyone/@here ping — strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN} (auto-mod)`
      );
    } catch (err) {
      console.error(
        'Failed to timeout member for @everyone/@here ping:',
        err.message
      );
    }
    actionTaken = `Timed out ${EVERYONE_PING_TIMEOUT_MS / 60000} min (strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN})`;

    // Warn the member by DM on strikes 1 and 2 (not sent on the ban strike)
    try {
      await member.send(
        `⚠️ Your message ping to @everyone/@here in **${message.guild.name}** was removed and you've been timed out for ${EVERYONE_PING_TIMEOUT_MS / 60000} minutes.\n\n` +
          `This is strike **${effectiveStrikeCount} of ${STRIKES_BEFORE_BAN}**. Reaching strike ${STRIKES_BEFORE_BAN} results in a ban. ` +
          `Strikes expire automatically after 30 days of good behavior.`
      );
    } catch (err) {
      console.warn(
        `Could not DM ${message.author.tag} about their @everyone/@here strike:`,
        err.message
      );
    }
  }

  try {
    const logChannel = await message.guild.channels.fetch(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          {
            title: '🚨 Unauthorized @everyone/@here ping',
            color: isBan ? 0x990000 : 0xff5555,
            fields: [
              {
                name: 'User',
                value: `<@${member.id}> (${message.author.tag})`,
                inline: true,
              },
              {
                name: 'Channel',
                value: `<#${message.channel.id}>`,
                inline: true,
              },
              { name: 'Action taken', value: actionTaken },
              { name: 'Content (truncated)', value: contentPreview },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (err) {
    console.error('Failed to log @everyone/@here ping incident:', err.message);
  }

  return true; // handled — caller should stop processing this message
};

export const handleMessageCreate = async (message) => {
  if (message.author.bot) return;

  if (message.mentions.everyone) {
    const handled = await handleUnauthorizedEveryonePing(message);
    if (handled) return;
  }

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
