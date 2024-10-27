
const { DiscordAPIService } = require('../../services/discord.service.js')
const { StreamzerBotService } = require('../../services/streamzerbot.service.js')

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger.js');
const config = require('../../config.js');
const { prisma } = require('../../client.js');

const discordService = new DiscordAPIService()
const streamzerBotService = new StreamzerBotService()

const timeLog = (_req, _res, next) => {
   logger.info(`New request on auth-callback at: ${new Date().toUTCString()}`);
   next()
};
router.use(timeLog);

router.get('/', async (req, res) => {
   const code = req.query.code;
   if (!code) {
      logger.warn('No code provided in the request.')
      return res.status(400).json({
         "status": "error",
         "message": "You must provide a code."
      })
   }

   try {
      const token = await discordService.getToken(code)
      logger.info(`Token received from Discord API : ${token}`)
      const discordUser = await discordService.getUserInfos(token)
      logger.info(`User infos received from Discord API : ${discordUser.username} - ${discordUser.email} - ${discordUser.id}`)

      // Check if the user is already registered in our database
      // If yes, authenticate the user
      const dbUser = await prisma.user.findUnique({
         where: {
            id_discord_account: discordUser.id
         },
      })
      if (!dbUser) {
         logger.info(`Post new user to StreamzerBot: ${discordUser.username} - ${discordUser.email} - ${discordUser.id}`)
         const response = await streamzerBotService.notifyNewUser({
            username: discordUser.username,
            email: discordUser.email,
            discordId: discordUser.id
         })
         if (response.status == 204) {
            await prisma.user.create({
               data: {
                  username: discordUser.username,
                  email: discordUser.email,
                  id_discord_account: discordUser.id
               }
            })
            logger.info(`New user registered: ${discordUser.username}`)
            return res.status(201).json({
               "status": "pending",
               "message": "Your registration has been successfully received. You will receive a direct message on discord once your access has been granted."
                  + `\n You must join our discord server before we can accept your account : ${config.STREAMZER_DISCORD_LINK}`
            })
         }
         const err = new Error(`${response.status} - ${response.statusText} : An error occurred while transfering your informations to Discord Webhook StreamzerBot.`)
         err.status = response.status
         throw err

      }
      else {
         if (!dbUser.role_id)
            return res.status(200).json({
               "status": "pending",
               "message": "Your account already exists. You will receive a direct message on discord once your access has been granted."
            })

         const roleValue = config.ROLES.find(r => r.name === 'Disabled').value
         const disabledRole = (await prisma.role.findFirst({
            where:
            {
               name: roleValue
            }
         }))

         if (dbUser.role_id == disabledRole.id)
            return res.status(403).json({ // Forbidden
               "status": "pending",
               "message": "Your account has been disabled. Contact the admin on the discord server."
            })

         // const tokenStreamzer = await jellyfinApiService.authenticateUser(dbUser.username, null)
         logger.info(`User allowed on Jellyfin API : ${dbUser.username} `)
         return res.redirect(`http://streamzer.fr`)
      }
   } catch (err) {
      logger.error(err)
      return res.status(500).json({
         "status": "error",
         "message": err.toString()
      })
   }
});

module.exports = router;