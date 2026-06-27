import { supabase } from "../db/supabase.js";

const LOG_CHANNEL_ID = "1519821472850378804";

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
};
