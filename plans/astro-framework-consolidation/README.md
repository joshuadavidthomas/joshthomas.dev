# Astro framework consolidation

This effort removes duplicated framework work from the in-progress Astro migration while preserving the site's public URLs, Markdown output, Atom feed, sitemap path, and visible design. It was planned against working-copy revision `7ffd0af1d9c5` on 2026-07-21. The plans use Astro-native route, URL, image, and cache facts where they delete local policy. Deeper review rejected two parts of the first audit: native Markdown rendering would add a replacement plugin stack, and Astro Fonts cannot express the current MonoLisa preload policy without a fragile positional rule.

The planning rule comes from the data-over-abstractions mindset: keep one ordinary value for each fact and let framework operations consume it. A second wrapper or compatibility path must remove more caller work than it adds.

Execute in the order below unless dependencies say otherwise. Read each plan fully, honor its STOP conditions, and update its row when done.

## Finding coverage

| Audit finding                                                 | Plan and transition                                                                                               | Invariant and evidence                                                                                                       | STOP guard                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Astro and MarkdownIt both render each collection body         | [001](001-defer-content-rendering.md): set `deferRender` and keep one custom renderer                             | Existing Markdown behavior is characterized before the flow changes; production output under `dist/client/` stays equivalent | Stop on any parser/output contract that needs a second renderer          |
| Metadata queries highlight every body                         | [001](001-defer-content-rendering.md): carry raw body and render only article/feed callers                        | `entries()` contains no full-body render; article and feed output checks pass                                                | Stop if a metadata caller truly needs rendered HTML                      |
| Pagination is implemented three times                         | [002](002-use-astro-pagination.md): one `[...page]` route and `Page<Entry>`                                       | Astro owns slices, counts, and links; an 11-entry temporary build proves page two                                            | Stop on route collision or `/blog/1/` output                             |
| Sitemap repeats route inventory and misses pagination         | [003](003-consolidate-route-urls.md): keep the exact endpoint but derive site and page count                      | `/sitemap.xml` keeps its public path, content dates, and all page families                                                   | Stop if preserving the path needs a second sitemap or redirect           |
| Pages repeat canonical paths and endpoints repeat the origin  | [003](003-consolidate-route-urls.md): use `Astro.url`, `Astro.site`, and endpoint `site`                          | Post-build contract checks cover canonical, Open Graph, Atom, and sitemap URLs                                               | Stop on trailing-slash or static-build site mismatch                     |
| Layout reconstructs the matched route from concrete pathnames | [003](003-consolidate-route-urls.md): use `Astro.routePattern` plus two static file-layout exceptions             | Built source links point to real static and dynamic source files                                                             | Stop if one pattern cannot identify its source file                      |
| Avatar bypasses Astro and has a byte-identical public copy    | [004](004-use-astro-image.md): one `getImage()` result and one source file                                        | Preload and `<img>` share the generated URL; visual size stays fixed                                                         | Stop on another caller or changed crop/quality                           |
| Font declarations and preloads have two owners                | [005](005-centralize-font-preloads.md): keep one manual font pipeline and centralize all preloads in `BaseLayout` | Font CSS stays unchanged; ordinary/article preload counts stay three/five                                                    | Stop if layout cannot own the article-only preload policy                |
| `/projects/` maintains two custom data-cache layers           | [006](006-use-astro-route-cache.md): cache one successful route response                                          | Required records validate; the sole caller gets direct arrays; staging proves provider, miss/hit, and upstream bypass        | Stop if the account lacks the provider or a hit still runs upstream work |

## Execution order and status

| Plan                                   | Title                                                       | Effort | Depends on | Status |
| -------------------------------------- | ----------------------------------------------------------- | -----: | ---------- | ------ |
| [001](001-defer-content-rendering.md)  | Render Markdown bodies only where their HTML is used        |      M | —          | DONE   |
| [002](002-use-astro-pagination.md)     | Let Astro own blog pagination                               |      M | 001        | DONE   |
| [003](003-consolidate-route-urls.md)   | Derive page URLs and route identity from Astro              |      M | 002        | DONE   |
| [004](004-use-astro-image.md)          | Give the homepage avatar one optimized asset path           |      S | —          | DONE   |
| [005](005-centralize-font-preloads.md) | Give font preloads one owner                                |      S | 003        | DONE   |
| [006](006-use-astro-route-cache.md)    | Replace the projects data caches with one Astro route cache |      L | —          | DONE   |

