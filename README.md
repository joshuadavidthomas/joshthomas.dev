# joshthomas.dev

Personal site built with [SvelteKit](https://svelte.dev/docs/kit), Svelte 5, Tailwind CSS 4, Markdown, and the [Vite+](https://viteplus.dev/) toolchain.

## Development

```bash
pnpm install
vp dev
```

## Validation

```bash
vp fmt
vp lint
vp check
pnpm check
vp test
vp build
```

The static production site is written to `dist/` for Cloudflare Pages.

## Structure

- `content/posts/` — blog posts
- `content/til/` — Today I Learned entries
- `content/design-system.md` — design-system reference
- `src/lib/server/content.ts` — build-time Markdown collection loader
- `src/lib/server/projects.ts` — cached build-time project and package data
- `src/lib/styles/` — global theme, typography, layout, and code styles
- `src/routes/` — SvelteKit pages and generated feed/sitemap endpoints
- `public/` — static assets, Cloudflare redirects, and headers

## Environment

- `GITHUB_TOKEN` — optional; increases GitHub API limits for project data
