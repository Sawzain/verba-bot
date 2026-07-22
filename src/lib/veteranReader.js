import roleConfig from '../config/roleTiers.js';
import { LOG_CHANNEL_ID } from '../config/channelIds.js';

export const isVeteranReaderEligible = (member) => {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  return member.joinedAt && member.joinedAt <= sixMonthsAgo;
};

const logDmFailure = async (guild, member, err) => {
  try {
    const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          {
            title: '⚠️ Book Sage DM failed',
            color: 0xffaa00,
            fields: [
              {
                name: 'User',
                value: `<@${member.id}> (${member.user.tag})`,
                inline: true,
              },
              {
                name: 'Error',
                value: `\`${err.code ?? 'N/A'}\` ${err.message}`,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (logErr) {
    console.error(
      'Failed to log Book Sage DM failure to #bot-logs:',
      logErr.message
    );
  }
};

export const runVeteranReaderCheck = async (guild) => {
  const veteranRoleId = roleConfig.ROLE_IDS.BOOK_SAGE;
  if (!veteranRoleId) {
    console.error('VETERAN_READER role ID not set in roleTiers.js');
    return;
  }
  try {
    const members = await guild.members.fetch();
    let grantedCount = 0;
    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (member.roles.cache.has(veteranRoleId)) continue;
      if (isVeteranReaderEligible(member)) {
        try {
          await member.roles.add(veteranRoleId);
          grantedCount++;
          console.log(`Granted Veteran Reader to ${member.user.tag}`);

          try {
            await member.send(
              `🎉 Congratulations! You've been in **${guild.name}** for 6+ months and have been promoted to **Book Sage**!`
            );
            console.log(`✅ DM sent to ${member.user.tag} for Book Sage`);
          } catch (dmErr) {
            console.warn(
              `❌ Could not DM ${member.user.tag} about Book Sage:`,
              dmErr.code,
              dmErr.message
            );
            await logDmFailure(guild, member, dmErr);
          }
        } catch (error) {
          console.error(
            `Failed to grant Veteran Reader to ${member.user.tag}:`,
            error.message
          );
        }
      }
    }
    console.log(
      `Veteran Reader check complete. Granted to ${grantedCount} member(s).`
    );
  } catch (error) {
    console.error('Error running Veteran Reader check:', error);
  }
};
