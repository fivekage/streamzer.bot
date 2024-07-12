
const { EmbedBuilder, ChannelType } = require('discord.js');
require('dotenv').config();
const logger = require('../utils/logger.js');
const { STREAMZER_GUILD_ID } = process.env;
const config = require('../config.js');
const CHANNEL_NAME = config.CHANNEL_NAME;
const CATEGORY_MANAGEMENT_NAME = config.CATEGORY_MANAGEMENT_NAME;

module.exports = (client, app) => {

   // Express API
   app.post('/', async function (req, res) {
      logger.info(`New registration request received from ${req.ip}`)

      // Check header for verification API KEY
      if (req.headers['api-key'] !== process.env.API_KEY) {
         return res.status(401).send('Unauthorized')
      }

      // Handle the request
      const body = req.body
      const username = body.username
      if (!username) {
         return res.status(400).json({ message: 'Username is required' })
      }
      // Fetch Guild, Admin Role, Category and Channel
      const guild = client.guilds.cache.get(STREAMZER_GUILD_ID)
      if (!guild) {
         return res.status(400).json({ message: 'Streamzer Guild not found' })
      }
      let category = guild.channels.cache.find(channel => channel.type == ChannelType.GuildCategory && channel.name == CATEGORY_MANAGEMENT_NAME)
      if (!category) {
         return res.status(400).json({ message: 'Category not found' })
      }
      let channel = guild.channels.cache.find(channel => channel.name === CHANNEL_NAME);
      if (!channel) {
         return res.status(400).json({ message: 'Channel not found' })
      }

      // Send a message in the channel to inform that a new user has registered
      const embed = new EmbedBuilder()
         .setTitle('New User Registered')
         .setDescription(`User ${username} has registered`)
         .setColor(vars.primaryColor)
         .setTimestamp()

      channel.send({ embeds: [embed] })

      // Send response
      res.status(200).json({ message: `Message sent for ${username}` })
   })
}