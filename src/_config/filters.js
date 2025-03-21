/**
 * Template filters for 11ty site
 * @module filters
 */

import { DateTime } from "luxon";
import md from "./markdown.js";

export default {
  /**
   * Format a date using Luxon
   * @param {Date} date - JavaScript Date object
   * @param {string} [format="dd LLLL yyyy"] - Luxon format string
   * @param {string} [zone="utc"] - Time zone
   * @returns {string} Formatted date string
   */
  dateToFormat: (date, format, zone) => {
    return DateTime.fromJSDate(date, { zone: zone || "utc" }).toFormat(
      format || "dd LLLL yyyy",
    );
  },

  /**
   * Format a date to HTML date string (YYYY-MM-DD)
   * @param {Date} date - JavaScript Date object
   * @returns {string} HTML date string
   */
  dateToHtmlString: (date) => {
    return DateTime.fromJSDate(date, { zone: "utc" }).toFormat("yyyy-LL-dd");
  },

  /**
   * Format a date to ISO format without offset or milliseconds
   * @param {Date} date - JavaScript Date object
   * @returns {string} ISO date string
   */
  dateToISO: (date) => {
    return DateTime.fromJSDate(date, { zone: "utc" }).toISO({
      includeOffset: false,
      suppressMilliseconds: true,
    });
  },

  /**
   * Check if a URL is the active URL or parent of the active URL
   * @param {string} pageUrl - The current page URL
   * @param {string} targetUrl - The URL to check against
   * @returns {boolean} True if the targetUrl is active
   */
  isActiveUrl: (pageUrl, targetUrl) => {
    // Ignore the home page
    if (targetUrl === "/") {
      return false;
    }

    if (pageUrl.startsWith(targetUrl)) {
      return true;
    }

    return false;
  },

  /**
   * Get the newest item from a collection based on date
   * @param {Array} collection - Collection of items with date properties
   * @param {*} [emptyFallback=null] - Fallback value if collection is empty
   * @returns {Object|null} The newest item in the collection or fallback value
   */
  getNewestCollectionItem: (collection, emptyFallback) => {
    if (!collection || !collection.length) {
      return emptyFallback || null;
    }

    return collection.reduce((newest, item) => {
      return !newest || item.date > newest.date ? item : newest;
    }, null);
  },

  /**
   * Render a string with our markdown-it config
   * @param string content - The string content to render
   * @returns string The rendered content
   */
  markdownify: (content) => md.renderInline(content),
};
