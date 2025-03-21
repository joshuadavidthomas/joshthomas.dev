import markdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItAttrs from "markdown-it-attrs";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";

export default markdownIt({
  html: true,
  breaks: true,
  linkify: true,
})
  .use(MarkdownItAnchor)
  .use(MarkdownItAttrs)
  .use(MarkdownItGitHubAlerts)
  .use((md) => {
    md.core.ruler.push("shift_headings", (state) => {
      if (
        state.env?.page?.inputPath &&
        state.env.page.inputPath.includes("/src/posts/")
      ) {
        for (let i = 0; i < state.tokens.length; i++) {
          const token = state.tokens[i];
          if (token.type === "heading_open" && token.tag === "h2") {
            token.tag = "h3";
            // Find its matching heading_close token
            for (let j = i + 1; j < state.tokens.length; j++) {
              const nextToken = state.tokens[j];
              if (
                nextToken.type === "heading_close" &&
                nextToken.tag === "h2"
              ) {
                nextToken.tag = "h3";
                break;
              }
            }
          }
        }
      }
    });
  });
