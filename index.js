const { REST, Routes, ActivityType, Client, GatewayIntentBits } = require('discord.js');
const logger = require('./utils/logger.js');
require('dotenv').config();
const { loadAllCommands } = require('./utils/load_commands.js');
const { handleInteraction } = require('./events/handle_interactions.js');
const { DISCORD_TOKEN } = process.env;
const { CLIENT_ID } = process.env;

// Check if the token and client id are provided
if (!DISCORD_TOKEN || !CLIENT_ID) {
   logger.error('Please provide a valid token and client id');
   process.exit(1);
}

// Initialize client
const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessages
   ]
});

// Load all commands
const commands = loadAllCommands();
// Initialize client
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Refresh commands
logger.info('Started refreshing application (/) commands.');

const commandsBody = commands.map((command) => ({
   name: command.name,
   description: command.description,
   options: command.options,
   choices: command.choices,
}));

rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsBody })
   .then(() => {
      logger.info('Successfully reloaded application (/) commands.')

      client.on('clientReady', () => {
         logger.info(`Logged in as ${client.user.tag}!`);
         client.user.setActivity('streamzer.fr', { type: ActivityType.Watching });
         handleInteraction(client, commands)
      });

      // Login to discord, then handle interactions
      client.login(DISCORD_TOKEN).catch((err) => logger.error(err));
   })
   .catch(error => {
      logger.fatal(error);
      process.exit(1);
   })