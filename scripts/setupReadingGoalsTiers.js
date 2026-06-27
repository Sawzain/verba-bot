import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  console.log(`Connected to ${guild.name}.\n`);

  const pageScout = await guild.roles.fetch("1519772856093774087");
  if (pageScout) {
    await pageScout.setName("Page Scout");
    await pageScout.setColor("#C9A66B");
    console.log(`RENAMED: Goal Setter -> Page Scout (${pageScout.id})`);
  } else {
    console.log(
      "NOT FOUND: existing Goal Setter role ID — check it still exists",
    );
  }

  const readingCurator = await guild.roles.create({
    name: "Reading Curator",
    color: "#8C6B3F",
    mentionable: false,
  });
  console.log(`CREATED: Reading Curator -> ${readingCurator.id}`);

  const habitKeeper = await guild.roles.create({
    name: "Habit Keeper",
    color: "#4F3B1F",
    mentionable: false,
  });
  console.log(`CREATED: Habit Keeper -> ${habitKeeper.id}`);

  console.log("\nDone. Copy the IDs above into src/config/roleTiers.js");
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
