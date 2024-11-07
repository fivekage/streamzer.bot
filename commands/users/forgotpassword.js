
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');

module.exports.help = {
   name: 'forgotpassword',
   description: 'Initiale password reset process for a username',
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

   logger.info(`Initiate password reset for ${user.username} asked by ${message.user.username}`);

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
   let response = null
   try {
      response = await jellyfinAPIService.initiateForgotPasswordProcess(dbUser.username)
   } catch (error) {
      return message.reply({
         content: error.toString(),
         ephemeral: true,
      });
   }


   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: dbUser.username })
      .setDescription(`Forgot Password Process initiated for <@${dbUser.id_discord_account}> `)
      .addFields(
         {
            name: 'PIN Expiration Date',
            value: JSON.stringify(response),
            inline: true
         }
      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   message.reply({ embeds: [embed] });

};