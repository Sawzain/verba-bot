import "dotenv/config";
import cron from "node-cron";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleInteraction } from "./events/interactionCreate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const commands = [
  {
    name: "rank",
    description: "Check your activity counts in each channel",
  },
  {
    name: "leaderboard",
    description: "Show top members per channel",
    options: [
      {
        name: "channel",
        description: "Which channel leaderboard to show",
        type: 3,
        required: true,
        choices: [
          { name: "Poetry Corner", value: "poetry-corner" },
          { name: "Quotes & Highlights", value: "quotes-highlights" },
          { name: "Monthly Reviews", value: "monthly-reviews" },
          { name: "Reading Goals", value: "reading-goals" },
          { name: "General Chat", value: "general-chat" },
        ],
      },
    ],
  },
  {
    name: "reset",
    description: "Reset a user's activity count (admin only)",
    options: [
      {
        name: "user",
        description: "The user to reset",
        type: 6,
        required: true,
      },
      {
        name: "channel",
        description: "Which channel to reset",
        type: 3,
        required: true,
        choices: [
          { name: "Poetry Corner", value: "poetry-corner" },
          { name: "Quotes & Highlights", value: "quotes-highlights" },
          { name: "Monthly Reviews", value: "monthly-reviews" },
          { name: "Reading Goals", value: "reading-goals" },
          { name: "General Chat", value: "general-chat" },
        ],
      },
    ],
  },
];

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
    { body: commands },
  );
  console.log("Slash commands registered!");

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
client.on("interactionCreate", handleInteraction);
client.on("guildMemberAdd", handleGuildMemberAdd);

client.login(process.env.DISCORD_TOKEN);
