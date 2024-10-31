const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');

module.exports.help = {
   name: 'deactivate',
   description: 'Disable an account and remove access to Streamzer',
   options: [
      {
         name: 'user',
         description: 'The user target',
         type: ApplicationCommandOptionType.User,
         required: true,
      },
   ],
};

module.exports.run = async (_client, message) => {
   const user = message.options.getUser('user');

   logger.info(`Disable account for ${user.username} asked by ${message.user.username}`);

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

   // Disable account on JellyFin
   const jellyfinAPIService = new JellyfinAPIService()
   const ok = await jellyfinAPIService.setAccountActive(dbUser.id_jellyfin_account, false)
   if (ok) {
      logger.info(`User ${dbUser.username} disabled on Jellyfin`)

      // Remove the role
      const roleValue = config.ROLES.find(r => r.name === 'Disabled').value
      // Set Disabled role in db
      const dbRole = (await prisma.role.findFirst({
         where:
         {
            name: roleValue
         }
      }))
      await prisma.user.update({
         where: { id: dbUser.id },
         data: { role_id: dbRole.id }
      })
   } else {
      logger.error(`User ${dbUser.username} cannot be disabled on Jellyfin : ${JSON.stringify(response.errors)}`)
      return message.reply({
         content: `User **${user.username}** cannot be disabled on Jellyfin : ${JSON.stringify(response.errors)}`,
         ephemeral: true,
      })
   }

   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: dbUser.username })
      .setDescription(`Account disabled <@${dbUser.id_discord_account}>`)
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   message.reply({ embeds: [embed] });
   logger.info(`Account disable for ${user.username} asked by ${message.user.username}`);

};