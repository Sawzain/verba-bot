import { supabase } from '../db/supabase.js';

// Increments (or starts) a member's @everyone/@here strike count.
// Strikes automatically expire after 30 days of no offenses (handled in the
// Postgres function itself, so this stays a single atomic call).
export const incrementEveryonePingStrike = async (userId, guildId) => {
  try {
    const { data, error } = await supabase.rpc(
      'increment_everyone_ping_strike',
      {
        p_user_id: userId,
        p_guild_id: guildId,
      }
    );

    if (error) throw error;
    return data; // new strike count
  } catch (error) {
    console.error(
      `Error incrementing everyone-ping strike for ${userId}:`,
      error
    );
    return null;
  }
};

// Clears a member's strike count (called after a ban).
export const resetEveryonePingStrike = async (userId, guildId) => {
  try {
    const { error } = await supabase.rpc('reset_everyone_ping_strike', {
      p_user_id: userId,
      p_guild_id: guildId,
    });

    if (error) throw error;
  } catch (error) {
    console.error(`Error resetting everyone-ping strike for ${userId}:`, error);
  }
};
