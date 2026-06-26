import roleTiers from "../config/roleTiers.js";
import {
  incrementActivityCount,
  findHighestQualifyingTier,
  updateMemberTierRole,
} from "../lib/roleManager.js";

const cooldowns = new Map();

export const handleMessageCreate = async (message) => {
  if (message.author.bot) return;

  const channelConfig = roleTiers.CHANNELS.find(
    (c) => c.channelId === message.channel.id,
  );
  
  if (!channelConfig) return;

  // NEW LOGIC: Only apply 10-word/quote rule to specific channels
  const restrictedKeys = ["poetry-corner", "quotes-highlights"];
  
  if (restrictedKeys.includes(channelConfig.key)) {
    const wordCount = message.content.split(/\s+/).length;
    const isQuote = message.content.trim().startsWith('>');
    
    if (wordCount < 10 && !isQuote) {
      console.log(`SKIPPED: ${channelConfig.key} message too short`);
      return;
    }
  }

  const cooldownKey = `${message.author.id}-${message.channelId}`;
  if (cooldowns.has(cooldownKey)) {
    console.log("SKIPPED: on cooldown");
    return;
  }

  cooldowns.set(cooldownKey, Date.now());
  setTimeout(() => cooldowns.delete(cooldownKey), 60 * 1000);

  try {
    let newCount = await incrementActivityCount(
      message.author.id,
      message.guild.id,
      channelConfig.key,
    );
    
    if (newCount === null) return;

    const qualifyingTier = findHighestQualifyingTier(
      newCount,
      channelConfig.tiers,
    );
    
    if (qualifyingTier) {
      const allTierRoleIds = channelConfig.tiers.map((tier) => tier.roleId);
      const roleChanged = await updateMemberTierRole(
        message.member,
        allTierRoleIds,
        qualifyingTier,
      );
      if (roleChanged) {
        await message.author.send(
          `Congratulations! You are now a **${qualifyingTier.roleName}** in **${message.guild.name}**! 🎉`,
        );
      }
    }
  } catch (error) {
    console.error(`Error handling message create for ${message.author.tag}:`, error);
  }
};