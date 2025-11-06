/**
 * Collection definitions for 11ty site
 * @module collections
 */

/**
 * @typedef {Object} Collection
 * @property {Function} getFilteredByGlob - Function to filter collection items by glob pattern
 * @property {Function} getFilteredByTag - Function to filter collection items by tag
 */

/**
 * @typedef {Object} CollectionItem
 * @property {Object} data - Front matter data
 * @property {string} url - URL of the collection item
 * @property {Date} date - Date of the collection item
 * @property {string} fileSlug - Slug of the file
 * @property {string} outputPath - Output path of the file
 * @property {string} inputPath - Input path of the file
 * @property {string} templateContent - Rendered content
 */

export default {
  /**
   * Returns all blog posts
   * @param {Collection} collection - Eleventy collection object
   * @returns {CollectionItem[]} Array of post collection items
   */
  posts: (collection) => {
    return collection.getFilteredByGlob("./src/content/posts/**/*.md");
  },

  /**
   * Returns all TIL entries
   * @param {Collection} collection - Eleventy collection object
   * @returns {CollectionItem[]} Array of TIL collection items
   */
  til: (collection) => {
    return collection.getFilteredByGlob("./src/content/til/**/*.md");
  },

  /**
   * Returns all blog entries, including posts and tils, sorted by date
   * @param {Collection} collection - Eleventy collection object
   * @returns {CollectionItem[]} Array of post collection items
   */
  blog: (collection) => {
    const posts = collection.getFilteredByGlob("./src/content/posts/**/*.md");
    const tils = collection.getFilteredByGlob("./src/content/til/**/*.md");
    return [...posts, ...tils].sort((a, b) => {
      return a.date - b.date;
    });
  },
};
