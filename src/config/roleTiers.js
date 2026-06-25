export const roleConfig = {
  ROLE_IDS: {
    VERSIFIER: "1519772842462548019",
    LYRICIST: "1519772844928667720",
    LAUREATE: "1519772846543474821",
    COLLECTOR: "1519772848661463251",
    CURATOR: "1519772850414682232",
    ARCHIVIST: "1519772852281409616",
    REVIEWER: "1519772854294548671",
    GOAL_SETTER: "1519772856093774087",
    VETERAN_READER: "1519772858000800000",
    CHATTERBOX: "", // ← fill after running setupRoles.js
    CONVERSATIONALIST: "", // ← fill after running setupRoles.js
    ORATOR: "", // ← fill after running setupRoles.js
  },
  CHANNELS: [
    {
      channelId: "1485692154360758423",
      key: "poetry-corner",
      type: "tiered",
      tiers: [
        { threshold: 5, roleId: "1519772842462548019", roleName: "Versifier" },
        { threshold: 20, roleId: "1519772844928667720", roleName: "Lyricist" },
        { threshold: 50, roleId: "1519772846543474821", roleName: "Laureate" },
      ],
    },
    {
      channelId: "1465764322797162700",
      key: "quotes-highlights",
      type: "tiered",
      tiers: [
        { threshold: 5, roleId: "1519772848661463251", roleName: "Collector" },
        { threshold: 20, roleId: "1519772850414682232", roleName: "Curator" },
        { threshold: 50, roleId: "1519772852281409616", roleName: "Archivist" },
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
        { threshold: 50, roleId: "", roleName: "Chatterbox" },
        { threshold: 250, roleId: "", roleName: "Conversationalist" },
        { threshold: 500, roleId: "", roleName: "Orator" },
      ],
    },
  ],
};

export default roleConfig;
