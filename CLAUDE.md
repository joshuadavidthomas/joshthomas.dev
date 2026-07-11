# CLAUDE.md

## Development commands

```bash
pnpm install
vp dev
vp check
pnpm check
vp build
vp preview
```

- `vp check` runs Vite+ formatting, linting, and TypeScript checks.
- `pnpm check` also runs `svelte-check`.
- The static production site is written to `dist/`.

## Architecture

This is a fully prerendered SvelteKit 2 and Svelte 5 site deployed to Cloudflare Pages.

### Core technologies

- SvelteKit with `@sveltejs/adapter-static`
- Svelte 5 rune mode
- Vite+ and Vite 8
- Tailwind CSS 4
- Markdown-it with syntax highlighting and content plugins
- pnpm

### Structure

- `content/posts/` — blog Markdown
- `content/til/` — TIL Markdown grouped by category
- `content/design-system.md` — design-system reference content
- `src/lib/components/` — shared Svelte components
- `src/lib/server/content.ts` — Markdown parsing and content collections
- `src/lib/server/projects.ts` — cached build-time project and contribution data
- `src/lib/styles/` — global layout, theme, prose, and code styles
- `src/routes/` — pages, feed, and sitemap
- `public/` — fonts, images, Cloudflare headers, and redirects

### Routes

- `/`
- `/blog/` and `/blog/{page}/`
- `/blog/{year}/{slug}/`
- `/til/{category}/{slug}/`
- `/projects/`
- `/design-system/`
- `/feeds/blog.xml`
- `/sitemap.xml`
- `/robots.txt`

### Content

`src/lib/server/content.ts` reads Markdown at build time. It provides heading anchors, attributes, footnotes, GitHub alerts, table captions, linkification, and syntax highlighting. Route `entries` functions enumerate dynamic post and TIL pages for prerendering.

### Projects

`src/lib/server/projects.ts` gathers GitHub repositories, contributions, package statistics, release downloads, languages, topics, and aggregate totals at build time. Responses are cached under `.cache/`. `GITHUB_TOKEN` is optional but recommended to avoid anonymous API limits.

### Deployment

Cloudflare Pages publishes `dist/`. Keep `public/_redirects` and `public/_headers` intact. Runtime versions are declared in `wrangler.toml`.
