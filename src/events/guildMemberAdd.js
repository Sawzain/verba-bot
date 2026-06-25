import roleConfig from "../config/roleTiers.js";
import { supabase } from "../db/supabase.js";

const LOG_CHANNEL_ID = "1519821472850378804";

export const grantVeteranReaderRole = async (member) => {
  const guildJoinDate = member.joinedAt;
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

  if (guildJoinDate > sixMonthsAgo) return false;

  const veteranRoleId = roleConfig.ROLE_IDS.VETERAN_READER;
  if (!veteranRoleId) {
    console.error("VETERAN_READER role ID not set in roleTiers.js");
    return false;
  }

  if (member.roles.cache.has(veteranRoleId)) return false;

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

export const handleGuildMemberAdd = async (member) => {
  try {
    await supabase
      .from("activity_counts")
      .delete()
      .eq("user_id", member.user.id)
      .eq("guild_id", member.guild.id);

    const logChannel = await member.guild.channels
      .fetch(LOG_CHANNEL_ID)
      .catch(() => null);
    if (logChannel) {
      await logChannel.send(
        `🔄 **${member.user.username}** rejoined — activity counts reset`,
      );
    }

    console.log(`Reset counts for rejoined member ${member.user.tag}`);
  } catch (error) {
    console.error(`Error resetting counts for ${member.user.tag}:`, error);
  }

  await grantVeteranReaderRole(member);
};
