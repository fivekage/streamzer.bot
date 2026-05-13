const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const { userCanBeProcessed } = require('../../events/middleware_commands.js');

module.exports.help = {
   name: 'me',
   description: 'Affiche les informations de ton compte Streamzer',
};

module.exports.run = async (_client, message) => {
   if (!await userCanBeProcessed(message, vars.validRole)) {
      return false;
   }

   const user = message.user;
   logger.info(`Information requested for ${user.username} (${user.id})`);

   const jellyfinAPIService = new JellyfinAPIService();

   let jellyfinUser = null;
   try {
      // 1. On récupère TOUS les users
      const allUsers = await jellyfinAPIService.fetchUsers();

      // 2. On cherche celui qui a l'ID Discord dans ses BlockedTags
      jellyfinUser = allUsers.find(u => u.Policy?.BlockedTags?.includes(user.id));
   } catch (error) {
      logger.warn(`Error fetching Jellyfin user for ${user.username}: ${error.message}`);
   }

   // --- Vérification de la liaison ---
   if (!jellyfinUser) {
      return await message.editReply({
         content: `❌ **Compte Introuvable.**\n` +
            `\t- Si tu as déjà un compte, utilise \`/sync_account\` pour le lier à ton ID Discord.\n` +
            `\t- Si tu n'as pas encore de compte, utilise \`/register\`.\n`,
         ephemeral: true,
      });
   }

   // 3. Construction de l'embed avec les infos essentielles
   const accountStatus = !jellyfinUser.Policy?.IsDisabled ? '🟢 Actif' : '🔴 Désactivé';
   const jellyfinUserImageUrl = `${vars.streamzerServerUrl}/Users/${jellyfinUser.Id}/Images/Primary?tag=${jellyfinUser.PrimaryImageTag}`;
   const embed = new EmbedBuilder()
      .setTitle('🎬 Ton Compte Streamzer')
      .setThumbnail(jellyfinUserImageUrl)
      .setDescription('Voici les détails de ton compte et ton statut actuel sur la plateforme.')
      .addFields(
         {
            name: '👤 Identité',
            value: `**Nom d'utilisateur:** \`${jellyfinUser.Name}\`\n**Liaison:** \`'✅ Lié via Discord ID'`,
            inline: false
         },
         {
            name: '📡 Accès',
            value: `**Statut:** ${accountStatus}\n**Admin:** \`${jellyfinUser.Policy.IsAdministrator ? 'Oui' : 'Non'}\``,
            inline: true
         },
         {
            name: '🆔 Identifiant Jellyfin',
            value: `\`${jellyfinUser.Id}\``,
            inline: false
         }
      )
      .setColor(vars.primaryColor || '#0099ff')
      .setImage('https://i.ibb.co/WndQBjC/logo-1.png')
      .setFooter({
         text: `Streamzer Client Manager • Demandé par ${user.username}`,
         iconURL: user.displayAvatarURL()
      })
      .setTimestamp();

   return await message.editReply({ embeds: [embed], ephemeral: false });
};