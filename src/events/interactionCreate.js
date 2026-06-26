import roleConfig from "../config/roleTiers.js";
import { supabase } from "../db/supabase.js";
import { PermissionFlagsBits } from "discord.js";

const LOG_CHANNEL_ID = "1519821472850378804";

export const handleInteraction = async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "rank") {
    await interaction.deferReply({ ephemeral: true });

    const { data, error } = await supabase
      .from("activity_counts")
      .select("*")
      .eq("user_id", interaction.user.id)
      .eq("guild_id", interaction.guildId);

    if (error) {
      await interaction.editReply("Error fetching your rank.");
      return;
    }

    let response = `📊 **Your Activity Counts:**\n\n`;
    for (const channel of roleConfig.CHANNELS) {
      const row = data.find((r) => r.channel_key === channel.key);
      const count = row ? row.count : 0;
      const highestTier = channel.tiers
        .filter((t) => t.threshold <= count)
        .sort((a, b) => b.threshold - a.threshold)[0];
      const tierName = highestTier ? highestTier.roleName : "No role yet";
      response += `**${channel.key}:** ${count} messages — ${tierName}\n`;
    }

    await interaction.editReply(response);
  }

  if (interaction.commandName === "leaderboard") {
    await interaction.deferReply();
    const channelKey = interaction.options.getString("channel");

    const { data, error } = await supabase
      .from("activity_counts")
      .select("*")
      .eq("guild_id", interaction.guildId)
      .eq("channel_key", channelKey)
      .order("count", { ascending: false })
      .limit(10);

    if (error) {
      await interaction.editReply("Error fetching leaderboard.");
      return;
    }

    if (!data || data.length === 0) {
      await interaction.editReply("No activity recorded yet!");
      return;
    }

    let response = `🏆 **Leaderboard — ${channelKey}:**\n\n`;
    for (let i = 0; i < data.length; i++) {
      const member = await interaction.guild.members
        .fetch(data[i].user_id)
        .catch(() => null);
      const name = member ? member.user.username : "Unknown User";
      response += `**${i + 1}.** ${name} — ${data[i].count} messages\n`;
    }

    await interaction.editReply(response);
  }

  if (interaction.commandName === "reset") {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: "You need to be an admin to use this command.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = interaction.options.getUser("user");
      const channelKey = interaction.options.getString("channel");

      const { error } = await supabase
        .from("activity_counts")
        .update({ count: 0 })
        .eq("user_id", targetUser.id)
        .eq("guild_id", interaction.guildId)
        .eq("channel_key", channelKey);

      if (error) throw error;

      const logChannel = await interaction.guild.channels
        .fetch(LOG_CHANNEL_ID)
        .catch(() => null);
      if (logChannel) {
        await logChannel.send(
          `🔄 **${interaction.user.username}** reset **${targetUser.username}**'s count in **${channelKey}**`,
        );
      }

      await interaction.editReply(
        `Reset ${targetUser.username}'s count in ${channelKey}.`,
      );
    } catch (err) {
      console.error("Reset command failed:", err);
      await interaction.editReply(
        `Failed to reset count: ${err.message || "Unknown error"}`,
      );
    }
  }
};