
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
      },
      {
         name: 'value',
         description: 'Set as admin or not',
         type: ApplicationCommandOptionType.Boolean,
         required: true,
      }
   ],
};

module.exports.run = async (_client, message) => {
   const user = message.options.getUser('user');
   const setAdminValue = message.options.getBoolean('value');

   // Check if the user run command from 5KAGE server
   if (!message.inGuild()) { // The bot is present in only one server -> No need to check if it's the right server
      return message.reply({
         content: 'You can only run this command from 5KAGE server',
         ephemeral: true,
      });
   }

   logger.info(`SetAdmin -> ${setAdminValue} for ${user.username} asked by ${message.user.username}`);

   // Get the status
   const dbUser = await prisma.user.findUnique({
      where: {
         id_discord_account: user.id
      }
   })
   if (!dbUser) {
      return message.reply({
         content: `User **${user.username}** not found in 5KAGE Streamzer database`,
         ephemeral: true,
      });
   }

   const jellyfinAPIService = new JellyfinAPIService()
   const jellyfinUsers = await jellyfinAPIService.fetchUsers()
   let jellyfinUser = jellyfinUsers.find(u => u.Name === dbUser.username)
   if (!jellyfinUser)
      return message.reply({
         content: `User account not found for ${user.username}`,
         ephemeral: false,
      });


   // Add the role to the user on Jellyfin
   try {
      await jellyfinAPIService.setUserAsAdmin(dbUser.id_jellyfin_account, setAdminValue)
   } catch (ex) {
      logger.error(`Error setting ${dbUser.username} as admin ${ex}`)
      return message.reply({
         content: `Error seting admin for ${user.username} : ${ex}`,
         ephemeral: false,
      });
   }

   const roleValue = config.ROLES.find(r => r.name === (setAdminValue ? 'Admin' : 'Viewer')).value
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
      .setAuthor({ name: dbUser.username })
      .setDescription(`<@${dbUser.id_discord_account}> is ${setAdminValue ? 'now' : 'not longer'} Administrator`)
      .addFields(
         {
            name: 'Role set',
            value: roleValue,
            inline: true
         }
      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   message.reply({ embeds: [embed] });

};