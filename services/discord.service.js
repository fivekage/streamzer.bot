require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

module.exports.DiscordAPIService = class {
   constructor() {
      this.API_URL = 'https://discord.com/api';
   }

   // Function to obtain the token
   async getToken(code) {
      const params = new URLSearchParams();
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', REDIRECT_URI);
      params.append('scope', 'identify');

      const response = await fetch(`${this.API_URL}/oauth2/token`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
         },
         body: params
      });

      if (!response.ok) {
         const err = new Error(`Get Token : HTTP error! status: ${response.status}`);
         err.status = response.status;
         throw err;
      }
      const data = await response.json();

      return data.access_token;
   }

   // Function to get the user info
   async getUserInfos(token) {
      const response = await fetch(`${this.API_URL}/users/@me`, {
         method: 'GET',
         headers: {
            'Authorization': `Bearer ${token}`
         }
      });

      if (!response.ok) {
         const err = new Error(`Get User Infos : HTTP error! status: ${response.status}`);
         err.status = response.status;
         throw err;
      }

      const data = await response.json();
      return data;
   }
}