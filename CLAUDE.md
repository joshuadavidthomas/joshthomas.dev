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

This site uses Astro content collections and Astro components. Astro prerenders ordinary routes. `/projects/` and its `/og/projects/` card export `prerender = false` and run in the Cloudflare Worker through `@astrojs/cloudflare`.

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

### Social cards

`src/layouts/OpenGraph.astro` renders dedicated 1200 × 630 cards at `/og/` plus each page's path. Metadata sends those URLs to Eleventy's screenshot service, with article dates in the captured URL's `updatedAt` query parameter. Cards are `noindex` and excluded from the sitemap. Posts can supply `ogSummary`; TIL cards fall back to `summary`. The projects card uses the same runtime data and cache lifetimes as `/projects/`.

### Content

Astro's deferred glob loaders read and validate the Markdown collections without rendering bodies. `src/lib/markdown.ts` renders bodies only for articles, the design system, and the full-content Atom feed while preserving heading anchors, attributes, footnotes, GitHub alerts, table captions, linkification, and paired light/dark syntax highlighting. The home page's Work, Projects, and Community Markdown renders as a tree of heading sections (`renderMarkdownSections`), so the page wraps each company, category, and item in its own markup. Astro's `paginate()` owns blog list paths, slices, and navigation.

### Themes

`src/lib/theme.ts` restores the chosen theme and mode before paint. Themes are CSS in `src/lib/styles/themes/`, keyed on `data-theme-name`. The `django.contrib.admin` theme also rebuilds the layout as the Django admin (`django-admin-layout.css`): the home page becomes the index dashboard, the archive and projects pages changelists, and articles read-only views, with the change form at `?change` and the delete confirmation at `?delete`. Markup with the `admin-only` class, like the components in `src/components/admin/`, is hidden in every other theme.

### Projects

`/projects/` aggregates GitHub repositories, contributions, package statistics, release downloads, languages, and topics at request time. Repository-to-registry package names live in `src/lib/server/project-packages.ts`. A daily scheduled Worker refreshes PyPI statistics sequentially and stores the last successful values in the `PACKAGE_STATS` KV binding; request handling reads that snapshot and never calls PyPI Stats directly. Required repository facts and declared package statistics reject when unavailable; languages, release downloads, and contributions may degrade. Astro caches complete canonical responses in Cloudflare for 24 hours and can serve them stale for seven more days while revalidating. `GITHUB_TOKEN` is an optional Cloudflare secret.

### Deployment

Wrangler deploys the Cloudflare Worker and its `dist/client/` static assets. Keep `public/_redirects` and `public/_headers` intact. Worker environments, the `PACKAGE_STATS` KV binding, and the production cron trigger live in `wrangler.jsonc`; Astro writes the deployable config to `dist/server/wrangler.json`. Staging has its own KV binding and no automatic cron.
