import cron from 'node-cron';

const MEETING_CHANNEL_ID = '1463471405835358280';
const EVENT_LINK =
  'https://discord.com/events/1462915739697549376/1462919586000146462';

// Pick a random message from an array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ───────────── MIDDAY REMINDERS (Saturday 12:00 GMT) ─────────────
const middayMessages = [
  `📖 Rise and shine, Verba! Today's the day — our meeting kicks off at **3:00 PM GMT**. Save your spot in the story: ${EVENT_LINK}`,
  `🍃 A page turns, a Saturday begins... and so does our gathering, at **3:00 PM GMT** today. See you between the lines: ${EVENT_LINK}`,
  `🕊️ Good morning, wordsmiths! Today we meet at **3:00 PM GMT**. Bring your thoughts, your quotes, your half-written poems: ${EVENT_LINK}`,
  `📚 Plot twist: it's Saturday, and Verba is meeting today at **3:00 PM GMT**! Don't miss this chapter: ${EVENT_LINK}`,
  `✒️ The ink is drying on today's agenda — meeting at **3:00 PM GMT**. Save the date, err, the moment: ${EVENT_LINK}`,
  `🌙 Once upon a Saturday, a book club gathered at **3:00 PM GMT**... will you be part of the story? ${EVENT_LINK}`,
  `🍂 Turning the page to today: our meeting begins at **3:00 PM GMT**. See you in the margins: ${EVENT_LINK}`,
  `🖋️ Verba assemble! Today's meeting is at **3:00 PM GMT** — bring your favorite lines and loudest opinions: ${EVENT_LINK}`,
  `📜 A little bird (or feather 🪶) tells me it's meeting day. **3:00 PM GMT**, don't be a cliffhanger: ${EVENT_LINK}`,
  `🌸 Good morning readers — chapter "Today's Meeting" begins at **3:00 PM GMT**. RSVP here: ${EVENT_LINK}`,
  `📖 New chapter, same great club — today at **3:00 PM GMT**. Mark your bookmark: ${EVENT_LINK}`,
  `🫖 Put the kettle on — Verba's meeting today at **3:00 PM GMT**. Details here: ${EVENT_LINK}`,
  `🪄 Today's forecast: 100% chance of good conversation, starting **3:00 PM GMT**: ${EVENT_LINK}`,
  `🦉 Wise words await — join us today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌻 Saturday's here, and so is Verba! Meeting today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `📕 Dog-ear this reminder — meeting today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕯️ Light a candle, grab a book, and clear your evening — we meet at **3:00 PM GMT** today: ${EVENT_LINK}`,
  `🍯 A sweet Saturday awaits — Verba gathers today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🗝️ Unlock today's chapter with us at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌼 Today's the day! Verba meets at **3:00 PM GMT** — see you there: ${EVENT_LINK}`,
];

// ───────────── 1 HOUR BEFORE (Saturday 14:00 GMT) ─────────────
const oneHourMessages = [
  `⏳ One hour until Verba convenes! **3:00 PM GMT**. Grab your tea, your book, your best line: ${EVENT_LINK}`,
  `📖 The countdown begins — meeting starts in 1 hour (**3:00 PM GMT**). See you soon: ${EVENT_LINK}`,
  `🍃 60 minutes stand between you and great conversation. Meeting at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕰️ Tick tock, bookworms — 1 hour to go! **3:00 PM GMT** sharp: ${EVENT_LINK}`,
  `✨ The story picks up in an hour. Meeting at **3:00 PM GMT** — don't skip this chapter: ${EVENT_LINK}`,
  `🌟 An hour from now, we gather. **3:00 PM GMT**. Bring your voice, your verse, your vibe: ${EVENT_LINK}`,
  `📚 T-minus 1 hour to Verba time! **3:00 PM GMT**: ${EVENT_LINK}`,
  `🪶 One hour left to bookmark your calendar — meeting at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌙 The chapter begins in an hour. **3:00 PM GMT**. See you there: ${EVENT_LINK}`,
  `☕ Time for one more cup of tea before we meet — **3:00 PM GMT**, just an hour away: ${EVENT_LINK}`,
  `📗 One hour to go — finish that paragraph and join us at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🧣 Cozy up, we meet in an hour — **3:00 PM GMT**: ${EVENT_LINK}`,
  `🔖 Bookmark your page — we reconvene in 1 hour, **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌤️ One hour countdown started — see you at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🎭 Act two begins in an hour — join at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🧵 Weaving the last thread before we meet — 1 hour to **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍁 An hour stands between now and now-ish (**3:00 PM GMT**): ${EVENT_LINK}`,
  `📯 Hear ye, hear ye — Verba convenes in 1 hour: ${EVENT_LINK}`,
  `🌊 The tide's turning toward **3:00 PM GMT** — 1 hour left: ${EVENT_LINK}`,
  `🧩 One piece of the day left before we meet — **3:00 PM GMT**: ${EVENT_LINK}`,
];

