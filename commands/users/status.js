
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../prisma.js');
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

module.exports.run = async (_client, interaction) => {
   const user = interaction.options.getUser('username');
   if (!user) {
      return interaction.reply({
         content: 'You must specify a username to accept',
         ephemeral: true,
      });
   }

   logger.info(`Checking status of ${user.username} asked by ${interaction.user.username}`);

   // Get the status
   const dbUser = await prisma.user.findUnique({
      where: {
         id_discord_account: user.id
      },
      include: {
         user_roles: true,

      },

   })
   if (!dbUser) {
      return interaction.reply({
         content: `User **${user.username}** not found in 5KAGE database`,
         ephemeral: true,
      });
   }
   // Build embed response
   const userRoles = dbUser.user_roles
   const userRolesString = []
   for (const userRole of userRoles) {
      userRolesString.push((await prisma.role.findUnique({ where: { id: userRole.role_id } })).name)
   }
   const embed = new EmbedBuilder()
      .setTitle('User Status')
      .setDescription(`User <@${dbUser.id_discord_account}>  created at ${dbUser.created_at.toLocaleDateString()} ${dbUser.created_at.toLocaleTimeString()}`)
      .addFields(
         {
            name: 'Last update',
            value: `${dbUser.updated_at.toLocaleDateString()} ${dbUser.updated_at.toLocaleTimeString()}`,
            inline: true
         },
         {
            name: 'Roles',
            value: `**${userRolesString.length > 0 ? userRolesString.join(', ') : 'No roles'}**`,
            inline: true
         }

      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   interaction.reply({ embeds: [embed] });

};