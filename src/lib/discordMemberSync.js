const BATCH_SIZE = 200;

function toPayload(member) {
  return {
    discordId: member.user.id,
    username: member.user.username,
    displayName: member.displayName,
    roles: [...member.roles.cache.values()]
      .filter((r) => r.id !== member.guild.id && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
  };
}

async function callBackend(path, options = {}) {
  const base = process.env.BACKEND_URL;
  const secret = process.env.BOT_SYNC_SECRET;
  if (!base || !secret) {
    console.warn('Member sync skipped: BACKEND_URL or BOT_SYNC_SECRET not set.');
    return null;
  }
  const res = await fetch(`${base}/api/discord-members${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': secret,
    },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Backend responded ${res.status}`);
  }
  return res;
}

async function sendBatch(members) {
  await callBackend('/sync', {
    method: 'POST',
    body: JSON.stringify({ members }),
  });
}

// Reads the member list over REST (pages of 1000). This avoids the
// gateway's tight limit on full member requests, which the Veteran
// Reader check at startup already uses up.
async function listAllMembers(guild) {
  const all = [];
  let after;
  for (;;) {
    const page = await guild.members.list({ limit: 1000, after });
    if (page.size === 0) break;
    all.push(...page.values());
    if (page.size < 1000) break;
    after = page.last().id;
  }
  return all;
}

// Full sweep: send every non-bot member of the server, in batches.
export async function syncAllMembers(guild) {
  try {
    const members = await listAllMembers(guild);
    const list = members
      .filter((m) => !m.user.bot)
      .map(toPayload);
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      await sendBatch(list.slice(i, i + BATCH_SIZE));
    }
    console.log(`Member sync: sent ${list.length} members to the backend.`);
  } catch (err) {
    console.error('Member sync failed:', err.message);
  }
}

// One member joined or changed their name.
export async function syncMember(member) {
  try {
    if (member.user.bot) return;
    await sendBatch([toPayload(member)]);
  } catch (err) {
    console.error(`Member sync failed for ${member.user.tag}:`, err.message);
  }
}

// One member left the server.
export async function removeMember(userId) {
  try {
    await callBackend(`/${userId}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`Member removal sync failed for ${userId}:`, err.message);
  }
}
