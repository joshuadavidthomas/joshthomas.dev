import { DateTime } from "luxon";
import EleventyPluginNavigation from "@11ty/eleventy-navigation";
import EleventyPluginRss from "@11ty/eleventy-plugin-rss";
import EleventyPluginSyntaxhighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import EleventyPluginVite from "@11ty/eleventy-plugin-vite";
import MarkdownItGitHubAlerts from 'markdown-it-github-alerts';
import markdownIt from "markdown-it";
import tailwindcss from '@tailwindcss/vite'

/** @type {import('vite').UserConfig} */
const viteOptions = {
  appType: "custom",
  assetsInclude: ["**/*.xml", "**/*.txt"],
  build: {
    mode: "production",
    sourcemap: "true",
    manifest: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/css/main.[hash].css",
        chunkFileNames: "assets/js/[name].[hash].js",
        entryFileNames: "assets/js/[name].[hash].js",
      },
      plugins: [],
    },
  },
  clearScreen: false,
  plugins: [
    tailwindcss(),
  ],
  publicDir: "public",
  server: { middlewareMode: true },
};

export default function (eleventyConfig) {
  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  eleventyConfig.addPassthroughCopy({ "src/_assets/fonts": "fonts" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/images": "images" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/css": "css" })

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss, {
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
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
  eleventyConfig.addPlugin(EleventyPluginVite, {
    tempFolderName: "_tmp",
    viteOptions,
  });

  eleventyConfig.setLibrary(
    "md",
    markdownIt({
      html: true,
      breaks: true,
      linkify: true
    }).use(MarkdownItGitHubAlerts),
  );

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
    passthroughFileCopy: true,
    templateFormats: ["html", "njk", "md"],
  };
};
