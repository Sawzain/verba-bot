import 'dotenv/config';

// Centralized channel/role IDs used across multiple files.
// These are deployment-specific (different per Discord server), so they're
// read from environment variables. The fallback values are this server's
// current IDs, so nothing breaks if the env vars aren't set yet — but new
// deployments should set these in .env instead of editing this file.

export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '1519821472850378804';
export const WELCOME_CHANNEL_ID =
  process.env.WELCOME_CHANNEL_ID || '1462915741434122424';
export const GENERAL_CHAT_CHANNEL_ID =
  process.env.GENERAL_CHAT_CHANNEL_ID || '1465764681661546547';
export const MEETING_CHANNEL_ID =
  process.env.MEETING_CHANNEL_ID || '1463471405835358280';

// Comma-separated list of role IDs allowed to ping @everyone/@here without
// triggering the anti-spam guard. Set MOD_ROLE_IDS in .env, e.g.
// MOD_ROLE_IDS=1520000000000000000,1520000000000000001
export const MOD_ROLE_IDS = (process.env.MOD_ROLE_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);