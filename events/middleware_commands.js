const logger = require("../utils/logger");
const { GUILD_ID } = process.env;
/**
 * Middleware to check if the command can be processed
 * @param {*} message 
 * @returns 
 */
module.exports.commandCanBeProcessed = async (message) => {
   // Defer the reply
   const showPublicly = message.options.getBoolean('public') || true;
   await message.deferReply({ ephemeral: !showPublicly });

   // Check if the user run command from Streamzer server
   if (!message.inGuild() || message.guild.id !== GUILD_ID) { // The bot must be present in only one server -> check the guild id
      await message.editReply({
         content: 'You can only run this command from Streamzer Discord server',
         ephemeral: true,
      });
      return false
   }

   return true
}
/**
 * Middleware to check if the user has the valid role to use commands
 * @param {*} message 
 * @param {string} role 
 * @returns 
 */
module.exports.userCanBeProcessed = async (message, role) => {
   // Check if the user has the valid role to use commands
   logger.debug(`Checking if user ${message.user.username} has the role "${role}" to use the command...`);
   if (message.member.roles.cache.some(r => r.name == role)) {
      logger.debug(`User ${message.user.username} has the role "${role}". Command can be processed.`);
      return true
   }
   return false
}