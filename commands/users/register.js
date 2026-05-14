
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { JellyfinAPIService } = require('../../services/jellyfin.service.js');
const { GiphyAPIService } = require('../../services/giphy.service.js');
const generator = require('generate-password');
const passwordHash = require('password-hash');
const { userCanBeProcessed } = require('../../events/middleware_commands.js');

module.exports.help = {
   name: 'register',
   description: 'Créer un compte sur la plateforme Streamzer',
};

module.exports.run = async (_client, message) => {

   if (!await userCanBeProcessed(message, vars.validRole)) {
      return await message.editReply({
         content: `⛔ Accès refusé : Vous devez posséder le rôle **${vars.validRole}** pour utiliser cette commande.`,
         ephemeral: true
      });
   }

   const user = message.user;
   const username = user.username;
   logger.info(`🆕 Creating account for ${username}`);

   const jellyfinAPIService = new JellyfinAPIService();

   // 2. Fetch existing users to avoid duplicates
   const jellyfinUsers = await jellyfinAPIService.fetchUsers();
   let jellyfinUser = jellyfinUsers?.find(u => u.Name.toLowerCase() === username.toLowerCase());

   // --- CASE A: User already exists ---
   if (jellyfinUser) {
      logger.warn(`User ${username} already exists on Jellyfin.`);
      return await message.editReply({
         content: `Oups, il semble que tu aies déjà un compte actif sur Streamzer.`,
         ephemeral: true,
      });
   }

   // --- CASE B: Create new account ---
   const passwordGenerated = generator.generate({ length: 10, numbers: true });
   // Fetch the discord profile picture and convert it to a buffer
   const giphyService = new GiphyAPIService();
   try {
      const gifObject = await giphyService.fetchRandomGif('brainrot');
      if (gifObject?.url) {
         imageUrl = gifObject.images?.downsized_medium?.url;
      } else {
         throw new Error('No GIF found.' + JSON.stringify(gifObject));
      }
   } catch (error) {
      logger.error(`Error fetching GIF from Giphy: ${error.message}`);
      imageUrl = user.displayAvatarURL({ format: 'png', size: 512 });
   } finally {
      logger.info(`Using image URL for ${username}: ${imageUrl}`);
   }

   const response = await fetch(imageUrl);
   const arrayBuffer = await response.arrayBuffer();
   // On crée la string Base64 ici
   const b64 = Buffer.from(arrayBuffer).toString('base64');

   try {
      jellyfinUser = await jellyfinAPIService.registerUser(username, passwordGenerated);
      await jellyfinAPIService.initializeAccount(jellyfinUser.Id);
      await jellyfinAPIService.linkDiscordAccount(jellyfinUser.Id, user.id, jellyfinUser.Policy);
      await jellyfinAPIService.setUserImage(jellyfinUser.Id, b64);
   } catch (error) {
      logger.debug(`Error details: ${error.stack}`);
      logger.error(`Error creating Jellyfin account for ${username}: ${error.message}`);
      logger.warn(`Rolling back account creation for ${username} if it was partially created.`);
      if (jellyfinUser && jellyfinUser.Id) {
         await jellyfinAPIService.deleteUser(jellyfinUser.Id);
      }
      return await message.editReply({
         content: `Oups, impossible de créer le compte Jellyfin pour **${username}**.`,
         ephemeral: true,
      });
   }

   // 3. Prepare the Welcome DM
   const changePasswordUrl = `${vars.streamzerServerUrl}/web/#/userprofile?userId=${jellyfinUser.Id}`; // URL pour changer le mot de passe
   const mpUser = new EmbedBuilder()
      .setTitle(`🍿 Bienvenue sur Streamzer !`)
      .setDescription(`Salut ! Ton compte est prêt. Utilise les identifiants ci-dessous pour te connecter sur la plateforme.`)
      .addFields(
         { name: '👤 Identifiant', value: `\`${username}\``, inline: true },
         { name: '🔑 Mot de passe', value: `\`${passwordGenerated}\``, inline: true }
      )
      .setColor(vars.primaryColor);

   const helpEmbed = new EmbedBuilder()
      .setDescription(`⚙️ **Sécurité :** Pour changer ton mot de passe, [clique ici pour accéder aux réglages](${changePasswordUrl}).`)
      .setColor('#2F3136'); // Gris sombre pour un look discret

   // 3. Optionnel : Un bouton "Ouvrir Streamzer" (Le top du top)
   const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setLabel('Accéder à Streamzer')
         .setURL(vars.streamzerServerUrl)
         .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
         .setLabel('Changer mon mot de passe')
         .setURL(changePasswordUrl)
         .setStyle(ButtonStyle.Link)
   );


   // 4. Try sending the DM. If it fails, delete the Jellyfin account to stay clean.
   try {
      await user.send({
         embeds: [mpUser, helpEmbed],
         components: [row]
      });
   } catch (dmError) {
      logger.error(`Failed to send DM to ${username}. Rolling back account creation.`);

      // Safety: Ensure jellyfinUser has an ID before trying to delete
      if (jellyfinUser && jellyfinUser.Id) {
         await jellyfinAPIService.deleteUser(jellyfinUser.Id);
      }

      return await message.editReply({
         content: `Oups, impossible de t'envoyer tes accès en MP. Vérifie tes paramètres de confidentialité et réessaie !`,
         ephemeral: true,
      });
   }

   // 5. Success response in the channel
   const embedResponse = new EmbedBuilder()
      .setAuthor({ name: username, iconURL: user.displayAvatarURL() })
      .setDescription(`✅ Le compte de **${username}** est maintenant actif !`)
      .addFields({ name: 'Statut', value: 'Prêt à streamer 🎬', inline: true })
      .setColor(vars.primaryColor)
      .setTimestamp();

   await message.editReply({ embeds: [embedResponse], ephemeral: false });
};