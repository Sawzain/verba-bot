import roleTiers from "../config/roleTiers.js";
import {
  incrementActivityCount,
  findHighestQualifyingTier,
  updateMemberTierRole,
} from "../lib/roleManager.js";

const cooldowns = new Map();

export const handleMessageCreate = async (message) => {
  if (message.author.bot || message.content.length < 15) {
    console.log(
      "SKIPPED: bot message or too short (length:",
      message.content.length,
      ")",
    );
    return;
  }

  const cooldownKey = `${message.author.id}-${message.channelId}`;
  if (cooldowns.has(cooldownKey)) {
    console.log("SKIPPED: on cooldown");
    return;
  }

  const channelConfig = roleTiers.CHANNELS.find(
    (c) => c.channelId === message.channel.id,
  );
  console.log(
    "Message channel ID:",
    message.channel.id,
    "| Matched config:",
    channelConfig ? channelConfig.key : "NONE",
  );
  if (!channelConfig) return;

  cooldowns.set(cooldownKey, Date.now());
  setTimeout(() => cooldowns.delete(cooldownKey), 60 * 1000);

  try {
    let newCount = await incrementActivityCount(
      message.author.id,
      message.guild.id,
      channelConfig.key,
    );
    console.log("New count:", newCount);
    if (newCount === null) {
      console.error(
        `Failed to get incremented activity count for ${message.author.id}`,
      );
      return;
    }
    const qualifyingTier = findHighestQualifyingTier(
      newCount,
      channelConfig.tiers,
    );
    console.log("Qualifying tier:", qualifyingTier);
    if (qualifyingTier) {
      const allTierRoleIds = channelConfig.tiers.map((tier) => tier.roleId);
      const roleChanged = await updateMemberTierRole(
        message.member,
        allTierRoleIds,
        qualifyingTier,
      );
      if (roleChanged) {
        console.log(
          `Updated ${message.author.tag}'s role to ${qualifyingTier.roleName}`,
        );
        await message.reply(
          `Congratulations! You are now a ${qualifyingTier.roleName}.`,
        );
      }
    }
  } catch (error) {
    console.error(
      `Error handling message create for ${message.author.tag}:`,
      error,
    );
  }
};
