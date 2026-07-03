// meetingReminders.js — TEMP test version for tonight's run
// Fires at 11:27 / 11:28 / 11:29 PM NPT (17:42 / 17:43 / 17:44 UTC)
// Remember to restore the real Saturday-only schedule after testing!

import "dotenv/config";
import cron from "node-cron";
import { Client, GatewayIntentBits } from "discord.js";

const MEETING_CHANNEL_ID = "1519821472850378804";
const EVENT_LINK = "https://discord.com/events/1462915739697549376/1462919586000146462";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const middayMessages = [`📖 Rise and shine, Verba! Today's the day — meeting at **3:00 PM GMT**: ${EVENT_LINK}`];
const hourMessages = [`⏳ One hour until Verba convenes! **3:00 PM GMT**: ${EVENT_LINK}`];
const fifteenMessages = [`🚨 15 minutes to go! Join us: ${EVENT_LINK}`];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function sendReminder(pool, label) {
  try {
    const channel = await client.channels.fetch(MEETING_CHANNEL_ID);
    await channel.send(pick(pool));
    console.log(`✅ "${label}" reminder sent at ${new Date().toISOString()}`);
  } catch (err) {
    console.error(`❌ Failed to send "${label}" reminder:`, err.message);
  }
}

client.once("clientReady", () => {
  console.log("Bot ready — cron jobs armed for tonight's test.");
  console.log("Waiting for 17:42 (midday), 17:43 (hour), 17:44 (fifteen) UTC...");

  // 11:27 PM NPT -> 17:42 UTC
  cron.schedule("42 17 * * *", () => sendReminder(middayMessages, "midday"), {
    timezone: "Etc/UTC",
  });

  // 11:28 PM NPT -> 17:43 UTC
  cron.schedule("43 17 * * *", () => sendReminder(hourMessages, "hour"), {
    timezone: "Etc/UTC",
  });

  // 11:29 PM NPT -> 17:44 UTC
  cron.schedule("44 17 * * *", () => sendReminder(fifteenMessages, "fifteen"), {
    timezone: "Etc/UTC",
  });
});

client.login(process.env.DISCORD_TOKEN);