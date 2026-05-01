const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');

module.exports.help = {
   name: 'list',
   description: 'Liste tous les utilisateurs Jellyfin',
   options: [
      {
         name: 'public',
         description: 'Afficher la liste publiquement ou non',
         type: ApplicationCommandOptionType.Boolean,
         required: false,
         defaultValue: false
      },
   ],
};

module.exports.run = async (_client, message) => {
   // --- Vérification Admin ---
   if (!message.member.roles.cache.some(role => role.name === vars.adminRole)) {
      return await message.editReply({
         content: '⛔ Accès refusé : Vous devez être administrateur.',
         ephemeral: true
      });
   }

   const showPublicly = message.options.getBoolean('public') || false;
   const jellyfinAPIService = new JellyfinAPIService();
   const allUsers = await jellyfinAPIService.fetchUsers();

   const pageSize = 10;
   let currentPage = 0;
   const totalPages = Math.ceil(allUsers.length / pageSize);

   // Fonction pour générer l'Embed d'une page spécifique
   const generateEmbed = (page) => {
      const start = page * pageSize;
      const end = start + pageSize;
      const currentUsers = allUsers.slice(start, end);

      const tableHeader = "Nom                | Admin | Statut\n-------------------|-------|---------\n";
      const usersList = currentUsers.map(u => {
         const name = u.Name.padEnd(18).substring(0, 18);
         const admin = u.Policy?.IsAdministrator ? "Oui" : "Non";
         const status = !u.Policy?.IsDisabled ? "ACTIF" : "OFF  ";
         return `${name} | ${admin.padEnd(5)} | ${status}`;
      }).join('\n');

      return new EmbedBuilder()
         .setTitle('📋 Répertoire des Utilisateurs Streamzer')
         .setDescription(`Total : **${allUsers.length}** utilisateurs\n\`\`\`sql\n${tableHeader}${usersList}\n\`\`\``)
         .setColor(vars.primaryColor)
         .setFooter({ text: `Page ${page + 1} sur ${totalPages}` })
         .setTimestamp();
   };

   // Fonction pour générer les boutons
   const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Précédent')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
         new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Suivant ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1)
      );
   };

   // Envoi initial
   const response = await message.editReply({
      embeds: [generateEmbed(0)],
      components: [generateButtons(0)],
      ephemeral: !showPublicly
   });

   // --- Collector pour gérer les clics sur les boutons ---
   const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 // Le collecteur s'arrête après 60s d'inactivité
   });

   collector.on('collect', async (interaction) => {
      // Seul l'auteur de la commande peut interagir avec les boutons
      if (interaction.user.id !== message.user.id) {
         return interaction.reply({
            content: "Vous ne pouvez pas contrôler cette liste.",
            ephemeral: true
         });
      }

      if (interaction.customId === 'prev') currentPage--;
      if (interaction.customId === 'next') currentPage++;

      await interaction.update({
         embeds: [generateEmbed(currentPage)],
         components: [generateButtons(currentPage)]
      });
   });

   collector.on('end', () => {
      // On grise les boutons quand le temps est écoulé
      const disabledRow = new ActionRowBuilder().addComponents(
         new ButtonBuilder().setCustomId('p').setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(true),
         new ButtonBuilder().setCustomId('n').setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      message.editReply({ components: [disabledRow] }).catch(() => { });
   });
};