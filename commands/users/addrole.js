
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../prisma.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

module.exports.help = {
   name: 'addrole',
   description: 'Add a role to a user',
   options: [
      {
         name: 'user',
         description: 'The user target',
         type: ApplicationCommandOptionType.User,
         required: true,
      },
      {
         name: 'role',
         description: 'The role you want to add',
         type: ApplicationCommandOptionType.String,
         required: true,
         choices: config.ROLES

      },
   ],
};

module.exports.run = async (_client, interaction) => {
   const user = interaction.options.getUser('user');
   const role = interaction.options.getString('role');
   if (!user || !role) {
      return interaction.reply({
         content: 'You must specify a username and a role to set',
         ephemeral: true,
      });
   }

   logger.info(`Add role ${role} for ${user.username} asked by ${interaction.user.username}`);

   // Get the status
   const dbUser = await prisma.user.findUnique({
      where: {
         id_discord_account: user.id
      }
   })
   if (!dbUser) {
      return interaction.reply({
         content: `User **${user.username}** not found in 5KAGE database`,
         ephemeral: true,
      });
   }

   // Get the role
   const dbRole = await prisma.role.findFirst({ where: { name: role } })
   if (!dbRole) {
      return interaction.reply({
         content: 'Role not found',
         ephemeral: true,
      });
   }

   // Add the role to the user
   let userRole = await prisma.user_roles.findFirst({ where: { user_id: dbUser.id, role_id: dbRole.id } })
   if (userRole)
      return interaction.reply({
         content: `Role ${role} already added to this user`,
         ephemeral: true,
      });

   const userRoleCreated = await prisma.user_roles.create({
      data: {
         user_id: dbUser.id,
         role_id: dbRole.id
      }
   })

   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: `<@${dbUser.id_discord_account}>` })
      .setDescription(`Your roles has been updated`)
      .addFields(
         {
            name: 'Role added',
            value: userRoleCreated ? role : 'No one',
            inline: true
         }
      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   interaction.reply({ embeds: [embed] });

};