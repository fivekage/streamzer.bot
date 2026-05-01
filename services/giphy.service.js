const logger = require("../utils/logger");

const API_KEY_GIPHY = process.env.API_KEY_GIPHY


module.exports.GiphyAPIService = class JellyfinAPIService {
   constructor() {
      if (!API_KEY_GIPHY)
         throw new Error('API_KEY_GIPHY is not defined');
      this.API_URL = 'https://api.giphy.com/v1/gifs';
   }

   /**
    * Function to fetch a random gif from giphy
    * @param {string} query
    * @returns response data
    * */
   async fetchRandomGif(tag) {
      const response = await fetch(`${this.API_URL}/random?api_key=${API_KEY_GIPHY}&tag=${tag}`, {
         method: 'GET',
      });
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
   }
}