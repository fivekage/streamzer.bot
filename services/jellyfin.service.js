const logger = require("../utils/logger");

const API_KEY_JELLYFIN = process.env.API_KEY_JELLYFIN


module.exports.JellyfinAPIService = class JellyfinAPIService {
   constructor() {
      if (!API_KEY_JELLYFIN)
         throw new Error('API_KEY_JELLYFIN is not defined');
      this.API_URL = 'http://streamzer.fr';
      this.API_KEY_HEADER = { 'X-Emby-Token': API_KEY_JELLYFIN };
      this.DEFAULT_PROVIDERS_CONFIG = {
         "AuthenticationProviderId": "Jellyfin.Server.Implementations.Users.DefaultAuthenticationProvider",
         "PasswordResetProviderId": "Jellyfin.Server.Implementations.Users.Default"

      }
   }

   /**
    * Function to fetch all users on jellyfin
    * @returns response data
    */
   async fetchUsers() {
      const response = await fetch(`${this.API_URL}/Users`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
      });
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
   }

   /**
    * Function to fetch a specific user on jellyfin
    * @param {string} userId
    * @returns response data
    */
   async fetchUser(userId) {
      const response = await fetch(`${this.API_URL}/Users/${userId}`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
      });
      if (!response.ok) {
         if (response.status === 404) {
            return null; // User not found, return null
         }
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
   }

   /**
    * Function to register a user on jellyfin
    * @param {string} username
    * @param {string} pwd
    * @returns response data
    */
   async registerUser(username, pwd) {
      const response = await fetch(`${this.API_URL}/Users/New`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify({
            Name: username,
            Password: pwd,
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
   }

   /**
    * Function to set user image on jellyfin
    * @param {string} userId
    * @param {string} base64Data
    */
   async setUserImage(userId, base64Data) {
      const params = new URLSearchParams();
      params.append("userId", userId);
      params.append("type", "Primary");
      const response = await fetch(`${this.API_URL}/UserImage?${params}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'image/png',
            ...this.API_KEY_HEADER
         },
         body: base64Data,
      });

      if (!response.ok) {
         const text = await response.text(); // Pour voir l'erreur réelle du serveur
         logger.error(`Jellyfin Error (${response.status}): ${text}`);
         throw new Error(`HTTP Set User Image error! status: ${response.status} : ${response.statusText}`);
      }
      return response.ok;
   }

   /**
    * Function to delete a user on jellyfin
    * @param {string} userId
    * @returns boolean 
    */
   async deleteUser(userId) {
      const response = await fetch(`${this.API_URL}/Users/${userId}`, {
         method: 'DELETE',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         }
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
   }

   /**
    * Function to update user details on jellyfin
    * @param {string} userId  
    * @param {object} body
    * @returns boolean
    */
   async initializeAccount(userId) {
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify({
            "EnableAllFolders": true,
            "EnableAllRemoteAccessLocations": true,
            "IsAdministrator": false,
            "IsHidden": false,
            "IsDisabled": false,
            ...this.DEFAULT_PROVIDERS_CONFIG
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
   }

   /**
    * Function to link a discord account to a jellyfin account by setting the discord ID in AllowedTags
    * @param {string} userId
    * @param {string} discordId
    * @returns boolean
    * */
   async linkDiscordAccount(userId, discordId, currentPolicy = {}) {
      currentPolicy.AllowedTags = currentPolicy.AllowedTags || [];
      if (!currentPolicy.AllowedTags.includes(discordId)) {
         currentPolicy.AllowedTags.push(discordId);
      }
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify(currentPolicy)
      });
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
   }

   /**
    *  Function to set a user as admin on jelly
    * @param {string} userId 
    * @param {boolean} isAdmin 
    * @returns 
    */
   async setUserAsAdmin(userId, isAdmin) {
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify({
            IsAdministrator: isAdmin,
            Policy: {
               ...this.DEFAULT_PROVIDERS_CONFIG
            }
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP setUserAsAdmin error! status: ${response.status}`);
      }
      return response.ok;
   }

   /**
    *  Function to set a user as active on jelly
    * @param {string} userId 
    * @param {boolean} enable 
    * @returns 
    */
   async setAccountActive(userId, enable) {
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify({
            IsDisabled: !enable,
            Policy: {
               ...this.DEFAULT_PROVIDERS_CONFIG
            }
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP setAccountActive error! status: ${response.status}`);
      }
      return response.ok;
   }

   /**
    *  Function to initiate a password reset on jelly
    * @param {string} username 
    * @returns json response
    */
   async initiateForgotPasswordProcess(username) {
      const response = await fetch(`${this.API_URL}/Users/ForgotPassword`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            ...this.API_KEY_HEADER
         },
         body: JSON.stringify({
            EnteredUsername: username
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP initiateForgotPasswordProcess error! status: ${response.status}`);
      }
      return (await response.json());
   }
}