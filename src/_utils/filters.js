import { DateTime } from "luxon";

export default {
  dateToFormat: (date, format, zone) => {
    return DateTime.fromJSDate(date, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
  },

  dateToHtmlString: (date) => {
    return DateTime.fromJSDate(date, { zone: "utc" }).toFormat('yyyy-LL-dd');
  },

  dateToISO: (date) => {
    return DateTime.fromJSDate(date, { zone: "utc" }).toISO({
      includeOffset: false,
      suppressMilliseconds: true,
    });
  },
};
