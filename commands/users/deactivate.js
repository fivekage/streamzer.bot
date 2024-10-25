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

module.exports.run = async (_client, interaction) => {
   const user = interaction.options.getUser('user');
   if (!user) {
      return interaction.reply({
         content: 'You must specify a username to set',
         ephemeral: true,
      });
   }

   logger.info(`Disable account for ${user.username} asked by ${interaction.user.username}`);

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

   // Disable account on JellyFin
   const jellyfinAPIService = new JellyfinAPIService()
   const response = await jellyfinAPIService.setAccountActive(dbUser.username, false)
   if (response)
      logger.info(`User ${dbUser.username} disabled on Jellyfin`)

   // Remove the role
   const roleValue = config.ROLES.find(r => r.name === 'Disabled').value
   // Set Viewer role in db
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

   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: `<@${dbUser.id_discord_account}>` })
      .setDescription(`Account disabled ${user.username}`)
      .setColor(vars.primaryColor)
      .setTimestamp()

   // Send response
   interaction.reply({ embeds: [embed] });
   logger.info(`Account disable for ${user.username} asked by ${interaction.user.username}`);

};