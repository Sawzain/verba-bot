import { PermissionsBitField } from 'discord.js';
import { MOD_ROLE_IDS } from '../config/channelIds.js';

// ---- Tunable thresholds ----
export const FLOOD_WINDOW_MS = 4000; // 4 seconds
export const FLOOD_MESSAGE_THRESHOLD = 5; // 5+ messages in the window = flood

export const DUPLICATE_WINDOW_MS = 15000; // 15 seconds
export const DUPLICATE_CHANNEL_THRESHOLD = 3; // same content in 3+ distinct channels
export const DUPLICATE_MIN_CONTENT_LENGTH = 5; // ignore trivial "ok"/"lol" content

export const MASS_MENTION_THRESHOLD = 5; // 5+ distinct user mentions in one message

// Known invite / scam / IP-logger link patterns. Extend as needed.
const SUSPICIOUS_LINK_PATTERNS = [
  // Discord invite links
  /discord(?:app)?\.(?:com\/invite|gg)\/[a-z0-9-]+/i,
  // Common IP grabber / logger domains
  /grabify\.link/i,
  /iplogger\.(?:org|com|ru)/i,
  /2no\.co/i,
  /blasze\.(?:tk|com)/i,
  /yip\.su/i,
  // Common fake Steam / Nitro scam domains (character-swapped lookalikes)
  /steamcomm?unity\.(?:com|ru|net)/i,
  /steancommunity\.com/i,
  /discord-?nitro\.(?:info|net|com|ru)/i,
  /dlscord\.(?:com|net)/i,
  /discocrd\.com/i,
];

// In-memory state (per-process). Fine for real-time flood/duplicate detection —
// intentionally NOT persisted, since this only needs to catch bursts happening
// right now, not history across restarts.
const messageTimestamps = new Map(); // userId -> number[]
const recentMessages = new Map(); // userId -> { content, channelId, timestamp }[]

// Periodic cleanup so these maps don't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of messageTimestamps) {
    const kept = timestamps.filter((t) => now - t < FLOOD_WINDOW_MS);
    if (kept.length === 0) messageTimestamps.delete(userId);
    else messageTimestamps.set(userId, kept);
  }
  for (const [userId, entries] of recentMessages) {
    const kept = entries.filter((e) => now - e.timestamp < DUPLICATE_WINDOW_MS);
    if (kept.length === 0) recentMessages.delete(userId);
    else recentMessages.set(userId, kept);
  }
}, 30 * 1000).unref();

export const isTrustedMember = (member) => {
  if (!member) return false;
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    MOD_ROLE_IDS.some((roleId) => member.roles.cache.has(roleId))
  );
};

// Returns true if this message pushes the author over the flood threshold.
export const recordAndCheckFlood = (message) => {
  const now = Date.now();
  const userId = message.author.id;

  const timestamps = messageTimestamps.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < FLOOD_WINDOW_MS);
  recent.push(now);
  messageTimestamps.set(userId, recent);

  return recent.length >= FLOOD_MESSAGE_THRESHOLD;
};

// Returns true if the same content has now appeared in enough distinct
// channels within the window (classic hacked-account link-blast pattern).
export const recordAndCheckCrossChannelDuplicate = (message) => {
  const content = message.content?.trim().toLowerCase();
  if (!content || content.length < DUPLICATE_MIN_CONTENT_LENGTH) return false;

  const now = Date.now();
  const userId = message.author.id;

  const entries = recentMessages.get(userId) || [];
  const recent = entries.filter((e) => now - e.timestamp < DUPLICATE_WINDOW_MS);
  recent.push({ content, channelId: message.channel.id, timestamp: now });
  recentMessages.set(userId, recent);

  const distinctChannels = new Set(
    recent.filter((e) => e.content === content).map((e) => e.channelId)
  );

  return distinctChannels.size >= DUPLICATE_CHANNEL_THRESHOLD;
};

export const isSuspiciousLink = (message) => {
  const content = message.content || '';
  return SUSPICIOUS_LINK_PATTERNS.some((pattern) => pattern.test(content));
};

export const isMassMention = (message) => {
  const distinctUserMentions = new Set(
    [...message.mentions.users.values()].map((u) => u.id)
  );
  return distinctUserMentions.size >= MASS_MENTION_THRESHOLD;
};
