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

// ---------- Temp bans ----------
// Auto-mod bans (e.g. the 3rd @everyone/@here strike) are temporary, not
// permanent. We record when each ban should be lifted, and a scheduled job
// (see lib/tempBanExpiry.js) periodically unbans anyone past that date.

export const recordTempBan = async (userId, guildId, unbanAt) => {
  try {
    const { error } = await supabase.from('temp_bans').insert({
      user_id: userId,
      guild_id: guildId,
      unban_at: unbanAt.toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error(`Error recording temp ban for ${userId}:`, error);
  }
};

// Returns all temp-ban records for a guild whose unban_at has already passed.
export const getExpiredTempBans = async (guildId) => {
  try {
    const { data, error } = await supabase
      .from('temp_bans')
      .select('*')
      .eq('guild_id', guildId)
      .lte('unban_at', new Date().toISOString());

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Error fetching expired temp bans:', error);
    return [];
  }
};

export const removeTempBanRecord = async (userId, guildId) => {
  try {
    const { error } = await supabase
      .from('temp_bans')
      .delete()
      .eq('user_id', userId)
      .eq('guild_id', guildId);

    if (error) throw error;
  } catch (error) {
    console.error(`Error removing temp ban record for ${userId}:`, error);
  }
};
