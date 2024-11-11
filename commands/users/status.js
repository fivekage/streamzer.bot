
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../client.js');
module.exports.help = {
   name: 'status',
   description: 'Check the status of a user',
   options: [
      {
         name: 'username',
         description: 'The user you want to check the status of',
         type: ApplicationCommandOptionType.User,
         required: true,
      }
   ],
};

module.exports.run = async (_client, message) => {
   const user = message.options.getUser('username');
   logger.info(`Checking status of ${user.username} asked by ${message.user.username}`);

   // Get the status
   const dbUser = await prisma.user.findUnique({
      where: {
         id_discord_account: user.id
      }

   })
   if (!dbUser) {
      const embed = new EmbedBuilder()
         .setTitle('User Status')
         .setDescription(`User **${user.username}** not found in 5KAGE Streamzer database`)
         .setColor(vars.primaryColor)
         .setTimestamp()
      return await message.editReply({
         embeds: [embed]
      });
   }

   let dbRole = null
   if (dbUser.role_id != null)
      dbRole = (await prisma.role.findFirst({
         where:
         {
            id: dbUser.role_id
         }
      }))
   const embed = new EmbedBuilder()
      .setTitle('User Status')
      .setDescription(`Account <@${dbUser.id_discord_account}>  created at ${dbUser.created_at.toUTCString()}`)
      .addFields(
         {
            name: 'Last update',
            value: `${dbUser.updated_at.toLocaleDateString()} ${dbUser.updated_at.toLocaleTimeString()}`,
            inline: true
         },
         {
            name: 'Role',
            value: `**${dbRole?.name ?? 'No role found'}**`,
            inline: true
         }

      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   await message.editReply({ embeds: [embed] });

};