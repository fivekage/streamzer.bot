const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const { GiphyAPIService } = require('../../services/giphy.service.js');
const { userCanBeProcessed } = require('../../events/middleware_commands.js');
const fs = require('fs');

module.exports.help = {
   name: 'random_pic',
   description: 'Définir un gif aléatoire très très très drôle comme image de profil sur Streamzer',
};

module.exports.run = async (_client, message) => {
   if (!await userCanBeProcessed(message, vars.validRole)) {
      return false;
   }

   const user = message.user;
   logger.info(`Random profile picture requested for ${user.username} (${user.id})`);

   const jellyfinAPIService = new JellyfinAPIService();
   let jellyfinUser = null;
   try {
      // 1. On récupère TOUS les users
      const allUsers = await jellyfinAPIService.fetchUsers();
      // 2. On cherche celui qui a l'ID Discord dans ses BlockedTags
      jellyfinUser = allUsers.find(u => u.Policy?.BlockedTags?.includes(user.id));
   }
   catch (error) {
      logger.warn(`Error fetching Jellyfin user for ${user.username}: ${error.message}`);
   }

   // --- Vérification de la liaison ---
   if (!jellyfinUser) {
      return await message.editReply({
         content: `❌ **Compte Introuvable.**\n` +
            `\t- Si tu as déjà un compte, utilise \`/sync_account\` pour le lier à ton ID Discord.\n` +
            `- Si tu n'as pas encore de compte, utilise \`/register\`.\n`,
         ephemeral: true,
      });
   }

   const giphyService = new GiphyAPIService();
   const gifObject = await giphyService.fetchRandomGif('brainrot');
   if (!gifObject) {
      return await message.editReply({
         content: `Oups, impossible de récupérer une image pour le moment. Essaie à nouveau plus tard !`,
         ephemeral: true,
      });
   }
   const gifUrl = gifObject.images?.downsized_medium?.url;
   logger.info(`Fetched random GIF for ${user.username}: ${gifUrl}`);
   const response = await fetch(gifUrl);
   const arrayBuffer = await response.arrayBuffer();
   const b64 = Buffer.from(arrayBuffer).toString('base64');

   // --- Update Jellyfin Image Account ---
   try {
      await jellyfinAPIService.setUserImage(jellyfinUser.Id, b64);
   }
   catch (error) {
      logger.warn(`Error setting Jellyfin user image for ${jellyfinUser.Name}: ${error.message}`);
      return await message.editReply({
         content: `Oups, impossible de mettre à jour ton image de profil pour le moment. Essaie à nouveau plus tard !`,
         ephemeral: true,
      });
   }

   const embed = new EmbedBuilder()
      .setTitle(`Profil de ${jellyfinUser.Name} mis à jour !`)
      .setThumbnail(gifObject.images.downsized_medium.url)
      .setDescription(`Constatez par vous-même en allant sur votre [profil Streamzer](${vars.streamzerServerUrl}/web/#/userprofile?userId=${jellyfinUser.Id}) !`)
      .setColor(vars.primaryColor)
      .setFooter({ text: `Source: Giphy` })
      .setTimestamp();

   return await message.editReply({ embeds: [embed] });
}