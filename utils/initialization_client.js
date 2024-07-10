const { Routes } = require('discord.js');
const logger = require('./logger.js');

module.exports.initializationClient = async (client, rest, discordToken, clientId, allCommands) => {
   try {
      logger.info('Started refreshing application (/) commands.');
      const commands = allCommands.map((command) => ({
         name: command.name,
         description: command.description,
         options: command.options,
         choices: command.choices,

      }));
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      logger.info('Successfully reloaded application (/) commands.');
   } catch (error) {
      logger.fatal(error);
   }
   client.on('ready', () => {
      logger.info(`Logged in as ${client.user.tag}!`);
      client.user.setActivity('Watching some movie 🐼', { type: 'PLAYING' });
   });

   client.login(discordToken);
};