
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { prisma } = require('../../client.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const generator = require('generate-password');
const passwordHash = require('password-hash');

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

module.exports.run = async (_client, message) => {
   const user = message.options.getUser('user');
   logger.info(`Activate for ${user.username} asked by ${message.user.username}`);

   // Get the status
   const dbUser = await prisma.user.findUnique({
      where: {
         id_discord_account: user.id
      }
   })
   if (!dbUser) {
      return await message.editReply({
         content: `User **${user.username}** not found in 5KAGE Streamzer database`,
         ephemeral: true,
      });
   }

   // Fetch Users Jellyfin
   const jellyfinAPIService = new JellyfinAPIService()
   const jellyfinUsers = await jellyfinAPIService.fetchUsers()
   let jellyfinUser = jellyfinUsers.find(u => u.Name === dbUser.username)

   // Fetch Viewer role
   const roleValue = config.ROLES.find(r => r.name === 'Viewer').value
   const dbRole = (await prisma.role.findFirst({
      where:
      {
         name: roleValue
      }
   }))

   // Add 'Valid' Role on Discord
   const discordRoleValid = (await message.guild.roles.fetch()).find(role => role.name === config.ROLE_VALID_NAME);
   if (!discordRoleValid) {
      return await message.editReply({
         content: `Role **${config.ROLE_VALID_NAME}** not found on Discord`,
         ephemeral: true,
      });
   }
   if (!(await message.guild.members.fetch(user.id)).roles.cache.has(discordRoleValid.id))
      message.guild.members.addRole({
         reason: "Account validated on Streamzer",
         role: discordRoleValid.id,
         user: message.guild.members.cache.get(user.id)
      })

   let passwordGenerated = null
   // If the user does not exist on Jellyfin
   if (!jellyfinUser) {
      // Generate Password
      passwordGenerated = generator.generate({
         length: 10,
         numbers: true,
         symbols: true
      });
      try {
         jellyfinUser = await jellyfinAPIService.registerUser(dbUser.username, passwordGenerated)
      } catch (error) {
         return await message.editReply({
            content: `Error creating account on Jellyfin for user ${user.username}`,
            ephemeral: true,
         });
      }
   }
   else { // If the user exists on Jellyfin
      const ok = await jellyfinAPIService.setAccountActive(jellyfinUser.Id, true)
      if (!ok) {
         return await message.editReply({
            content: `Error setting account on Jellyfin for user ${user.username}`,
            ephemeral: true,
         });
      }
      logger.info(`User ${dbUser.username} enabled on Jellyfin`)

      // Update the jellyfin user id in our database if there is no id_jellyfin_account
      await prisma.user.update({
         where: { id: dbUser.id },
         data: {
            id_jellyfin_account: jellyfinUser.Id,
            role_id: dbRole.id
         }
      })

      const embed = new EmbedBuilder()
         .setAuthor({ name: dbUser.username })
         .setDescription(`Account enabled <@${dbUser.id_discord_account}>`)
         .setColor(vars.primaryColor)
         .setTimestamp()
      return await message.editReply({
         embeds: [embed],
      });
   }

   // Update user in db
   await prisma.user.update({
      where: { id: dbUser.id },
      data: {
         id_jellyfin_account: jellyfinUser.Id,
         role_id: dbRole.id,
         password: passwordHash.generate(passwordGenerated)
      }
   })


   // Send MP to user with his credentials
   const mpUser = new EmbedBuilder()
      .setAuthor({ name: dbUser.username })
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

   user.send({ embeds: [mpUser] })

   // Build embed response
   const embed = new EmbedBuilder()
      .setAuthor({ name: dbUser.username })
      .setDescription(`<@${dbUser.id_discord_account}> account has been activated, a MP will be sent to give him his credentials`)
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
   await message.editReply({ embeds: [embed] });

};