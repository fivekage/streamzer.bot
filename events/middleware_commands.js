module.exports.commandCanBeProcessed = (message) => {
   // Check if the user run command from Streamzer server
   if (!message.inGuild()) { // The bot is present in only one server -> No need to check if it's the right server
      message.reply({
         content: 'You can only run this command from Streamzer Discord server',
         ephemeral: true,
      });
      return false
   }

   if (!message.member.roles.cache.some(role => role.name === 'Admin')) { // The user is not an admin
      message.reply({
         content: 'You must be an admin to use this command',
         ephemeral: true,
      });
      return false
   }

   return true
}