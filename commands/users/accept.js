
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { ApplicationCommandOptionType, } = require('discord.js');
module.exports.help = {
   name: 'accept',
   description: 'Accept an user from the waiting list',
   options: [
      {
         name: 'username',
         description: 'The username of the user you want to accept',
         type: ApplicationCommandOptionType.User,
         required: true,
      }
   ],
};

module.exports.run = async (_client, interaction) => {
   const queryUsername = interaction.options.getString('username');
   const username = queryUsername.charAt(0).toUpperCase() + queryUsername.slice(1).toLowerCase();

   if (!username) {
      return interaction.reply({
         content: 'You must specify a username to accept',
         ephemeral: true,
      });
   }

   // Get the waiting list

};