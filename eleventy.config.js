import EleventyPluginNavigation from "@11ty/eleventy-navigation";
import EleventyPluginRss from "@11ty/eleventy-plugin-rss";
import EleventyPluginSyntaxhighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import EleventyPluginVite from "@11ty/eleventy-plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import markdownIt from "markdown-it";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
import collections from "./src/_config/collections.js";
import filters from "./src/_config/filters.js";

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
        assetFileNames: "assets/css/[name].[hash].css",
        chunkFileNames: "assets/js/[name].[hash].js",
        entryFileNames: "assets/js/[name].[hash].js",
      },
    },
  },
  plugins: [tailwindcss()],
  publicDir: "public",
  server: {
    mode: "development",
    middlewareMode: true,
  },
};

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("public");
  eleventyConfig.addPassthroughCopy({ "src/_assets/css": "assets/css" });

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
  eleventyConfig.addPlugin(EleventyPluginVite, { viteOptions });

  eleventyConfig.setLibrary(
    "md",
    markdownIt({
      html: true,
      breaks: true,
      linkify: true,
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
      input: "src",
      layouts: "_layouts",
      output: "dist",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
  };
}
