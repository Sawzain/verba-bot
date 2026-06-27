export const roleConfig = {
  ROLE_IDS: {
    // Poetry Corner
    STANZA_SEED: "1520438903092543629",
    VERSE_WEAVER: "1520438905185243216",
    POET_LAUREATE: "1520438907307819194",
    // Quotes & Highlights
    HIGHLIGHT_SCOUT: "1520438909560160287",
    PASSAGE_CURATOR: "1520438911632015380",
    MEMORY_KEEPER: "1520438913347489852",
    // Monthly Reviews
    SEASONED_READER: "1520438914849177742",
    // Reading Goals
    READER: "1520438917290266705",
    DEDICATED_READER: "1520438920012107846",
    BOOKKEEPER: "1520438922084089997",
    // Time-based
    BOOK_SAGE: "1520438925204656188",
    // General Chat
    PAGE_CHATTER: "1520438927490814102",
    CONVERSATIONALIST: "1520438929998745680",
    ORATOR: "1520438932477575209",
  },
  CHANNELS: [
    {
      channelId: "1485692154360758423",
      key: "poetry-corner",
      type: "tiered",
      tiers: [
        {
          threshold: 5,
          roleId: "1520438903092543629",
          roleName: "Stanza Seed",
        },
        {
          threshold: 20,
          roleId: "1520438905185243216",
          roleName: "Verse Weaver",
        },
        {
          threshold: 50,
          roleId: "1520438907307819194",
          roleName: "Poet Laureate",
        },
      ],
    },
    {
      channelId: "1465764322797162700",
      key: "quotes-highlights",
      type: "tiered",
      tiers: [
        {
          threshold: 5,
          roleId: "1520438909560160287",
          roleName: "Highlight Scout",
        },
        {
          threshold: 20,
          roleId: "1520438911632015380",
          roleName: "Passage Curator",
        },
        {
          threshold: 50,
          roleId: "1520438913347489852",
          roleName: "Memory Keeper",
        },
      ],
    },
    {
      channelId: "1516041606539509810",
      key: "monthly-reviews",
      type: "single",
      tiers: [
        {
          threshold: 1,
          roleId: "1520438914849177742",
          roleName: "Seasoned Reader",
        },
      ],
    },
    {
      channelId: "1467611752278659072",
      key: "reading-goals",
      type: "tiered",
      tiers: [
        { threshold: 1, roleId: "1520438917290266705", roleName: "Reader" },
        {
          threshold: 10,
          roleId: "1520438920012107846",
          roleName: "Dedicated Reader",
        },
        {
          threshold: 25,
          roleId: "1520438922084089997",
          roleName: "Bookkeeper",
        },
      ],
    },
    {
      channelId: "1465764681661546547",
      key: "general-chat",
      type: "tiered",
      tiers: [
        {
          threshold: 50,
          roleId: "1520438927490814102",
          roleName: "Page Chatter",
        },
        {
          threshold: 250,
          roleId: "1520438929998745680",
          roleName: "Conversationalist",
        },
        { threshold: 500, roleId: "1520438932477575209", roleName: "Orator" },
      ],
    },
  ],
};

export default roleConfig;
