# Plan 003: Derive page URLs and route identity from Astro

> Executor instructions: Follow this plan in order. Run each check before moving on. If a STOP condition occurs, write a handback rather than adding fallback URLs or route aliases. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml content astro.config.ts scripts/check-built-site.mjs src/layouts/BaseLayout.astro src/components/Meta.astro src/pages/index.astro src/pages/404.astro src/pages/design-system.astro src/pages/blog src/pages/til src/pages/projects src/pages/feeds/blog.xml.ts src/pages/sitemap.xml.ts public/robots.txt plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if route files or public URL contracts no longer match.

## Status

- Effort: M
- Risk: MED
- Depends on: `002-use-astro-pagination.md`
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

Astro already knows the configured site, the current URL, and the route pattern. The site still repeats page paths in every layout call, hardcodes the production origin in two endpoints, and uses pathname regular expressions to rediscover the matched route.

The end state keeps each public URL unchanged. `Astro.url`, `Astro.site`, endpoint context, and `Astro.routePattern` become the only route facts used by page code. The custom Atom and sitemap endpoints remain because their exact output contracts are useful and the official integrations would change them.

## Current state

- `astro.config.ts:6` defines `site: 'https://joshthomas.dev'`.
- `src/layouts/BaseLayout.astro:10-20` requires every page to supply a `path` that duplicates `Astro.url.pathname`.
- `src/components/Meta.astro:2-15` accepts that path and combines it with `Astro.site`.
- Every `BaseLayout` caller supplies its route again, including dynamic pages.
- `src/layouts/BaseLayout.astro:29-44` matches concrete pathnames with regular expressions to find the source route.
- `src/pages/feeds/blog.xml.ts:6-19` and `src/pages/sitemap.xml.ts:17` hardcode the production origin.
- `src/pages/sitemap.xml.ts:5-13` lists static and content routes but omits blog page two and later.
- `public/robots.txt:4` publishes `/sitemap.xml`; preserve this path.
- After Plan 002, blog pagination lives at `src/pages/blog/[...page].astro` and exports `BLOG_PAGE_SIZE` from `src/lib/content.ts`.

## Commands

| Purpose               | Command       | Expected result |
| --------------------- | ------------- | --------------- |
| Format                | `pnpm format` | exits 0         |
| Lint                  | `pnpm lint`   | exits 0         |
| Type and Astro checks | `pnpm check`  | exits 0         |
| Tests                 | `pnpm test`   | all tests pass  |
| Production build      | `pnpm build`  | exits 0         |

## Scope

In scope:

- `src/layouts/BaseLayout.astro`
- `src/components/Meta.astro`
- all `.astro` page callers of `BaseLayout`
- `src/pages/feeds/blog.xml.ts`
- `src/pages/sitemap.xml.ts`
- add `scripts/check-built-site.mjs`
- `package.json` build script
- `plans/astro-framework-consolidation/README.md` for status only

Out of scope:

- changing `astro.config.ts` site or trailing-slash settings
- changing public route URLs
- replacing the Atom feed with RSS
- adopting `@astrojs/rss`; it does not own the existing Atom contract
- adopting `@astrojs/sitemap`; preserve the published `/sitemap.xml` endpoint without an index-file redirect
- changing article slug policy
- adding compatibility redirects

## Steps

### Step 1: Record the current public URL contracts

Before editing source, run `pnpm build` and inspect output under `dist/client/` plus the generated server files under `dist/server/`. Record:

- canonical and `og:url` values for home, blog, one article, one TIL, design system, and 404;
- source-link targets for those static and dynamic pages;
- every feed-level and entry-level URL in `dist/client/feeds/blog.xml`;
- every URL and `lastmod` in `dist/client/sitemap.xml`;
- `/projects/` is absent from static client HTML and remains declared as an on-demand Astro route.

This is pre-change characterization. If current output differs from the contracts described in this plan, STOP before changing production code.

Verify: `pnpm build` exits 0 and the recorded output matches current public behavior.

### Step 2: Remove the layout path interface

Delete `path` from `BaseLayout`'s props and from every page call. Keep `Meta.astro` as the module that owns title, description, canonical, Open Graph, Twitter, and screenshot metadata; it hides enough policy to earn its file.

Delete `path` from `Meta.astro` too. Build the canonical URL from `Astro.url.pathname` and `Astro.site`. Exclude query parameters. Use that one URL for canonical, `og:url`, and screenshot input.

`Astro.site` is required by `astro.config.ts`; do not add a localhost or hardcoded production fallback. If TypeScript needs narrowing, use an assertion or a clear invariant check.

Verify: `pnpm check` exits 0 and `rg -n "path=" src/pages --glob '*.astro'` finds no `BaseLayout` path props.

### Step 3: Use `Astro.routePattern` for source links

Replace the pathname comparison tree in `BaseLayout.astro` with route-pattern-based source-path construction. Route patterns should map directly to source paths:

- `/` maps to `src/pages/index.astro`;
- `/blog/[...page]` maps to `src/pages/blog/[...page].astro`;
- `/blog/[year]/[slug]` maps to its dynamic file;
- `/til/[category]/[slug]` maps to its dynamic file;
- ordinary flat routes map to `src/pages/<route>.astro`;
- `/projects` maps explicitly to `src/pages/projects/index.astro` because its on-demand route stays in place.

Use one small static pattern-to-file map for `/` and `/projects`; derive dynamic and flat routes from `Astro.routePattern`. Do not move the projects route merely to remove this exception.

Verify: `pnpm build` exits 0, source links in `dist/client/` point to real repository paths, and `src/pages/projects/index.astro` still exports `prerender = false`. Plan 006's built-Worker request is the public runtime proof for `/projects/`.

