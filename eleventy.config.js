import path from "node:path";
import fs from "node:fs";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import EleventyPluginNavigation from "@11ty/eleventy-navigation";
import EleventyPluginRss from "@11ty/eleventy-plugin-rss";
import EleventyPluginSyntaxhighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import EleventyPluginFontAwesome from "@11ty/font-awesome";
import EleventyPluginAssetHash from "@vrugtehagel/eleventy-asset-hash";
import htmlmin from "html-minifier-terser";
import collections from "./src/_config/collections.js";
import filters from "./src/_config/filters.js";
import markdownIt from "./src/_config/markdown.js";
import EleventyPluginAutoPreload from "./src/_plugins/autoPreloadPlugin.js";
import colorSwatchesPlugin from "./src/_plugins/colorSwatchesPlugin.js";

export default function (eleventyConfig) {
  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  eleventyConfig
    .addPassthroughCopy({ "public": "/" })
    .addPassthroughCopy({
      "node_modules/@zachleat/heading-anchors/heading-anchors.js": `static/js/heading-anchors.js`,
    })
    .addPassthroughCopy({
      "node_modules/devicon/devicon.min.css": `static/devicon/devicon.min.css`,
      "node_modules/devicon/fonts/devicon.ttf": `static/devicon/fonts/devicon.ttf`,
    });

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginAutoPreload);
  eleventyConfig.addPlugin(EleventyPluginFontAwesome);
  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
  eleventyConfig.addPlugin(colorSwatchesPlugin, {
    pagePath: "design-system/index.html",
  });
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    urlPath: "/static/img/",
    outputDir: ".cache/@11ty/img/",
    formats: ["svg", "avif", "jpeg"],
    svgShortCircuit: true,
  });

  // only use asset hashing if building in Cloudflare Pages
  if (process.env.CF_PAGES) {
    eleventyConfig.addPlugin(EleventyPluginAssetHash, {
      algorithm: "SHA-256",
      include: ["**/*.html"],
      includeAssets: ["**/*.{css,js}"],
    });
  }

  eleventyConfig.setLibrary("md", markdownIt);

  for (const collectionName of Object.keys(collections)) {
    eleventyConfig.addCollection(collectionName, collections[collectionName]);
  }

  for (const filterName of Object.keys(filters)) {
    eleventyConfig.addFilter(filterName, filters[filterName]);
  }

  eleventyConfig.addTransform("htmlmin", function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return htmlmin.minify(content, {
        collapseWhitespace: true,
        minifyCSS: true,
        removeComments: true,
        useShortDoctype: true,
        ignoreCustomComments: [/color-swatches/],
      });
    }
    return content;
  });

  eleventyConfig.addTransform("trim-whitespace", (content) => content.trim());

  eleventyConfig.on("eleventy.after", () => {
    const cacheDir = ".cache/@11ty/img/";
    const outputDir = path.join(eleventyConfig.directories.output, "/static/img/");
    
    if (fs.existsSync(cacheDir)) {
      fs.cpSync(cacheDir, outputDir, {
        recursive: true
      });
    }
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
