
const { ChannelType, PermissionsBitField } = require('discord.js');
const logger = require('./logger.js');
require('dotenv').config();
const config = require('../config.js');

const STREAMZER_GUILD_ID = config.STREAMZER_GUILD_ID;
const CHANNEL_NAME = config.CHANNEL_NAME;
const CATEGORY_MANAGEMENT_NAME = config.CATEGORY_MANAGEMENT_NAME;
const ADMIN_ROLE_ID = config.ADMIN_ROLE_ID;
const WEBHOOK_NAME = config.WEBHOOK_NAME;

module.exports.setupChannels = async (client) => {

   // Fetch Guild
   const guild = client.guilds.cache.get(STREAMZER_GUILD_ID)
   if (!guild) {
      throw new Error(`Streamzer Guild not found with the provided ID <${STREAMZER_GUILD_ID}>`)
   }
   logger.debug(`Guild found with ID <${STREAMZER_GUILD_ID}>`)
   // Fetch Admin Role
   const adminRole = guild.roles.cache.find(role => role.id === ADMIN_ROLE_ID)
   if (!adminRole) {
      throw new Error(`Admin Role not found with the provided ID <${ADMIN_ROLE_ID}>`)
   }
   logger.debug(`Admin Role found with ID <${ADMIN_ROLE_ID}>`)
   // Fetch Category
   let category = guild.channels.cache.find(channel => channel.type == ChannelType.GuildCategory && channel.name == CATEGORY_MANAGEMENT_NAME)
   if (!category) {
      await guild.channels.create({
         name: CATEGORY_MANAGEMENT_NAME,
         type: ChannelType.GuildCategory,
         permissionOverwrites: [{
            id: adminRole,
            allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
         },
         {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
         }]
      })
      category = guild.channels.cache.find(channel => channel.type == ChannelType.GuildCategory && channel.name == CATEGORY_MANAGEMENT_NAME)
   }
   logger.debug(`Category created with name <${CATEGORY_MANAGEMENT_NAME}>`)
   // Fetch Channel      
   let channel = guild.channels.cache.find(channel => channel.name === CHANNEL_NAME);
   if (!channel) {
      await guild.channels.create({
         name: CHANNEL_NAME,
         reason: 'To manage new users registered',
         type: ChannelType.GuildText,
         parent: category.id
      });
   }
   logger.debug(`Channel created with name <${CHANNEL_NAME}>`)
   // Create Webhook
   const webhook = (await channel.fetchWebhooks(channel.id)).find(webhook => webhook.name === WEBHOOK_NAME)
   if (!webhook) {
      channel.createWebhook({
         name: WEBHOOK_NAME,
         avatar: client.user.displayAvatarURL(),
         reason: 'To send notifications of new users registered'
      })
         .then(wh => logger.info(`Created webhook ${wh.url}`))
         .catch((err) => logger.error(err));
   } else {
      logger.debug(`Webhook already exists with url <${webhook.url}>`)
   }
   return "Channels, Category and Webhook setup successfully"
}