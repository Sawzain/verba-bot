import cron from 'node-cron';
import { MEETING_CHANNEL_ID } from '../config/channelIds.js';

const EVENT_LINK =
  'https://discord.com/events/1462915739697549376/1462919586000146462';

// Pick a random message from an array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ───────────── MIDDAY REMINDERS (Saturday 12:00 GMT) ─────────────
const middayMessages = [
  `📖 Good morning, Verba! Somewhere your bookmark is waiting, your tea is steeping, and today we get to talk about all of it together. Meeting kicks off at **3:00 PM GMT** — come save your seat in the story: ${EVENT_LINK}`,
  `🍃 A new Saturday, a new chapter. Today's the day we set our books down for an hour and talk about what's on the page — and what's off it too. **3:00 PM GMT**, don't miss it: ${EVENT_LINK}`,
  `🕊️ Rise and shine, wordsmiths! Whatever you're reading this week, bring it with you — your favorite line, your half-formed theory, your unpopular opinion about the ending. We meet at **3:00 PM GMT**: ${EVENT_LINK}`,
  `📚 Plot twist: it's Saturday, and that means Verba is gathering. Come for the books, stay for the tangents nobody saw coming. **3:00 PM GMT** today: ${EVENT_LINK}`,
  `✒️ The ink's still drying on today's plans, but here's what we know for sure — we're meeting at **3:00 PM GMT**, and it's always better with you there. Save your spot: ${EVENT_LINK}`,
  `🌙 Once upon a Saturday, a little book club gathered to talk about stories, share a few quotes, and laugh more than expected. That's today, at **3:00 PM GMT**. Will you be part of it? ${EVENT_LINK}`,
  `🍂 Turning the page to today — our meeting begins at **3:00 PM GMT**, and there's always room for one more voice in the margins. Come find us: ${EVENT_LINK}`,
  `🖋️ Verba, assemble! Today at **3:00 PM GMT** we're trading quotes, opinions, and probably a few strong takes on our current read. Bring your favorite lines and your loudest thoughts: ${EVENT_LINK}`,
  `📜 A little bird tells me it's meeting day. **3:00 PM GMT**, and this is one cliffhanger you don't want to leave yourself on. Join us: ${EVENT_LINK}`,
  `🌸 Good morning, readers — today's chapter is simple: show up, talk books, make friends who get why you cried over a fictional character. **3:00 PM GMT**. RSVP here: ${EVENT_LINK}`,
  `🫖 Good morning, dear reader. Wherever you are, however your week's been, know there's a warm little corner of the internet waiting for you today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕯️ Some mornings just feel like they're meant for slow tea and good company. Today's one of them — we meet at **3:00 PM GMT**, and we'd love to have you there: ${EVENT_LINK}`,
  `🧸 Consider this your gentle nudge — today at **3:00 PM GMT** is for cozy blankets, favorite books, and the kind of conversation that makes a Saturday feel full. See you soon: ${EVENT_LINK}`,
  `🌷 Morning, Verba. However you're spending today, we hope there's a little room in it for us — **3:00 PM GMT**, tea in hand, book in lap: ${EVENT_LINK}`,
  `📔 There's something lovely about knowing exactly where you'll be at **3:00 PM GMT** today — right here, with us, talking about the stories we love. Come along: ${EVENT_LINK}`,
  `🕰️ Good morning! Today's meeting is less an event and more an invitation — to slow down, share a page, and be part of something small and sweet. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍯 Wishing you a soft, unhurried morning — and hoping we'll see your face today at **3:00 PM GMT** when we all gather to talk books: ${EVENT_LINK}`,
  `🧣 However chilly or bright your Saturday is, our little corner will be warm at **3:00 PM GMT**. Come wrap up with us and a good book: ${EVENT_LINK}`,
  `🌼 Today feels like a good day for tea, quiet company, and talking about the books that have been sitting with us all week. **3:00 PM GMT** — come be part of it: ${EVENT_LINK}`,
  `📖 Good morning, Verba family. However your week went, today is a soft landing — books, tea, and familiar faces at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍁 There's a particular kind of comfort in knowing your people will be somewhere at a certain time — today, that's here, at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌙 Good morning — may your tea be warm and your reading nook cozy. We'll be here at **3:00 PM GMT** if you'd like some company: ${EVENT_LINK}`,
  `🕯️ Today's little reminder: you're always welcome here. **3:00 PM GMT**, we'll be waiting with open arms and open books: ${EVENT_LINK}`,
  `🧡 A quiet good morning to you. Whatever page you're on, come turn a few more with us today at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕊️ A gentle good morning to all our readers — today at **3:00 PM GMT**, we'd love nothing more than to see you here, quote in hand: ${EVENT_LINK}`,
];

