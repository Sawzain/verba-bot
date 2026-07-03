import roleConfig from "../config/roleTiers.js";
import { supabase } from "../db/supabase.js";
import { PermissionFlagsBits, MessageFlags } from "discord.js";

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

export const handleInteraction = async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // --- Rank Command ---
  if (interaction.commandName === "rank") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const queryPromise = supabase
        .from("activity_counts")
        .select("*")
        .eq("user_id", interaction.user.id)
        .eq("guild_id", interaction.guildId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timed out")), 5000),
      );
      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]);

      if (error) {
        console.error("Supabase error (rank):", error);
        return interaction.editReply("Error fetching your rank.");
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
    } catch (err) {
      console.error("Rank command failed:", err);
      await interaction.editReply(`Something went wrong: ${err.message}`);
    }
  }

  // --- Leaderboard Command ---
  if (interaction.commandName === "leaderboard") {
    await interaction.deferReply();

    try {
      const channelKey = interaction.options.getString("channel");

      const queryPromise = supabase
        .from("activity_counts")
        .select("*")
        .eq("guild_id", interaction.guildId)
        .eq("channel_key", channelKey)
        .order("count", { ascending: false })
        .limit(10);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase query timed out")), 5000),
      );

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]);

      if (error) {
        console.error("Supabase error (leaderboard):", error);
        return interaction.editReply("Error fetching leaderboard.");
      }
      if (!data || data.length === 0)
        return interaction.editReply("No activity recorded yet!");

      let response = `🏆 **Leaderboard — ${channelKey}:**\n\n`;
      for (let i = 0; i < data.length; i++) {
        const member = await interaction.guild.members
          .fetch(data[i].user_id)
          .catch(() => null);
        const name = member ? member.user.username : "Unknown User";
        response += `**${i + 1}.** ${name} — ${data[i].count} messages\n`;
      }
      await interaction.editReply(response);
    } catch (err) {
      console.error("Leaderboard command failed:", err);
      await interaction.editReply(`Something went wrong: ${err.message}`);
    }
  }

  // --- Reset Command ---
  if (interaction.commandName === "reset") {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "You need to be an admin to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

      const channelConfig = roleConfig.CHANNELS.find(
        (c) => c.key === channelKey,
      );
      if (channelConfig) {
        const targetMember = await interaction.guild.members
          .fetch(targetUser.id)
          .catch(() => null);
        if (targetMember) {
          const tierRoleIds = channelConfig.tiers.map((t) => t.roleId);
          for (const roleId of tierRoleIds) {
            if (targetMember.roles.cache.has(roleId)) {
              await targetMember.roles
                .remove(roleId)
                .catch((err) =>
                  console.error(
                    `Failed to remove role ${roleId}:`,
                    err.message,
                  ),
                );
            }
          }
        }
      }

      const logChannel = await interaction.guild.channels
        .fetch(LOG_CHANNEL_ID)
        .catch((err) => {
          console.error(
            `Could not fetch log channel ${LOG_CHANNEL_ID}:`,
            err.message,
          );
          return null;
        });
      if (logChannel) {
        await logChannel.send(
          `🔄 **${interaction.user.username}** reset **${targetUser.username}**'s count and roles in **${channelKey}**`,
        );
      } else {
        console.warn(
          `Skipped reset log — channel ${LOG_CHANNEL_ID} not found or bot lacks access.`,
        );
      }

      await interaction.editReply(
        `Reset ${targetUser.username}'s count and tier roles in ${channelKey}.`,
      );
    } catch (err) {
      console.error("Reset command failed:", err);
      await interaction.editReply(
        `Failed to reset count: ${err.message || "Unknown error"}`,
      );
    }
  }
};
