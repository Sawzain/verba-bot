import 'dotenv/config';
import { supabase } from '../src/db/supabase.js';
const GUILD_ID = process.env.GUILD_ID;

const data = [
  // poetry-corner
  { user_id: '1453381230128140318', channel_key: 'poetry-corner', count: 49 },
  { user_id: '1461982178417049659', channel_key: 'poetry-corner', count: 36 },
  { user_id: '1351466543036502067', channel_key: 'poetry-corner', count: 12 },
  { user_id: '1377008141883019575', channel_key: 'poetry-corner', count: 4 },
  { user_id: '1486920998052823131', channel_key: 'poetry-corner', count: 4 },
  { user_id: '1425960961495400500', channel_key: 'poetry-corner', count: 4 },
  { user_id: '1500361544041763001', channel_key: 'poetry-corner', count: 3 },
  { user_id: '1379754847884152842', channel_key: 'poetry-corner', count: 3 },
  { user_id: '1396491598921207918', channel_key: 'poetry-corner', count: 2 },
  { user_id: '1225792523088171112', channel_key: 'poetry-corner', count: 2 },
  { user_id: '903006276026499093', channel_key: 'poetry-corner', count: 2 },
  { user_id: '714907908722131007', channel_key: 'poetry-corner', count: 1 },
  { user_id: '557289409347715103', channel_key: 'poetry-corner', count: 1 },
  { user_id: '1427708617792032819', channel_key: 'poetry-corner', count: 1 },
  { user_id: '1351825626377486336', channel_key: 'poetry-corner', count: 1 },
  { user_id: '1304859398690312296', channel_key: 'poetry-corner', count: 1 },

  // quotes-highlights
  {
    user_id: '557289409347715103',
    channel_key: 'quotes-highlights',
    count: 10,
  },
  {
    user_id: '1461982178417049659',
    channel_key: 'quotes-highlights',
    count: 5,
  },
  {
    user_id: '1351825626377486336',
    channel_key: 'quotes-highlights',
    count: 4,
  },
  {
    user_id: '1377008141883019575',
    channel_key: 'quotes-highlights',
    count: 4,
  },
  {
    user_id: '1453381230128140318',
    channel_key: 'quotes-highlights',
    count: 3,
  },
  { user_id: '763022762662690826', channel_key: 'quotes-highlights', count: 2 },
  {
    user_id: '1390367155882557501',
    channel_key: 'quotes-highlights',
    count: 2,
  },
  {
    user_id: '1482753403900662016',
    channel_key: 'quotes-highlights',
    count: 1,
  },
  {
    user_id: '1144859242495484025',
    channel_key: 'quotes-highlights',
    count: 1,
  },
  {
    user_id: '1486920998052823131',
    channel_key: 'quotes-highlights',
    count: 1,
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
