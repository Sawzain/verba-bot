import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const ROLES_TO_CREATE = [
  { name: "Stanza Seed", color: 0xc9b8e8 },
  { name: "Verse Weaver", color: 0x9b72cf },
  { name: "Poet Laureate", color: 0x6a0dad },
  { name: "Highlight Scout", color: 0xf5d78e },
  { name: "Passage Curator", color: 0xd4a017 },
  { name: "Memory Keeper", color: 0x8b6914 },
  { name: "Seasoned Reader", color: 0x5b9bd5 },
  { name: "Reader", color: 0xa8d5a2 },
  { name: "Dedicated Reader", color: 0x4caf50 },
  { name: "Bookkeeper", color: 0x2e7d32 },
  { name: "Book Sage", color: 0x2e8b8b },
  { name: "Page Chatter", color: 0xf4a460 },
  { name: "Conversationalist", color: 0xe2703a },
  { name: "Orator", color: 0xb22222 },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  console.log(`Connected to ${guild.name}. Creating roles...\n`);

  for (const roleData of ROLES_TO_CREATE) {
    const existing = guild.roles.cache.find((r) => r.name === roleData.name);
    if (existing) {
      console.log(
        `SKIPPED (already exists): ${roleData.name} -> ${existing.id}`,
      );
      continue;
    }
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      mentionable: false,
    });
    console.log(`CREATED: ${roleData.name} -> ${role.id}`);
  }

  console.log("\nDone. Copy the IDs above into src/config/roleTiers.js");
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
