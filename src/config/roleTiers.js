export const roleConfig = {
  ROLE_IDS: {
    VERSIFIER: "1519812905682600006",
    LYRICIST: "1519812907494412349",
    LAUREATE: "1519812909549748466",
    COLLECTOR: "1519812911361691769",
    CURATOR: "1519812913395662897",
    ARCHIVIST: "1519812915245351015",
    REVIEWER: "1519772854294548671",
    GOAL_SETTER: "1519772856093774087",
    VETERAN_READER: "1519812916952432782",
    CHATTERBOX: "1519812919033069568",
    CONVERSATIONALIST: "1519812920333041808",
    ORATOR: "1519812922899959828",
  },
  CHANNELS: [
    {
      channelId: "1485692154360758423",
      key: "poetry-corner",
      type: "tiered",
      tiers: [
        { threshold: 5, roleId: "1519812905682600006", roleName: "Versifier" },
        { threshold: 20, roleId: "1519812907494412349", roleName: "Lyricist" },
        { threshold: 50, roleId: "1519812909549748466", roleName: "Laureate" },
      ],
    },
    {
      channelId: "1465764322797162700",
      key: "quotes-highlights",
      type: "tiered",
      tiers: [
        { threshold: 5, roleId: "1519812911361691769", roleName: "Collector" },
        { threshold: 20, roleId: "1519812913395662897", roleName: "Curator" },
        { threshold: 50, roleId: "1519812915245351015", roleName: "Archivist" },
      ],
    },
    {
      channelId: "1516041606539509810",
      key: "monthly-reviews",
      type: "single",
      tiers: [
        { threshold: 1, roleId: "1519772854294548671", roleName: "Reviewer" },
      ],
    },
    {
      channelId: "1467611752278659072",
      key: "reading-goals",
      type: "single",
      tiers: [
        {
          threshold: 1,
          roleId: "1519772856093774087",
          roleName: "Goal Setter",
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
          roleId: "1519812919033069568",
          roleName: "Chatterbox",
        },
        {
          threshold: 250,
          roleId: "1519812920333041808",
          roleName: "Conversationalist",
        },
        { threshold: 500, roleId: "1519812922899959828", roleName: "Orator" },
      ],
    },
  ],
};

export default roleConfig;
