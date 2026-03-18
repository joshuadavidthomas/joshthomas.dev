# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (uses Bun)
bun install

# Start development server (runs both 11ty and Tailwind CSS in parallel)
bun dev

# Build for production
bun run build

# Clean build artifacts
bun run clean

# Linting and formatting
bun run lint         # Check for issues without applying fixes
bun run format       # Apply fixes automatically

# Type checking
bun run typecheck

# Individual dev servers (used by the runner script)
bun run dev:11ty      # Eleventy dev server
bun run dev:tailwind  # Tailwind CSS watcher
```

## Architecture Overview

This is an Eleventy static site generator project with the following structure:

### Core Technologies
- **Eleventy 3.0 (alpha)** - Static site generator
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Bun** - JavaScript runtime and package manager
- **Nunjucks** - Primary templating engine
- **TypeScript** - Type checking (for tooling files)
- **Biome** - Linting and formatting

### Key Configuration Files
- `eleventy.config.js` - Main Eleventy configuration
- `package.json` - Project dependencies and scripts
- `biome.json` - Code formatting rules (2 spaces, double quotes)
- `tsconfig.json` - TypeScript configuration

### Directory Structure
- `content/` - Markdown content files (outside src/ for clean separation)
  - `posts/` - Blog posts in Markdown format
  - `til/` - Today I Learned posts organized by category
- `src/` - Source files
  - `_components/` - Reusable Nunjucks components
  - `_config/` - Eleventy collections, filters, and markdown configuration
  - `_data/` - Global data files (site metadata, Raindrop.io integration)
  - `_includes/` - Template partials (cards, etc.)
  - `_layouts/` - Base page templates (base.njk, default.njk, post.njk, til.njk)
  - `_plugins/` - Custom Eleventy plugins
  - `_static/` - CSS files processed by Tailwind
  - `content/` - Symlink to `../content` (enables Eleventy processing)
  - `feeds/` - RSS feed templates
  - `posts.json` - Blog post configuration (layout, permalinks)
  - `til.json` - TIL configuration (layout, permalinks)
- `public/` - True static assets (fonts, images, JS) copied to root of dist

### Build Process
1. The `bun dev` command uses `.bin/runner.ts` to run parallel dev servers
2. Tailwind CSS processes `src/_static/css/style.css` to `dist/static/css/style.css`
3. Eleventy builds all content to the `dist/` directory
4. HTML is minified in production
5. Asset hashing is applied when building on Cloudflare Pages (CF_PAGES env var)

### Environment Variables
- `RAINDROPIO_API_KEY` - Required for bookmarks integration

### Markdown Processing
Uses markdown-it with several plugins:
- GitHub-style alerts
- Heading anchors with automatic IDs
- Footnotes support
- Table captions
- Custom heading level shifting
- Attributes support for adding classes/IDs to elements

### Image Processing
- Automatic image optimization with @11ty/eleventy-img
- Supports SVG, AVIF, and JPEG formats
- Responsive image generation with multiple sizes
- Caching enabled for faster builds

### Collections
- **Posts** - Blog posts from `content/posts/` (via symlink at `src/content/`)
- **TIL** - Today I Learned entries from `content/til/` (via symlink at `src/content/`)
- **Blog** - Combined posts and TIL entries sorted by date

### Deployment
- Hosted on Cloudflare Pages
- Uses `_redirects` and `_headers` files for Cloudflare configuration
- Asset hashing enabled in production builds
- Wrangler configuration in `wrangler.toml`