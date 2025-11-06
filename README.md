# joshthomas.dev

Personal site built with [Eleventy](https://www.11ty.dev/).

## Overview

Features include blog with Markdown support, RSS feed, Raindrop.io integration for bookmarks, and automatic GitHub projects showcase.

Built with:

- [Eleventy](https://www.11ty.dev/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Templating engine
- [Markdown-it](https://github.com/markdown-it/markdown-it) - Markdown parser
- [Bun](https://bun.sh/) - JavaScript runtime/package manager
- [TypeScript](https://www.typescriptlang.org/) - Type checking
- [Biome](https://biomejs.dev/) - Linting and formatting

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun run build

# Lint and format
bun run lint         # doesn't apply fixes
bun run format       # applies fixes if available
```

## Structure

```
src/
├── _components/      # Reusable components
├── _config/          # Collections and filters
├── _data/            # Global data (site info, Raindrop integration)
├── _includes/        # Template partials (cards, etc.)
├── _layouts/         # Base templates (base, default, post, til)
├── _plugins/         # Custom Eleventy plugins
├── _static/          # CSS processed by Tailwind
├── feeds/            # RSS feed templates
├── posts/            # Blog posts in Markdown
├── til/              # Today I Learned posts
└── _redirects        # Cloudflare Pages redirects

public/               # Static assets (fonts, images, JS) copied to dist root
```

## Environment

- `RAINDROPIO_API_KEY` - Required for bookmarks integration
- `GITHUB_TOKEN` - Optional. Increases API rate limit for projects page (5000 req/hr vs 60 req/hr)
