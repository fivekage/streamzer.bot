const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { commandCanBeProcessed } = require('./middleware_commands');

module.exports.handleInteraction = async (client, commands) => {
   client.on(Events.InteractionCreate, async (message) => {
      if (!message.isChatInputCommand()) return;

      if (commands.some((command) => command.name == message.commandName)) {
         try {
            const command = commands.find((command) => command.name == message.commandName);
            if (!command) await message.reply({ content: 'This command does not exist', ephemeral: true });

            if (!commandCanBeProcessed(message)) return;
            commands.find((command) => command.name == message.commandName).file.run(client, message);
         } catch (error) {
            logger.fatal(error);
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
         }
      }
   });
};