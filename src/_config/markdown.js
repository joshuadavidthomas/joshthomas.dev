import markdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItAttrs from "markdown-it-attrs";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
import MarkdownItTableCaptions from "markdown-it-table-captions";
import MarkdownItShiftHeadings from "../_plugins/markdownIt/shiftHeadings.js";

export default markdownIt({
  html: true,
  breaks: true,
  linkify: true,
})
  .use(MarkdownItAnchor)
  .use(MarkdownItAttrs)
  .use(MarkdownItFootnote)
  .use(MarkdownItGitHubAlerts, {
    icons: {
      caution:
        '<i class="fa-solid fa-ban octicon" height="16" width="16" aria-hidden="true"></i>',
      documentation:
        '<i class="fa-solid fa-book octicon" height="16" width="16" aria-hidden="true"></i>',
      important:
        '<i class="fa-solid fa-star octicon" height="16" width="16" aria-hidden="true"></i>',
      note: '<i class="fa-solid fa-circle-info octicon" height="16" width="16" aria-hidden="true"></i>',
      tip: '<i class="fa-solid fa-lightbulb octicon" height="16" width="16" aria-hidden="true"></i>',
      "tl;dr":
        '<i class="fa-solid fa-stopwatch octicon" height="16" width="16" aria-hidden="true"></i>',
      warning:
        '<i class="fa-solid fa-triangle-exclamation octicon" height="16" width="16" aria-hidden="true"></i>',
    },
    markers: [
      "CAUTION",
      "DOCUMENTATION",
      "IMPORTANT",
      "NOTE",
      "TIP",
      "TL;DR",
      "WARNING",
    ],
  })
  .use(MarkdownItTableCaptions)
  .use((md) => {
    md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
      return '<div class="min-w-full overflow-x-auto"><table class="w-full">';
    };

    md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
      return "</table></div>";
    };
  })
  .use(MarkdownItShiftHeadings);
