import markdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItAttrs from "markdown-it-attrs";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
import MarkdownItTableCaptions from "markdown-it-table-captions";

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
  .use((md) => {
    md.core.ruler.push("shift_headings", (state) => {
      if (
        state.env?.page?.inputPath &&
        state.env.page.inputPath.includes("/src/posts/")
      ) {
        for (let i = 0; i < state.tokens.length; i++) {
          const token = state.tokens[i];
          if (token.type === "heading_open" && token.tag.match(/^h[1-6]$/)) {
            // Get current heading level (the number after 'h')
            const currentLevel = Number.parseInt(token.tag.substring(1));
            // Calculate new level, capping at 6
            const newLevel = Math.min(currentLevel + 1, 6);
            // Set the new tag
            token.tag = `h${newLevel}`;

            // Find its matching heading_close token
            for (let j = i + 1; j < state.tokens.length; j++) {
              const nextToken = state.tokens[j];
              if (
                nextToken.type === "heading_close" &&
                nextToken.tag === `h${currentLevel}`
              ) {
                nextToken.tag = `h${newLevel}`;
                break;
              }
            }
          }
        }
      }
    });
  });
