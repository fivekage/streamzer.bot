
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
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

module.exports.run = async (_client, interaction) => {
   const user = interaction.options.getUser('user');
   if (!user) {
      return interaction.reply({
         content: 'You must specify a user and value to set',
         ephemeral: true,
      });
   }

   logger.info(`Initiate password reset for ${user.username} asked by ${interaction.user.username}`);

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

   const jellyfinAPIService = new JellyfinAPIService()
   let response = null
   try {
      response = await jellyfinAPIService.initiateForgotPasswordProcess(dbUser.username)
   } catch (error) {
      return interaction.reply({
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
   interaction.reply({ embeds: [embed] });

};