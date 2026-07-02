import 'dotenv/config';
import { supabase } from '../../src/db/supabase.js';
const GUILD_ID = process.env.GUILD_ID;

const data = [
  // poetry-corner

  { user_id: '557289409347715103', channel_key: 'poetry-corner', count: 1 },

  // quotes-highlights
  {
    user_id: '557289409347715103',
    channel_key: 'quotes-highlights',
    count: 10,
  },
  {
    user_id: '714907908722131007',
    channel_key: 'quotes-highlights',
    count: 5,
  },
  // general-chat
  {
    user_id: '557289409347715103',
    channel_key: 'general-chat',
    count: 500,
  },
  {
    user_id: '714907908722131007',
    channel_key: 'general-chat',
    count: 500,
  },
];

for (const row of data) {
  const { error } = await supabase
    .from('activity_counts')
    .upsert(
      { ...row, guild_id: GUILD_ID, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,guild_id,channel_key' }
    );

  if (error) {
    console.error(`❌ ${row.user_id} → ${row.channel_key}:`, error.message);
  } else {
    console.log(`✅ ${row.user_id} → ${row.channel_key}: ${row.count}`);
  }
}

console.log('\nDone!');
