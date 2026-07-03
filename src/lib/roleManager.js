import { supabase } from "../db/supabase.js";

export const incrementActivityCount = async (userId, guildId, channelKey) => {
  try {
    // Upsert avoids race conditions — increments if exists, inserts if not
    const { data, error } = await supabase.rpc("increment_activity_count", {
      p_user_id: userId,
      p_guild_id: guildId,
      p_channel_key: channelKey,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(
      `Error incrementing activity count for ${userId} in ${channelKey}:`,
      error,
    );
    return null;
  }
};

export const findHighestQualifyingTier = (count, tiersArray) => {
  let highest = null;
  for (const tier of tiersArray) {
    if (
      tier.threshold <= count &&
      (!highest || tier.threshold > highest.threshold)
    ) {
      highest = tier;
    }
  }
  return highest;
};

export const updateMemberTierRole = async (
  guildMember,
  allTierRoleIds,
  newTier,
) => {
  let roleChanged = false;
  try {
    // Skip if member already has the correct role and no other tier roles
    const hasCorrectRole = guildMember.roles.cache.has(newTier.roleId);
    const otherTierRoles = allTierRoleIds.filter(
      (id) => id !== newTier.roleId && guildMember.roles.cache.has(id),
    );

    if (hasCorrectRole && otherTierRoles.length === 0) {
      // Already in the right state, nothing to do
      return false;
    }

    // Remove all other tier roles
    for (const roleId of otherTierRoles) {
      await guildMember.roles.remove(roleId);
      roleChanged = true;
    }

    // Add the new role if not already present
    if (!hasCorrectRole) {
      await guildMember.roles.add(newTier.roleId);
      roleChanged = true;
    }
  } catch (error) {
    console.error(
      `Error updating tier role for ${guildMember.user.tag}:`,
      error,
    );
  }
  return roleChanged;
};
