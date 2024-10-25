
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');

module.exports.help = {
   name: 'setadmin',
   description: 'Set as admin an user account',
   options: [
      {
         name: 'user',
         description: 'The user target',
         type: ApplicationCommandOptionType.User,
         required: true,
      }
   ],
};

module.exports.run = async (_client, interaction) => {
   const user = interaction.options.getUser('user');
   if (!user) {
      return interaction.reply({
         content: 'You must specify a username to set',
         ephemeral: true,
      });
   }

   logger.info(`Activate for ${user.username} asked by ${interaction.user.username}`);

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

   // Create an account on JellyFin
   const jellyfinAPIService = new JellyfinAPIService()
   const jellyfinUsers = await jellyfinAPIService.fetchUsers()
   let jellyfinUser = jellyfinUsers.find(u => u.Name === dbUser.username)
   if (!jellyfinUser)
      return interaction.reply({
         content: `User account not found for ${user.username}`,
         ephemeral: false,
      });


   // Add the role to the user on Jellyfin
   try {
      await jellyfinAPIService.setUserAsAdmin(dbUser.id_jellyfin_account, true)
   } catch (ex) {
      logger.error(`Error setting ${dbUser.username} as admin ${ex}`)
      return interaction.reply({
         content: `User account not found for ${user.username}`,
         ephemeral: false,
      });
   }

   const roleValue = config.ROLES.find(r => r.name === 'Admin').value
   const dbRole = (await prisma.role.findFirst({
      where:
      {
         name: roleValue
      }
   }))
   // Set Viewer role in db
   await prisma.user.update({
      where: { id: dbUser.id },
      data: { role_id: dbRole.id }
   })


   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: `<@${dbUser.id_discord_account}>` })
      .setDescription(`is now Administrator`)
      .addFields(
         {
            name: 'Role added',
            value: roleValue,
            inline: true
         }
      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   interaction.reply({ embeds: [embed] });

};