// ───────────── 1 HOUR BEFORE (Saturday 14:00 GMT) ─────────────
const oneHourMessages = [
  `⏳ One hour until Verba convenes! Enough time to grab your tea, dog-ear your page, and get your best line ready to share. **3:00 PM GMT** — see you soon: ${EVENT_LINK}`,
  `📖 The countdown's on. In one hour we open the floor for quotes, theories, and the occasional passionate debate about a plot twist. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍃 60 minutes stand between you and a room full of people who actually want to hear about the book you can't stop thinking about. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕰️ Tick tock, bookworms — one hour to go. Finish your sentence, close your tab, and get ready. **3:00 PM GMT** sharp: ${EVENT_LINK}`,
  `✨ The story picks back up in an hour, and trust us — you don't want to miss this chapter. **3:00 PM GMT**, bring your voice: ${EVENT_LINK}`,
  `🌟 An hour from now, we gather — quotes in hand, opinions ready, snacks optional but encouraged. **3:00 PM GMT**: ${EVENT_LINK}`,
  `📚 T-minus 1 hour to Verba time. Whatever you're mid-sentence on, it can wait — this can't. **3:00 PM GMT**: ${EVENT_LINK}`,
  `☕ Time for one last cup of tea before we meet. **3:00 PM GMT**, just an hour away, and we've got a lot to talk about: ${EVENT_LINK}`,
  `🧣 Cozy up — we meet in an hour, and this is your sign to actually show up this time. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🔖 Bookmark your page, we reconvene in 1 hour. Come with your favorite quote and leave with three new ones. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🫖 One hour left — just enough time to put the kettle on and get comfy before we settle in together at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕯️ An hour from now, this little corner will be full of warm voices and good stories. Come find your spot at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🧸 One hour to go — grab your softest blanket and your current read, we're so glad you'll be here at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌷 Just an hour now until we're all together again. Slow down, breathe, and we'll see you at **3:00 PM GMT**: ${EVENT_LINK}`,
  `📔 One hour left to finish your tea and gather your thoughts — we can't wait to hear what's on your mind at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌤️ An hour from now, familiar faces and favorite pages. Come as you are, we'll see you at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍯 One hour until we gather — sweetest part of the Saturday, if you ask us. **3:00 PM GMT**: ${EVENT_LINK}`,
  `🧡 An hour left, and already looking forward to seeing you. Settle in, we'll be here at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕊️ One hour to go — a gentle reminder that there's a warm little space waiting for you at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🍁 Just an hour now. Find your cozy corner, grab your book, and we'll see you soon at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌙 One hour left before we curl up together over stories and shared thoughts — see you at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🧵 An hour from now, we'll be trading favorite lines like little gifts. Come join us at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🌼 One hour to go — however your day's been, we hope this is the soft part of it. **3:00 PM GMT**: ${EVENT_LINK}`,
  `📖 An hour left until we open our books and our hearts a little. We'll be waiting at **3:00 PM GMT**: ${EVENT_LINK}`,
  `🕰️ Just one more hour — grab your tea, settle in, and know you're already welcome here. **3:00 PM GMT**: ${EVENT_LINK}`,
];

