import { DateTime } from "luxon";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import MarkdownItGitHubAlerts from 'markdown-it-github-alerts';
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.ignores.add("src/_assets/css/style.css");

  eleventyConfig.addPassthroughCopy({ "src/_assets/fonts": "fonts" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/images": "images" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/css": "css" })

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.setServerOptions({
    watch: [
      "dist/**/*.css",
    ]
  })

  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/blog/feed.xml",
    collection: {
      name: "posts",
      limit: 10,
    },
    metadata: {
      language: "en-us",
      title: "Josh Thomas",
      subtitle: "Latest entries posted to Josh Thomas's blog.",
      base: "https://joshthomas.dev/blog/",
      author: {
        name: "Josh Thomas",
      }
    }
  });
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(MarkdownItGitHubAlerts)
  });

  eleventyConfig.addCollection("posts", function (collection) {
    return [...collection.getFilteredByGlob('./src/posts/**/*.md')].reverse();
  });

  return {
    dir: {
      input: 'src',
      layouts: "_layouts",
      output: 'dist',
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
  };
};
