import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const ROLES_TO_CREATE = [
  "Versifier",
  "Lyricist",
  "Laureate",
  "Collector",
  "Curator",
  "Archivist",
  "Reviewer",
  "Goal Setter",
  "Veteran Reader",
  "Chatterbox",
  "Conversationalist",
  "Orator", // ← new
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  console.log(`Connected to ${guild.name}. Creating roles...\n`);

  for (const roleName of ROLES_TO_CREATE) {
    // Skip if a role with this name already exists, to avoid duplicates on re-run
    const existing = guild.roles.cache.find((r) => r.name === roleName);
    if (existing) {
      console.log(`SKIPPED (already exists): ${roleName} -> ${existing.id}`);
      continue;
    }

    const role = await guild.roles.create({
      name: roleName,
      mentionable: false,
    });
    console.log(`CREATED: ${roleName} -> ${role.id}`);
  }

  console.log("\nDone. Copy the IDs above into src/config/roleTiers.js");
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
