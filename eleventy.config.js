import { DateTime } from "luxon";
import EleventyPluginNavigation from "@11ty/eleventy-navigation";
import EleventyPluginSyntaxhighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import EleventyPluginVite from "@11ty/eleventy-plugin-vite";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import MarkdownItGitHubAlerts from 'markdown-it-github-alerts';
import markdownIt from "markdown-it";
import tailwindcss from '@tailwindcss/vite'

import collections from "./src/_utils/collections.js";
import filters from "./src/_utils/filters.js";

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
  eleventyConfig.addPassthroughCopy({ "src/_assets/css": "css" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/fonts": "fonts" })
  eleventyConfig.addPassthroughCopy({ "src/_assets/images": "images" })

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginNavigation);
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

  Object.keys(collections).forEach((collectionName) => {
    eleventyConfig.addCollection(collectionName, collections[collectionName]);
  });

  Object.keys(filters).forEach((filterName) => {
    eleventyConfig.addFilter(filterName, filters[filterName]);
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
