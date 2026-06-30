import { supabase } from '../db/supabase.js';
import { EmbedBuilder } from 'discord.js';

const LOG_CHANNEL_ID = '1519821472850378804';
const WELCOME_CHANNEL_ID = '1462915741434122424';

const GREETINGS = [
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖✨ A new chapter begins — and you're in it!`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🚨 **Alert alert** 🚨 A new reader has been detected!!`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📚 A new bookworm has entered the chat!! Quick, everyone act normal 👀`,
  (member) =>
    `👋 Welcome to the book club, ${member}! ✨📖 The shelves just got a little more magical! We're a small club with **big feelings** about books 🥹`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📔✨ The club just got a wonderful new member 😊 We don't bite, we only recommend books 😄💚`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖 The prophecy said a new member would arrive... and here you are 🔮 **Destiny awaits.**`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🐛 Oh? A new friend?? Hello hello hello!! We like books here. Do you like books?? Good. 🌸`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🦋 A wild reader appears! Everyone stay calm and offer them a book recommendation.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📚🎉 The library just gained a new card holder! Grab a seat, the snacks are imaginary but the welcome is **real**.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🕯️ Another soul drawn to the shelves... we knew you'd find your way here eventually.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖💫 **Plot twist:** you just joined the best book club on the internet.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🐉 A new adventurer joins the quest for the next great read!`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🍂 Cozy up, grab a blanket, and tell us what you're currently reading.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📕 **Breaking news:** our club just got one reader cooler. That's you.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🌙 The bookshelves whispered your name, and here you are.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🧙 A new member has been summoned to the realm of books and chaos.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖🌟 We've been expecting you! The books are ready when you are.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🐢 Slow and steady, but readers always find their way to good company.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🎀 New arrival detected! We promise we're more fun than the algorithm made us seem.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📚✨ The council of readers has **approved your entry**! Welcome aboard.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🕊️ A new chapter in our story begins with you joining.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🍵 Pull up a chair, the tea is hot and the book talk is hotter.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🦉 Wise choice joining us. **The owls approve.**`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖🔥 **Hot take:** you're already one of our favorite members.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🌸 Spring has sprung, and so has a new reader in our midst!`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🎈 Confetti cannons activated! A new member has joined the party.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖🗝️ You've unlocked access to the best book conversations on Discord.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖 **Verba** has officially logged your arrival in the great book of members.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖 Verba says: another reader for the collection! Welcome home.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! ✨ Verba sniffed you out — **a true reader has arrived.**`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📚 Verba's tracking system confirms: 1 new bookworm detected.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 🎉 Even Verba is excited, and Verba doesn't get excited often.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖 Verba has cleared a spot on the shelf **just for you.**`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 💚 Verba welcomes you personally — that's a **rare honor** around here.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📚 The Verba Book Club grows by one! May your reading list grow even faster.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! 📖 Verba approves of your arrival.`,
  (member) =>
    `👋 Welcome to the book club, ${member}! ✨ Verba whispers: **welcome, fellow reader,** your story starts here.`,
];

export const handleGuildMemberAdd = async (member) => {
  try {
    await supabase
      .from('activity_counts')
      .delete()
      .eq('user_id', member.user.id)
      .eq('guild_id', member.guild.id);

    const logChannel = await member.guild.channels
      .fetch(LOG_CHANNEL_ID)
      .catch(() => null);
    if (logChannel) {
      await logChannel.send(
        `🔄 **${member.user.username}** rejoined — activity counts reset`
      );
    }

    console.log(`Reset counts for rejoined member ${member.user.tag}`);

    // Randomized welcome message
    const welcomeChannel = await member.guild.channels
      .fetch(WELCOME_CHANNEL_ID)
      .catch(() => null);

    if (welcomeChannel) {
      const randomGreeting =
        GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      await welcomeChannel.send(
        `${randomGreeting(member)} Come say hi in 👉 <#1465764681661546547> 💬`
      );
    }
  } catch (error) {
    console.error(
      `Error handling guild member add for ${member.user.tag}:`,
      error
    );
  }
};
