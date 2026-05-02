const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const { userCanBeProcessed } = require('../../events/middleware_commands.js');

module.exports.help = {
   name: 'sync_account',
   description: 'Lier votre compte Discord à un compte Streamzer existant',
   options: [
      {
         name: 'username',
         description: 'The name of the account to sync on https://streamzer.fr',
         type: ApplicationCommandOptionType.String,
      },
   ],
};

module.exports.run = async (_client, message) => {

   if (!await userCanBeProcessed(message, vars.validRole)) {
      return false;
   }
   const user = message.user;
   const accountName = message.options.getString('username');
   const jellyfinAPIService = new JellyfinAPIService();

   logger.info(`Sync account for ${user.username} with current account name "${accountName}"`);

   // 1. Récupérer tous les utilisateurs pour vérifier les liaisons existantes
   const allUsers = await jellyfinAPIService.fetchUsers();

   // 2. Vérifier si l'ID Discord est déjà lié à UN compte
   const alreadyLinked = allUsers.find(u => u.Policy?.BlockedTags?.includes(user.id));
   if (alreadyLinked) {
      return await message.editReply({
         content: `Oups, ton compte Discord est déjà lié au compte Streamzer **${alreadyLinked.Name}**.`,
         ephemeral: true,
      });
   }

   // 3. Chercher le compte Jellyfin par le nom d'utilisateur fourni
   const targetUser = allUsers.find(u => u.Name.toLowerCase() === accountName.toLowerCase());
   if (!targetUser) {
      return await message.editReply({
         content: `Oups, aucun compte trouvé au nom de **${accountName}**. Vérifie l'orthographe !`,
         ephemeral: true,
      });
   }

   // 4. Mettre à jour les BlockedTags pour inclure l'ID Discord
   try {
      const currentPolicy = targetUser.Policy;
      const updatedTags = currentPolicy.BlockedTags || [];

      if (!updatedTags.includes(user.id)) {
         updatedTags.push(user.id);
      }

      const success = await jellyfinAPIService.linkDiscordAccount(targetUser.Id, user.id, targetUser.Policy);

      if (!success) throw new Error("Update failed");

      logger.info(`Successfully synced ${user.username} with Jellyfin account ${targetUser.Name}`);

      const successEmbed = new EmbedBuilder()
         .setTitle('✅ Liaison réussie !')
         .setDescription(`Ton compte Discord est maintenant lié à **${targetUser.Name}**.`)
         .setColor('#00ff00')
         .addFields({ name: 'ID Discord enregistré', value: `\`${user.id}\`` });

      return await message.editReply({ embeds: [successEmbed] });

   } catch (error) {
      logger.error(`Sync error for ${user.username}: ${error.message}`);
      return await message.editReply({
         content: `Erreur technique lors de la synchronisation.`,
         ephemeral: true,
      });
   }
};