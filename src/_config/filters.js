/**
 * Template filters for 11ty site
 * @module filters
 */

import { DateTime } from "luxon";

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
   * Remove "public/" prefix from a URL
   * @param {string} url - URL potentially containing a public prefix
   * @returns {string} URL with public prefix removed
   */
  stripPublicPrefix: (url) => {
    return url.replace(/^(\/?)public\//, "$1");
  },
};
