export const roleConfig = {
  ROLE_IDS: {
    POET_1: "1519772842462548019",
    POET_2: "1519772844928667720",
    POET_3: "1519772846543474821",
    QUOTE_KEEPER_1: "1519772848661463251",
    QUOTE_KEEPER_2: "1519772850414682232",
    QUOTE_KEEPER_3: "1519772852281409616",
    REVIEWER: "1519772854294548671",
    GOAL_SETTER: "1519772856093774087",
    VETERAN_READER: "1519772858000800000",
  },
  CHANNELS: [
    {
      channelId: "1485692154360758423",
      key: "poetry-corner",
      type: "tiered",
      tiers: [
        { threshold: 5, roleId: "1519772842462548019", roleName: "Poet I" },
        { threshold: 20, roleId: "1519772844928667720", roleName: "Poet II" },
        { threshold: 50, roleId: "1519772846543474821", roleName: "Poet III" },
      ],
    },
    {
      channelId: "1465764322797162700",
      key: "quotes-highlights",
      type: "tiered",
      tiers: [
        {
          threshold: 5,
          roleId: "1519772848661463251",
          roleName: "Quote Keeper I",
        },
        {
          threshold: 20,
          roleId: "1519772850414682232",
          roleName: "Quote Keeper II",
        },
        {
          threshold: 50,
          roleId: "1519772852281409616",
          roleName: "Quote Keeper III",
        },
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
  ],
};
export default roleConfig;