// ───────────── 15 MINUTES BEFORE (Saturday 14:45 GMT) ─────────────
const fifteenMinMessages = [
  `🚨 15 minutes to go! Grab your seat, Verba's about to begin: ${EVENT_LINK}`,
  `📖 Final call — meeting starts in 15 minutes! ${EVENT_LINK}`,
  `⏰ Quick, close the tab you're procrastinating on — we start in 15! ${EVENT_LINK}`,
  `🍃 15 minutes till the pages turn — join us: ${EVENT_LINK}`,
  `✨ Almost time! 15 minutes to showtime: ${EVENT_LINK}`,
  `🪶 The feather's about to drop — 15 minutes to go! ${EVENT_LINK}`,
  `📚 Last call for latecomers — 15 minutes and counting: ${EVENT_LINK}`,
  `🌟 15 minutes till we open the book together: ${EVENT_LINK}`,
  `🕊️ Almost showtime, Verba — 15 minutes left: ${EVENT_LINK}`,
  `💫 The countdown's nearly over — see you in 15: ${EVENT_LINK}`,
  `🔔 Ding ding! 15 minutes till we begin: ${EVENT_LINK}`,
  `🎬 Places, everyone — we're rolling in 15 minutes: ${EVENT_LINK}`,
  `🧭 15 minutes to find your seat — join here: ${EVENT_LINK}`,
  `🍵 Last sip of tea, we start in 15: ${EVENT_LINK}`,
  `📌 Pin this — 15 minutes to Verba time: ${EVENT_LINK}`,
  `🌅 The final stretch — 15 minutes left: ${EVENT_LINK}`,
  `🎈 15 minutes and counting till we gather: ${EVENT_LINK}`,
  `🖇️ Wrap up what you're doing — 15 minutes to go: ${EVENT_LINK}`,
  `🌺 Almost time to bloom into conversation — 15 minutes: ${EVENT_LINK}`,
  `🚪 The door opens in 15 minutes — see you inside: ${EVENT_LINK}`,
];

export const scheduleMeetingReminders = (client) => {
  const sendReminder = async (messagePool) => {
    try {
      const channel = await client.channels.fetch(MEETING_CHANNEL_ID);
      await channel.send(pick(messagePool));
    } catch (err) {
      console.error('Failed to send meeting reminder:', err.message);
    }
  };

  // Midday - Saturday 12:00 GMT
  cron.schedule('0 12 * * 6', () => sendReminder(middayMessages), {
    timezone: 'Etc/UTC',
  });

  // 1 hour before - Saturday 14:00 GMT
  cron.schedule('0 14 * * 6', () => sendReminder(oneHourMessages), {
    timezone: 'Etc/UTC',
  });

  // 15 minutes before - Saturday 14:45 GMT
  cron.schedule('45 14 * * 6', () => sendReminder(fifteenMinMessages), {
    timezone: 'Etc/UTC',
  });
};
