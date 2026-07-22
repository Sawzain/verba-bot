# Verba Bot 🤖

A Discord bot for the Verba Book Club server that tracks member activity and assigns roles based on participation.

## Features

### 🎭 Role Assignment

Automatically assigns roles based on message activity in specific channels.

| Channel           | Roles                                             | Thresholds     |
| ----------------- | ------------------------------------------------- | -------------- |
| poetry-corner     | Stanza Seed → Verse Weaver → Poet Laureate        | 5 → 20 → 50    |
| quotes-highlights | Highlight Scout → Passage Curator → Memory Keeper | 5 → 20 → 50    |
| monthly-reviews   | Seasoned Reader                                   | 1              |
| reading-goals     | Reader → Dedicated Reader → Bookkeeper            | 1 → 10 → 25    |
| general-chat      | Page Chatter → Conversationalist → Orator         | 50 → 250 → 500 |

### ⏱️ Cooldown

- 1 message counted per user per channel every 60 seconds
- Minimum 10 words required to count

### 🏅 Book Sage (Veteran Reader)

- Automatically granted to members who have been in the server for 6+ months
- Checked daily via cron job at midnight

### 📊 Slash Commands

- `/rank` — shows your activity count and current role in each channel (only visible to you)
- `/leaderboard [channel]` — shows top 10 members in a channel
- `/reset [user] [channel]` — resets a user's activity count (admin only)

### 📝 Logging

All role promotions and resets are logged to #bot-logs

### 🔄 Rejoin Reset

If a member leaves and rejoins, their activity counts are reset

## Tech Stack

- Discord.js v14
- Supabase (PostgreSQL) for activity tracking
- node-cron for scheduled jobs
- Wispbyte for 24/7 hosting

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```
DISCORD_TOKEN=your-discord-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GUILD_ID=your-guild-id
```

### 3. Set up Supabase

Run this in Supabase SQL editor:

```sql
CREATE TABLE activity_counts (
  id bigint generated always as identity primary key,
  user_id text not null,
  guild_id text not null,
  channel_key text not null,
  count integer not null default 0,
  updated_at timestamp with time zone default now(),
  unique (user_id, guild_id, channel_key)
);

CREATE OR REPLACE FUNCTION increment_activity_count(
  p_user_id TEXT,
  p_guild_id TEXT,
  p_channel_key TEXT
)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO activity_counts (user_id, guild_id, channel_key, count)
  VALUES (p_user_id, p_guild_id, p_channel_key, 1)
  ON CONFLICT (user_id, guild_id, channel_key)
  DO UPDATE SET
    count = activity_counts.count + 1,
    updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
```

### 4. Create roles in Discord

```
node src/scripts/setupRoles.js
```

### 5. Run the bot

```
node src/index.js
```

## Deployment

Hosted on Wispbyte. Auto-deploys on every push to `main` (git pull runs on server restart via the startup script).