### Step 4: Use endpoint `site` in the Atom feed

Change the feed handler to accept Astro's endpoint context and use its `site` value for:

- entry URLs and IDs;
- feed self and alternate links;
- author URI;
- feed ID;
- root-relative `href` and `src` values inside rendered post HTML.

Keep one small absolute-HTML transform if needed. It should accept the configured origin rather than close over a hardcoded string. Preserve Atom XML, CDATA, ordering, and `/feeds/blog.xml`.

Verify: `pnpm build` exits 0 and every absolute URL in `dist/client/feeds/blog.xml` begins with the configured site.

### Step 5: Repair the custom sitemap without adding a second route system

Change the sitemap handler to accept endpoint context and build absolute URLs from `site`.

Keep the static page list and content URLs. Add `/blog/2/` through the last page using the metadata entry count and `BLOG_PAGE_SIZE`. Do not render bodies to calculate this. Keep `lastmod` for content entries.

The official sitemap integration is deliberately out of scope: this site publishes one exact `/sitemap.xml` file, while the integration's index/chunk output would need rewrite glue. The custom endpoint is acceptable once it uses Astro's site value and includes generated pagination.

Verify: `pnpm build` exits 0 and `dist/client/sitemap.xml` contains the configured origin, all static routes, and every current content URL.

### Step 6: Add a persistent built-site contract check

Add `scripts/check-built-site.mjs` as a real Node script and run it after `astro build` from the package `build` command. It must fail with a specific message when any of these claims breaks:

- representative static pages have the expected canonical and `og:url` values;
- representative source links point to real static or dynamic source files;
- feed self, alternate, author, ID, entry, and body URLs use the production origin;
- sitemap URLs use the production origin and contain each generated numeric blog page;
- sitemap content entries retain `lastmod`;
- `/projects/` is absent from static client HTML; the source keeps `prerender = false`, while Plan 006 owns the built-Worker route request.

Use Node's file and assertion APIs. Do not add an HTML/XML parser dependency for these small fixed outputs. The expected production origin in a contract test is allowed; production source must still read `site` from Astro.

Verify: `pnpm build` runs Astro and then the contract script, and exits 0.

### Step 7: Exercise sitemap pagination with the 11-entry fixture

Recreate the six temporary TIL entries from Plan 002, run `pnpm build`, and confirm the contract script discovers `/blog/2/` and requires it in `dist/client/sitemap.xml`. Delete the fixtures and empty directory, then run the five-entry build again. Confirm `jj st` shows no content fixture.

Verify: both builds pass and no temporary content file remains.

### Step 8: Run final URL checks

Run the full validation set. Confirm canonical, Open Graph, feed, sitemap, and source links all derive from Astro facts.

Verify:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `rg -n "https://joshthomas\.dev" src/pages/feeds src/pages/sitemap.xml.ts` returns no matches
- `rg -n "pathname ===|pathname\.startsWith|/\^\\/blog" src/layouts/BaseLayout.astro` returns no source-route matcher
- `test ! -e dist/client/projects/index.html`
- `rg -n "prerender = false" src/pages/projects/index.astro` finds the on-demand route declaration
- `test -f dist/server/entry.mjs`
- `test -f dist/client/sitemap.xml`
- `test -f dist/client/feeds/blog.xml`

## Test plan

Use production output as the route and metadata integration evidence. Check these pages:

- `/`
- `/blog/`
- one blog article
- one TIL article
- `/design-system/`
- `/projects/`
- `/404/`

For each prerendered HTML page, canonical and `og:url` must equal `https://joshthomas.dev` plus its trailing-slash pathname. Query parameters must not appear. Verify `/projects/` through generated server route data or a built-Worker request rather than looking for static HTML.

The persistent post-build script checks source links for prerendered static and dynamic routes, feed and sitemap URLs, content `lastmod`, numeric pagination routes, and absence of static projects HTML. Plan 006's staging request checks the on-demand projects route through its public response boundary. The temporary 11-entry build proves `/blog/2/` is both generated and listed.

## Done criteria

- [x] `BaseLayout` and `Meta` no longer accept `path`.
- [x] Canonical and social URLs derive from `Astro.url.pathname` and `Astro.site`.
- [x] Endpoint URLs derive from endpoint `site`.
- [x] Source links derive from `Astro.routePattern`, with no concrete-pathname regex tree.
- [x] `/projects/` stays at its current on-demand route file and remains absent from static output.
- [x] `/sitemap.xml` lists every current route family; an 11-entry build proves pagination output.
- [x] Feed and sitemap source contain no hardcoded production origin.
- [x] The package build runs a persistent built-site contract script.
- [x] No temporary content fixture remains.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Source changes stay within the in-scope list; the README status-only edit is allowed.

## STOP conditions

Stop if:

- `Astro.routePattern` cannot distinguish one of the dynamic route source files;
- the explicit `/projects` pattern cannot preserve its current source link and on-demand rendering;
- `Astro.url.pathname` produces a canonical path that differs from the published trailing-slash URL;
- the endpoint context lacks the configured `site` during static generation;
- preserving `/sitemap.xml` requires a redirect or parallel sitemap endpoint;
- the feed's Atom contract or full-content body would change;
- any solution adds a fallback origin, route alias, or second metadata path.

The handback must include the generated URL or route pattern that failed and the expected public URL.

## Maintenance notes

`astro.config.ts` owns the production origin. Route files own their location through Astro's filesystem router. Metadata code may consume `Astro.url`, `Astro.site`, or endpoint `site`; it should never require callers to restate those values. Keep the built-site contract script aligned with new public route families.
