const { Client, REST, GatewayIntentBits } = require('discord.js');
const logger = require('./utils/logger.js');
require('dotenv').config();
const { initializationClient } = require('./utils/initialization_client.js');
const { loadAllCommands } = require('./utils/load_commands.js');
const { handleInteraction } = require('./events/handle_interactions.js');
const { DISCORD_TOKEN } = process.env;
const { CLIENT_ID } = process.env;

// Check if the token and client id are provided
if (!DISCORD_TOKEN || !CLIENT_ID) {
   logger.error('Please provide a valid token and client id');
   process.exit(1);
}

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessageReactions
   ]
});

// Load all commands
const commands = loadAllCommands();
// Initialize client
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
initializationClient(client, rest, DISCORD_TOKEN, CLIENT_ID, commands).catch(logger.error).then(() => {
   // Handle interactions
   handleInteraction(client, commands).catch(logger.error);
});

process.on('exit', (code) => {
   log4js.shutdown(() => {
      process.exit(code);
   });
});

process.on('SIGINT', () => {
   process.exit();
});