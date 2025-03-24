import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
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

export default function (eleventyConfig) {
  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  eleventyConfig
    .addPassthroughCopy("src/_redirects")
    .addPassthroughCopy({ "src/_static/fonts": "static/fonts" })
    .addPassthroughCopy({
      "node_modules/@zachleat/heading-anchors/heading-anchors.js": `static/js/heading-anchors.js`,
    });

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginAutoPreload);
  eleventyConfig.addPlugin(EleventyPluginFontAwesome);
  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    urlPath: "/static/img/",
    outputDir: "./dist/static/img/",
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

  eleventyConfig.addTransform("generate-color-swatches", function (content) {
    // Only run this transform on the design system page
    if (
      this.page.outputPath &&
      this.page.outputPath.endsWith("design-system/index.html")
    ) {
      // Path to the compiled CSS
      const cssPath = path.join(
        dirname(fileURLToPath(import.meta.url)),
        "dist/static/css/style.css",
      );

      if (!fs.existsSync(cssPath)) {
        console.warn(
          "Compiled CSS file not found for color swatch generation.",
        );
        return content;
      }

      // Extract color variables from CSS
      const cssContent = fs.readFileSync(cssPath, "utf8");
      const colorVars = {};

      // Find the theme layer section where CSS variables are defined
      const themeSectionMatch = cssContent.match(
        /@layer\s+theme\s*{[^{]*:root\s*,\s*:host\s*{([^}]+)}/,
      );

      if (!themeSectionMatch) {
        console.warn(
          "Could not find @layer theme { :root, :host { section in CSS for color variables.",
        );
        return content;
      }

      const themeSection = themeSectionMatch[1];

      // Extract all CSS variables that look like colors
      const regex = /--color-([^:]+):\s*([^;]+);/g;
      let match;

      while ((match = regex.exec(themeSection)) !== null) {
        const name = match[1];
        const value = match[2].trim();
        colorVars[name] = value;
      }

      // Group colors by their prefix (e.g., blue, red, gray)
      const colorGroups = {};

      for (const [name, value] of Object.entries(colorVars)) {
        // Extract the group name (everything before the first hyphen or the whole name if no hyphen)
        const groupMatch = name.match(/^([^-]+)(?:-|$)/);
        const groupName = groupMatch ? groupMatch[1] : "other";

        if (!colorGroups[groupName]) {
          colorGroups[groupName] = {};
        }

        colorGroups[groupName][name] = value;
      }

      // Find the marker positions
      const startMarker = "<!-- color-swatches-start -->";
      const endMarker = "<!-- color-swatches-end -->";

      const startIndex = content.indexOf(startMarker);
      const endIndex = content.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        console.warn("Color swatch markers not found in design system HTML.");
        return content;
      }

      // Generate the color swatches HTML
      let swatchesHtml = "";

      // Sort group names alphabetically
      const sortedGroupNames = Object.keys(colorGroups).sort();

      for (const groupName of sortedGroupNames) {
        const groupColors = colorGroups[groupName];
        const colorCount = Object.keys(groupColors).length;

        // Add a section header for each group
        swatchesHtml += `
        <h3 class="capitalize">${groupName} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${colorCount} colors)</span></h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-1">
      `;

        // Sort color names within each group
        // For numeric suffixes (like blue-100, blue-200), sort numerically
        const sortedColorNames = Object.keys(groupColors).sort((a, b) => {
          // Split names into segments (by hyphen)
          const aSegments = a.split("-");
          const bSegments = b.split("-");

          // Compare segment by segment
          const minSegments = Math.min(aSegments.length, bSegments.length);

          for (let i = 1; i < minSegments; i++) {
            // Start at 1 to skip the color family name
            const aSegment = aSegments[i];
            const bSegment = bSegments[i];

            // Check if both segments are numeric
            const aIsNumeric = /^\d+$/.test(aSegment);
            const bIsNumeric = /^\d+$/.test(bSegment);

            // If both are numeric, compare as numbers
            if (aIsNumeric && bIsNumeric) {
              const diff =
                Number.parseInt(aSegment) - Number.parseInt(bSegment);
              if (diff !== 0) return diff;
            }
            // If only one is numeric, non-numeric comes first
            else if (aIsNumeric && !bIsNumeric) {
              return 1;
            } else if (!aIsNumeric && bIsNumeric) {
              return -1;
            }
            // If neither is numeric, compare alphabetically
            else {
              const diff = aSegment.localeCompare(bSegment);
              if (diff !== 0) return diff;
            }
          }

          // If we get here and segments were different lengths, shorter comes first
          if (aSegments.length !== bSegments.length) {
            return aSegments.length - bSegments.length;
          }

          // If everything was equal, compare the full strings
          return a.localeCompare(b);
        });

        for (const name of sortedColorNames) {
          swatchesHtml += `
          <div class="color-swatch">
            <div class="size-16 rounded-md shadow-${name}-md" style="background-color: var(--color-${name})"></div>
            <div class="mt-2">
              <p class="font-mono text-sm truncate">${name.replace("tokyonight-", "")}</p>
            </div>
          </div>
        `;
        }

        swatchesHtml += `
        </div>
      `;
      }

      // Replace the content between markers
      const newContent =
        content.substring(0, startIndex + startMarker.length) +
        swatchesHtml +
        content.substring(endIndex);

      console.log(
        `Inserted ${Object.keys(colorVars).length} color swatches into design system, grouped into
${sortedGroupNames.length} categories.`,
      );
      return newContent;
    }

    return content;
  });

  eleventyConfig.addTransform("htmlmin", function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return htmlmin.minify(content, {
        collapseWhitespace: true,
        minifyCSS: true,
        removeComments: true,
        useShortDoctype: true,
      });
    }
    return content;
  });

  eleventyConfig.addTransform("trim-whitespace", (content) => content.trim());

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
