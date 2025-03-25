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
  .use(MarkdownItGitHubAlerts)
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
