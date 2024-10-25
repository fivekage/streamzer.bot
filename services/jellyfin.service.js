const API_KEY_JELLYFIN = process.env.API_KEY_JELLYFIN


module.exports.JellyfinAPIService = class JellyfinAPIService {
   constructor() {
      if (!API_KEY_JELLYFIN)
         throw new Error('API_KEY_JELLYFIN is not defined');
      this.API_URL = 'http://streamzer.fr';
      this.API_QUERY = `?api_key=${API_KEY_JELLYFIN}`
   }

   /**
    * Function to authenticate a user on jellyfin
    * @param {string} username 
    * @returns response data
    */
   async authenticateUser(username) {
      const response = await fetch(`${this.API_URL}/Users/AuthenticateByName${this.API_QUERY}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            Username: username,
         })
      });

      const data = await response.json();
      return data;
   }

   /**
    * Function to fetch all users on jellyfin
    * @returns response data
    */
   async fetchUsers() {
      const response = await fetch(`${this.API_URL}/Users${this.API_QUERY}`, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });

      const data = await response.json();
      return data;
   }

   /**
    * Function to register a user on jellyfin
    * @param {string} username
    * @returns response data
    */
   async registerUser(username, pwd) {
      const response = await fetch(`${this.API_URL}/Users/New${this.API_QUERY}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            Name: username,
            Password: pwd
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
   }

   /**
    *  Function to set a user as admin on jelly
    * @param {*} userId 
    * @param {*} isAdmin 
    * @returns 
    */
   async setUserAsAdmin(userId, isAdmin) {
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy${this.API_QUERY}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            IsAdministrator: isAdmin,
         })
      });

      const data = await response.json();
      return data;
   }

   /**
    *  Function to set a user as active on jelly
    * @param {*} userId 
    * @param {*} enable 
    * @returns 
    */
   async setAccountActive(userId, enable) {
      const response = await fetch(`${this.API_URL}/Users/${userId}/Policy${this.API_QUERY}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            IsDisabled: enable,
         })
      });

      const data = await response.json();
      return data;
   }
}