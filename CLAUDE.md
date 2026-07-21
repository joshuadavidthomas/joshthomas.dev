# CLAUDE.md

## Development commands

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm preview
```

- `pnpm check` runs formatting, lint, Astro, and TypeScript checks.
- `pnpm test` runs the renderer, theme, and projects-data tests.
- `pnpm build` writes static assets to `dist/client/`, the Worker to `dist/server/`, and then checks the built site contracts.

## Architecture

This site uses Astro content collections and Astro components. Astro prerenders ordinary routes. The `/projects/` page alone exports `prerender = false` and runs in the Cloudflare Worker through `@astrojs/cloudflare`.

### Core technologies

- Astro with `@astrojs/cloudflare`
- Vite+ and Vite
- Tailwind CSS 4
- Markdown-it with syntax highlighting and content plugins
- pnpm

### Structure

- `content/posts/` — blog Markdown
- `content/til/` — TIL Markdown grouped by category
- `content/design-system.md` — design-system reference content
- `src/content.config.ts` — content collection schemas and loaders
- `src/components/` — shared Astro components
- `src/layouts/` — site shell and metadata
- `src/lib/content.ts` — published URL and entry mapping
- `src/lib/markdown.ts` — Markdown rendering
- `src/lib/server/projects.ts` — runtime project and contribution data
- `src/lib/server/project-packages.ts` — repository-to-registry package declarations
- `src/lib/server/pypi-stats.ts` — daily PyPI snapshot refresh and KV reads
- `src/worker.ts` — Astro fetch handler and scheduled Worker entrypoint
- `src/lib/styles/` — global layout, theme, prose, and code styles
- `src/pages/` — pages, feed, and sitemap
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

Astro's deferred glob loaders read and validate the Markdown collections without rendering bodies. `src/lib/markdown.ts` renders bodies only for articles, the design system, and the full-content Atom feed while preserving heading anchors, attributes, footnotes, GitHub alerts, table captions, linkification, and paired light/dark syntax highlighting. Astro's `paginate()` owns blog list paths, slices, and navigation.

### Projects

`/projects/` aggregates GitHub repositories, contributions, package statistics, release downloads, languages, and topics at request time. Repository-to-registry package names live in `src/lib/server/project-packages.ts`. A daily scheduled Worker refreshes PyPI statistics sequentially and stores the last successful values in the `PACKAGE_STATS` KV binding; request handling reads that snapshot and never calls PyPI Stats directly. Required repository facts and declared package statistics reject when unavailable; languages, release downloads, and contributions may degrade. Astro caches complete canonical responses in Cloudflare for 24 hours and can serve them stale for seven more days while revalidating. `GITHUB_TOKEN` is an optional Cloudflare secret.

### Deployment

Wrangler deploys the Cloudflare Worker and its `dist/client/` static assets. Keep `public/_redirects` and `public/_headers` intact. Worker environments, the `PACKAGE_STATS` KV binding, and the production cron trigger live in `wrangler.jsonc`; Astro writes the deployable config to `dist/server/wrangler.json`. Staging has its own KV binding and no automatic cron.