Status values: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED` with a reason, or `SUPERSEDED` with a replacement link.

## Dependency notes

- 001 before 002: pagination must enumerate metadata without rendering every body.
- 002 before 003: canonical paths, source links, and sitemap pagination should target the final catch-all route.
- 004 and 006 are independent. Plan 006 remains last in the recommended order because it needs a staging Worker and an account-level gate.
- 003 before 005: route metadata cleanup should settle `BaseLayout` before font preload ownership moves there.

## Reconciliation log

- 2026-07-22: A fresh final 11-entry fixture build passed the built-site contracts, emitted 10/1 entry slices, preserved native first/previous/next/last links, listed `/blog/2/` in the sitemap, rewrote root-relative feed links and images, and preserved an external feed link. All six fixtures were then removed.
- 2026-07-22: Plan 006 passed its isolated staging gate. The final staging Worker accepted the cache provider, moved from `MISS` to `HIT` with `Age`, bypassed the Worker on the hit, and returned an uncached 308 for query variants. The execution note records the final Worker version and evidence.
- 2026-07-22: Final review trimmed unread project fields and an impossible nullable crate-stat variant, removed one compiler-private build assertion, and updated `CLAUDE.md` for the route cache and Wrangler deployment.
- 2026-07-22: Live/staging comparison found partial registry rows caused by provider failures being collapsed to `null` and cached. The approved follow-up declares package identities in source, retries transient responses with `Retry-After`, requires declared-package statistics before cache admission, and adds a seven-day stale-while-revalidate window.
- 2026-07-22: Staging version `9b4357fe-419f-47a4-8347-c5a847b9e645` rendered all 13 PyPI projects, 7 npm projects, 8 declared crates, and the Zed extension. Headers moved from `MISS` to `HIT`; the hit produced no Worker tail event.
- 2026-07-22: Plan 006 removed the unread totals boundary and merged tagged item shape for its sole caller, added required GitHub record validation through the public loader seam, and replaced generated-bundle parsing with the staging route's public response contract.
- 2026-07-21: Review corrected build paths to `dist/client/`, added pre-change characterization and an 11-entry pagination build, kept the projects route in place, replaced the Astro Fonts migration with preload consolidation, and narrowed the route-cache staging gate to behavior a final Worker can prove.
- 2026-07-21: Initial six-plan effort written from the Astro 7 audit. Next: 001; 004 may run independently.

## Considered and rejected

- Replace MarkdownIt with native `render(entry)` now: rejected because the current anchors, general attributes, alerts and icons, captions, table wrappers, heading shifts, inline title rendering, dynamic design-system body, and full-content Atom feed would require a new plugin suite and a second feed-render seam. Plan 001 instead uses Astro's `deferRender` and keeps one HTML renderer.
- Write a custom content loader: rejected because it would recreate glob discovery, watching, IDs, digests, and schema parsing, and would still render every body during sync.
- Adopt `@astrojs/sitemap`: rejected because the site publishes one `/sitemap.xml` contract, while the integration's index/chunk output would add redirect glue. Plan 003 repairs the current endpoint with Astro's `site` and the native pagination count.
- Adopt `@astrojs/rss`: rejected because the published feed is Atom with full HTML, not RSS.
- Inline `Meta.astro` into the base layout: rejected because metadata tags form a cohesive module that hides real policy; removing only its duplicated `path` input gives callers the needed leverage.
- Move `src/pages/projects/index.astro` to flatten source-link mapping: rejected because one explicit route-pattern mapping costs less than route churn.
- Move all fonts into Astro Fonts: rejected after checking the installed API. The local provider cannot identify one Unicode-range subset for preload filtering, so the migration would replace plain CSS with an ordered variant table, generated-data indexing, and Tailwind variable glue. Plan 005 removes the actual duplicate preload owners and leaves one boring font pipeline.
- Keep the old projects cache as a fallback for unsupported accounts: rejected because it would leave two cache policies. Plan 006 stops if staging cannot prove the Cloudflare provider.

## Deferred

- Native collection `render(entry)`: reconsider only when the site drops enough MarkdownIt-only behavior that one Astro processor can own pages, design-system content, and feed HTML with less total code.
- Astro Fonts: reconsider when the stable local provider can filter preloads by Unicode range or another semantic subset key.
- New article slug policy or content-file moves: the audit did not require a URL migration, so these plans preserve every current path.
