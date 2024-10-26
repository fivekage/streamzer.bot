module.exports.StreamzerBotService = class {
   constructor() {
      this.API_URL = process.env.DISCORD_WEBHOOK_URL;
      this.PRIMARY_COLOR = '#f4661b';
   }

   /**
    *  Post a new user to StreamzerBot
    * @param {Object} data  The data to be posted to the API (User Infos)
    * @returns  The response from the API
    */
   async notifyNewUser(data) {
      const response = await fetch(`${this.API_URL}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            // the username to be displayed
            content:
               `A new user has registered : <@${data.discordId}>`,
         })
      });

      if (!response.ok) {
         const err = new Error(`Get Token : HTTP error! status: ${response.status}`);
         err.status = response.status;
         throw err;
      }

      return response;
   }
}