// ───────────── 15 MINUTES BEFORE (Saturday 14:45 GMT) ─────────────
const fifteenMinMessages = [
  `🚨 15 minutes to go! Grab your seat before Verba begins — this is the part where you stop scrolling and start joining: ${EVENT_LINK}`,
  `📖 Final call — meeting starts in 15 minutes, and yes, we've saved you a spot. Come claim it: ${EVENT_LINK}`,
  `⏰ Quick, close whatever tab you're procrastinating on — we start in 15, and it's always more fun with a full room: ${EVENT_LINK}`,
  `🍃 15 minutes till the pages turn and the conversation starts. Don't make us start without you: ${EVENT_LINK}`,
  `✨ Almost showtime — 15 minutes left, and there's still time to grab your tea and join the fun: ${EVENT_LINK}`,
  `🪶 The feather's about to drop — 15 minutes to go, and we promise it's worth logging on for: ${EVENT_LINK}`,
  `📚 Last call for latecomers — 15 minutes and counting, come say hi and bring a quote: ${EVENT_LINK}`,
  `🌟 15 minutes till we open the book together — come be part of the story instead of just reading about it: ${EVENT_LINK}`,
  `🔔 Ding ding! 15 minutes till we begin, and every seat's better with you in it: ${EVENT_LINK}`,
  `🎬 Places, everyone — we're rolling in 15 minutes, don't miss your cue: ${EVENT_LINK}`,
  `🫖 15 minutes left — just enough time to pour your tea and settle into your favorite spot before we begin: ${EVENT_LINK}`,
  `🕯️ Almost time. 15 minutes till this little corner fills up with warm voices — come find your place: ${EVENT_LINK}`,
  `🧸 15 minutes and counting — grab your blanket, your book, and come be cozy with us: ${EVENT_LINK}`,
  `🌷 So close now — just 15 minutes till we're all together. We've been looking forward to this: ${EVENT_LINK}`,
  `📔 15 minutes left to gather your thoughts and your favorite lines — we can't wait to hear them: ${EVENT_LINK}`,
  `🌤️ Almost there — 15 minutes until familiar faces and soft conversation. Come as you are: ${EVENT_LINK}`,
  `🍯 15 sweet minutes left before we begin — settle in, we've saved you a seat: ${EVENT_LINK}`,
  `🧡 Just 15 minutes now, and already so glad you're here. See you in a moment: ${EVENT_LINK}`,
  `🕊️ 15 minutes to go — a gentle little nudge that your warm corner is almost ready for you: ${EVENT_LINK}`,
  `🍁 15 minutes left — find your cozy spot, we're so close to starting: ${EVENT_LINK}`,
  `🌙 Almost time to curl up together — 15 minutes until we begin, see you soon: ${EVENT_LINK}`,
  `🧵 15 minutes left before we start trading favorite lines like little gifts — come join us: ${EVENT_LINK}`,
  `🌼 15 minutes to go — whatever your day's been, this is about to be the soft part of it: ${EVENT_LINK}`,
  `📖 15 minutes left until we open our books and our hearts a little — we'll be waiting: ${EVENT_LINK}`,
  `🕰️ Just 15 more minutes — grab your tea, take a breath, you're already welcome here: ${EVENT_LINK}`,
];

export const scheduleMeetingReminders = (client) => {
  const sendReminder = async (messagePool, label) => {
    try {
      const channel = await client.channels.fetch(MEETING_CHANNEL_ID).catch((err) => {
        console.error(
          `[meetingReminders] Could not fetch meeting channel ${MEETING_CHANNEL_ID}:`,
          err.message
        );
        return null;
      });

      if (!channel) {
        console.warn(
          `[meetingReminders] Skipped "${label}" reminder — channel ${MEETING_CHANNEL_ID} not found or bot lacks access.`
        );
        return;
      }

      const me = channel.guild?.members?.me;
      const perms = me ? channel.permissionsFor(me) : null;
      if (perms && (!perms.has('ViewChannel') || !perms.has('SendMessages'))) {
        console.warn(
          `[meetingReminders] Skipped "${label}" reminder — missing View Channel/Send Messages permission in ${MEETING_CHANNEL_ID}.`
        );
        return;
      }

      await channel.send(pick(messagePool));
      console.log(
        `[meetingReminders] ✅ "${label}" reminder sent in #${channel.name}`
      );
    } catch (err) {
      console.error(
        `[meetingReminders] Failed to send "${label}" reminder:`,
        err.message
      );
    }
  };

  // Midday - Saturday 12:00 GMT
  cron.schedule('0 12 * * 6', () => sendReminder(middayMessages, 'midday'), {
    timezone: 'Etc/UTC',
  });

  // 1 hour before - Saturday 14:00 GMT
  cron.schedule('0 14 * * 6', () => sendReminder(oneHourMessages, '1 hour before'), {
    timezone: 'Etc/UTC',
  });

  // 15 minutes before - Saturday 14:45 GMT
  cron.schedule('45 14 * * 6', () => sendReminder(fifteenMinMessages, '15 minutes before'), {
    timezone: 'Etc/UTC',
  });
};
