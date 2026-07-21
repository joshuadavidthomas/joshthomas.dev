# joshthomas.dev

Personal site built with [Astro](https://astro.build/), Tailwind CSS 4, Markdown, and the [Vite+](https://viteplus.dev/) toolchain.

## Development

```bash
pnpm install
pnpm dev
```

## Validation

```bash
pnpm format
pnpm lint
pnpm check
pnpm test
pnpm build
```

Astro writes prerendered assets to `dist/client/` and the Cloudflare Worker to `dist/server/`. The `/projects/` page runs on demand in that Worker; every other page and endpoint is static. Wrangler deploys the Worker and its static assets.

## Structure

- `content/posts/` — blog posts
- `content/til/` — Today I Learned entries
- `content/design-system.md` — design-system reference
- `src/content.config.ts` — Astro content collection schemas and loaders
- `src/lib/content.ts` — collection-to-route mapping
- `src/lib/markdown.ts` — Markdown rendering and syntax highlighting
- `src/lib/server/projects.ts` — runtime project aggregation; the `/projects/` route owns response caching
- `src/lib/server/project-packages.ts` — repository-to-registry package declarations
- `src/lib/server/pypi-stats.ts` — PyPI snapshot refresh and KV reads
- `src/worker.ts` — Astro request handling and the daily scheduled refresh
- `src/components/` and `src/layouts/` — Astro templates
- `src/pages/` — pages, feed, and sitemap endpoints
- `src/lib/styles/` — global theme, typography, layout, and code styles
- `public/` — static assets, Cloudflare redirects, and headers

## Environment

- `GITHUB_TOKEN` — optional Cloudflare secret that raises GitHub API limits for `/projects/`

PyPI statistics are refreshed once daily by the production Worker's cron trigger and stored in the automatically provisioned `PACKAGE_STATS` KV namespace. Request handling reads the last successful snapshot instead of calling PyPI Stats directly.
