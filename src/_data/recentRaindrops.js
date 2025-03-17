import Fetch from "@11ty/eleventy-fetch";

/**
 * @typedef {Object} Raindrop
 * @property {string} _id - Unique identifier
 * @property {string} title - Bookmark title
 * @property {string} excerpt - Excerpt from the bookmarked page
 * @property {string} link - URL of the bookmarked page
 * @property {string} cover - Cover image URL
 * @property {string[]} tags - Array of tags
 * @property {string} type - Type of the bookmark
 * @property {boolean} important - Whether the bookmark is marked as important
 * @property {string} created - Creation date in ISO format
 * @property {string} lastUpdate - Last update date in ISO format
 */

/**
 * Collection IDs in Raindrop.io
 * 0 represents "All bookmarks"
 * @constant {number}
 */
const DEFAULT_COLLECTION = 0;

/**
 * Number of Raindrop items to fetch
 * @constant {number}
 */
const ITEMS_TO_FETCH = 6;

/**
 * Fetches recent bookmarks from Raindrop.io API
 * @async
 * @returns {Promise<Raindrop[]>} Array of Raindrop items
 */
export default async function () {
  const url = `https://api.raindrop.io/rest/v1/raindrops/${DEFAULT_COLLECTION}?perpage=${ITEMS_TO_FETCH}`;

  const json = await Fetch(url, {
    duration: "1d",
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${process.env.RAINDROPIO_API_KEY}`,
      },
    },
    type: "json",
  });

  return json.items;
}
