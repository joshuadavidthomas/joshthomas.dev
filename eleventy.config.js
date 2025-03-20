import EleventyPluginNavigation from "@11ty/eleventy-navigation";
import EleventyPluginRss from "@11ty/eleventy-plugin-rss";
import EleventyPluginSyntaxhighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import EleventyPluginFontAwesome from "@11ty/font-awesome";
import EleventyPluginAssetHash from "@vrugtehagel/eleventy-asset-hash";
import markdownIt from "markdown-it";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
import collections from "./src/_config/collections.js";
import filters from "./src/_config/filters.js";

export default function (eleventyConfig) {
  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  eleventyConfig.addPassthroughCopy(
    { "src/_assets": "assets" },
    {
      filter: (path) => {
        const ignoredExtensions = [".css", ".js"];
        return !ignoredExtensions.some((extension) => path.endsWith(extension));
      },
    },
  );
  eleventyConfig.addPassthroughCopy("src/_redirects");

  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("html");
  eleventyConfig.addBundle("js");

  eleventyConfig.addPlugin(EleventyPluginAssetHash, {
    algorithm: "SHA-256",
    include: ["**/*.html"],
    includeAssets: ["**/*.{css,js}"],
  });
  eleventyConfig.addPlugin(EleventyPluginFontAwesome);
  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);

  eleventyConfig.setLibrary(
    "md",
    markdownIt({
      html: true,
      breaks: true,
      linkify: true,
    })
      .use(MarkdownItGitHubAlerts)
      .use((md) => {
        md.core.ruler.push("shift_headings", (state) => {
          // Only run on Markdown files within src/posts
          if (
            state.env?.page?.inputPath &&
            state.env.page.inputPath.includes("/src/posts/")
          ) {
            // Shift h2 -> h3
            state.tokens.forEach((token, i) => {
              if (token.type === "heading_open" && token.tag === "h2") {
                token.tag = "h3";
                const closing = state.tokens[i + 1];
                if (closing && closing.type === "heading_close") {
                  closing.tag = "h3";
                }
              }
            });
          }
        });
      }),
  );

  for (const collectionName of Object.keys(collections)) {
    eleventyConfig.addCollection(collectionName, collections[collectionName]);
  }

  for (const filterName of Object.keys(filters)) {
    eleventyConfig.addFilter(filterName, filters[filterName]);
  }

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
