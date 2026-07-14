import roleTiers from '../config/roleTiers.js';
import { LOG_CHANNEL_ID } from '../config/channelIds.js';
import {
  incrementActivityCount,
  findHighestQualifyingTier,
  updateMemberTierRole,
} from '../lib/roleManager.js';
import {
  incrementEveryonePingStrike,
  resetEveryonePingStrike,
} from '../lib/moderationStrikes.js';
import {
  isTrustedMember,
  recordAndCheckFlood,
  recordAndCheckCrossChannelDuplicate,
  isSuspiciousLink,
  isMassMention,
} from '../lib/spamGuards.js';

const cooldowns = new Map();

const EVERYONE_PING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const STRIKES_BEFORE_BAN = 3;

// Matches "@everyone" / "@here" as literal text, regardless of whether Discord
// actually resolved it into a real mention. Discord only sets
// message.mentions.everyone = true if the author already HAS permission to
// ping everyone — so relying on that flag misses the exact case we care
// about: members who don't have permission typing it anyway.
const EVERYONE_HERE_TEXT_PATTERN = /@(everyone|here)\b/i;

// ---------- Shared helpers ----------

const logIncident = async (
  message,
  { title, color, actionTaken, contentPreview }
) => {
  try {
    const logChannel = await message.guild.channels.fetch(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          {
            title,
            color,
            fields: [
              {
                name: 'User',
                value: `<@${message.author.id}> (${message.author.tag})`,
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
    console.error(`Failed to log incident (${title}):`, err.message);
  }
};

const getContentPreview = (message) =>
  message.content?.slice(0, 500) || '*[no text content]*';

// ---------- High-severity: instant ban, no warning ----------
// Used for flood spam, cross-channel link blasting, suspicious links, and
// mass-mention spam — all strong signals of a hacked account or spam bot.
// These skip the strike ladder entirely: by the time you can confirm it's
// really the human behind the account, they've already hit a dozen channels.

const handleHighSeverityViolation = async (message, { type, title }) => {
  const contentPreview = getContentPreview(message);

  try {
    await message.delete();
  } catch (err) {
    console.error(`Failed to delete message for ${type}:`, err.message);
  }

  let actionTaken;
  try {
    await message.member.ban({
      reason: `${title} — instant ban (auto-mod)`,
    });
    actionTaken = 'Banned instantly (no warning — high severity)';
  } catch (err) {
    console.error(`Failed to ban member for ${type}:`, err.message);
    // Ban failed (permissions/role hierarchy) — fall back to a timeout so
    // this isn't a complete no-op.
    try {
      await message.member.timeout(
        EVERYONE_PING_TIMEOUT_MS,
        `${title} — ban failed, fallback timeout (auto-mod)`
      );
      actionTaken =
        'Ban FAILED — fell back to 10 min timeout. Check bot role hierarchy/permissions.';
    } catch (timeoutErr) {
      console.error(
        `Fallback timeout also failed for ${type}:`,
        timeoutErr.message
      );
      actionTaken =
        'Ban AND fallback timeout both FAILED — check bot permissions/role hierarchy immediately.';
    }
  }

  await logIncident(message, {
    title: `🚨 ${title}`,
    color: 0x990000,
    actionTaken,
    contentPreview,
  });

  return true;
};

// ---------- Low-severity: 3-strike ladder ----------
// Used for unauthorized @everyone/@here pings only.

const handleUnauthorizedEveryonePing = async (message) => {
  const member = message.member;
  const contentPreview = getContentPreview(message);

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
  // still gets timed out rather than silently ignored. Note: if Supabase is
  // down for every call, this means a member can never escalate to a ban —
  // check logs for repeated "Error incrementing everyone-ping strike" if a
  // known repeat offender never seems to progress past a timeout.
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
      // Ban failed — fall back to a timeout so the offense isn't a total no-op.
      try {
        await member.timeout(
          EVERYONE_PING_TIMEOUT_MS,
          `Unauthorized @everyone/@here ping — strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN}, ban failed, fallback timeout (auto-mod)`
        );
        actionTaken = `Ban FAILED (strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN}) — fell back to 10 min timeout. Check bot role hierarchy/permissions.`;
      } catch (timeoutErr) {
        console.error('Fallback timeout also failed:', timeoutErr.message);
        actionTaken = `Ban AND fallback timeout both FAILED (strike ${effectiveStrikeCount}/${STRIKES_BEFORE_BAN}) — check bot permissions/role hierarchy immediately.`;
      }
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

  await logIncident(message, {
    title: '🚨 Unauthorized @everyone/@here ping',
    color: isBan ? 0x990000 : 0xff5555,
    actionTaken,
    contentPreview,
  });

  return true; // handled — caller should stop processing this message
};

// ---------- Main handler ----------

export const handleMessageCreate = async (message) => {
  if (message.author.bot) return;
  if (!message.member) return; // can't check roles/perms or take action without this

  const trusted = isTrustedMember(message.member);

  if (!trusted) {
    // Order matters: cheapest/highest-confidence checks first. All of these
    // are instant-ban, high-severity signals of a hacked account or spam bot.

    if (recordAndCheckFlood(message)) {
      return handleHighSeverityViolation(message, {
        type: 'flood spam',
        title: 'Flood spam detected (rapid-fire messages)',
      });
    }

    if (recordAndCheckCrossChannelDuplicate(message)) {
      return handleHighSeverityViolation(message, {
        type: 'cross-channel duplicate spam',
        title: 'Cross-channel duplicate spam detected',
      });
    }

    if (isSuspiciousLink(message)) {
      return handleHighSeverityViolation(message, {
        type: 'suspicious link',
        title: 'Suspicious/scam link detected',
      });
    }

    if (isMassMention(message)) {
      return handleHighSeverityViolation(message, {
        type: 'mass mention spam',
        title: 'Mass user-mention spam detected',
      });
    }

    if (EVERYONE_HERE_TEXT_PATTERN.test(message.content || '')) {
      const handled = await handleUnauthorizedEveryonePing(message);
      if (handled) return;
    }
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
          console.log(
            `✅ DM sent to ${message.author.tag} for role ${qualifyingTier.roleName}`
          );
        } catch (err) {
          console.warn(
            `❌ Could not DM ${message.author.tag} about role ${qualifyingTier.roleName}:`,
            err.code,
            err.message
          );

          try {
            const logChannel =
              await message.guild.channels.fetch(LOG_CHANNEL_ID);
            if (logChannel) {
              await logChannel.send({
                embeds: [
                  {
                    title: '⚠️ Role DM failed',
                    color: 0xffaa00,
                    fields: [
                      {
                        name: 'User',
                        value: `<@${message.author.id}> (${message.author.tag})`,
                        inline: true,
                      },
                      {
                        name: 'Role',
                        value: qualifyingTier.roleName,
                        inline: true,
                      },
                      {
                        name: 'Error',
                        value: `\`${err.code ?? 'N/A'}\` ${err.message}`,
                      },
                    ],
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            }
          } catch (logErr) {
            console.error(
              'Failed to log DM failure to #bot-logs:',
              logErr.message
            );
          }
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
