import {
  getExpiredTempBans,
  removeTempBanRecord,
} from './moderationStrikes.js';

export const runTempBanExpiryCheck = async (guild) => {
  try {
    const expired = await getExpiredTempBans(guild.id);
    let unbannedCount = 0;

    for (const record of expired) {
      try {
        await guild.members.unban(
          record.user_id,
          'Temp ban expired (auto-mod)'
        );
        unbannedCount++;
        console.log(`Unbanned ${record.user_id} — temp ban expired`);
      } catch (err) {
        // Common benign case: they were already unbanned manually. Still
        // clear the record either way so it doesn't get retried forever.
        console.error(
          `Failed to unban ${record.user_id} (may already be unbanned):`,
          err.message
        );
      } finally {
        await removeTempBanRecord(record.user_id, guild.id);
      }
    }

    console.log(
      `Temp ban expiry check complete. Unbanned ${unbannedCount} member(s).`
    );
  } catch (error) {
    console.error('Error running temp ban expiry check:', error);
  }
};
