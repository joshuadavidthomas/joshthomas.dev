import Fetch from "@11ty/eleventy-fetch";

const DEFAULT_COLLECTION = 0;
const ITEMS_TO_FETCH = 6;

export default async function () {
  let url = `https://api.raindrop.io/rest/v1/raindrops/${DEFAULT_COLLECTION}?perpage=${ITEMS_TO_FETCH}`;

  let json = await Fetch(url, {
    duration: "1d",
    fetchOptions: {
      headers: {
        "Authorization": `Bearer ${process.env.RAINDROPIO_API_KEY}`,
      },
    },
    type: "json",
  });

  return json.items;
};
