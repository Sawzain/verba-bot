import "dotenv/config";
import cron from "node-cron";
import { Client, GatewayIntentBits } from "discord.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { grantVeteranReaderRole } from "./events/guildMemberAdd.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running Veteran Reader cron job...");
    try {
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const members = await guild.members.fetch();

      let granted = 0;
      for (const [, member] of members) {
        if (member.user.bot) continue;
        const wasGranted = await grantVeteranReaderRole(member);
        if (wasGranted) granted++;
      }

      console.log(`Veteran Reader cron done. Granted to ${granted} members.`);
    } catch (error) {
      console.error("Error in Veteran Reader cron job:", error);
    }
  });
});

client.on("messageCreate", handleMessageCreate);

client.login(process.env.DISCORD_TOKEN);
