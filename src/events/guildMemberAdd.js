import roleConfig from "../config/roleTiers.js";

export const grantVeteranReaderRole = async (member) => {
  const guildJoinDate = member.joinedAt;
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

  if (guildJoinDate > sixMonthsAgo) return false;

  const veteranRoleId = roleConfig.ROLE_IDS.VETERAN_READER;
  if (!veteranRoleId) {
    console.error("VETERAN_READER role ID not set in roleTiers.js");
    return false;
  }

  if (member.roles.cache.has(veteranRoleId)) return false; // already has it

  try {
    await member.roles.add(veteranRoleId);
    console.log(`Granted Veteran Reader to ${member.user.tag}`);
    return true;
  } catch (error) {
    console.error(
      `Error granting Veteran Reader to ${member.user.tag}:`,
      error,
    );
    return false;
  }
};
