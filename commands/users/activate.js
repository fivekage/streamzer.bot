
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const generator = require('generate-password');

module.exports.help = {
   name: 'activate',
   description: 'Activate an user account',
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
      try {
         jellyfinUser = await jellyfinAPIService.registerUser(dbUser.username, dbUser.password)
      } catch (error) {
         return interaction.reply({
            content: `Error creating account on Jellyfin for user ${user.username}`,
            ephemeral: true,
         });
      }

   // Set the role viewer to the user
   if (dbUser.id_jellyfin_account) {
      return interaction.reply({
         content: `User already exists on jellyfin ${user.username}`,
         ephemeral: true,
      });
   }

   const roleValue = config.ROLES.find(r => r.name === 'Viewer').value
   // Set Viewer role in db
   const dbRole = (await prisma.role.findFirst({
      where:
      {
         name: roleValue
      }
   }))
   await prisma.user.update({
      where: { id: dbUser.id },
      data: { id_jellyfin_account: jellyfinUser.Id, role_id: dbRole.id }
   })


   // Send MP to user with his credentials
   const passwordGenerated = generator.generate({
      length: 10,
      numbers: true
   });
   const mpUser = new EmbedBuilder()
      .setAuthor({ name: `<@${dbUser.id_discord_account}>` })
      .setDescription(`Your account has been activated, here is your authentication logs. You are free to keep it, or change it.`)
      .addFields(
         {
            name: 'Username',
            value: dbUser.username,
            inline: true
         },
         {
            name: 'Password',
            value: `**${passwordGenerated}**`,
            inline: true
         }
      )
      .setColor(vars.primaryColor)
      .setTimestamp()

   user.send({ embeds: [embed] })

   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: `<@${dbUser.id_discord_account}>` })
      .setDescription(`Your account has been activated, a MP will be sent to give him his credentials`)
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