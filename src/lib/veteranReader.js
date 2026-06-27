import roleConfig from "../config/roleTiers.js";

export const isVeteranReaderEligible = (member) => {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  return member.joinedAt && member.joinedAt <= sixMonthsAgo;
};

export const runVeteranReaderCheck = async (guild) => {
  const veteranRoleId = roleConfig.ROLE_IDS.VETERAN_READER;
  if (!veteranRoleId) {
    console.error("VETERAN_READER role ID not set in roleTiers.js");
    return;
  }

  try {
    const members = await guild.members.fetch();
    let grantedCount = 0;

    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (member.roles.cache.has(veteranRoleId)) continue;
      if (isVeteranReaderEligible(member)) {
        try {
          await member.roles.add(veteranRoleId);
          grantedCount++;
          console.log(`Granted Veteran Reader to ${member.user.tag}`);
        } catch (error) {
          console.error(
            `Failed to grant Veteran Reader to ${member.user.tag}:`,
            error.message,
          );
        }
      }
    }

    console.log(
      `Veteran Reader check complete. Granted to ${grantedCount} member(s).`,
    );
  } catch (error) {
    console.error("Error running Veteran Reader check:", error);
  }
};
