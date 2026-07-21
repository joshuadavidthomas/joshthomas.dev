# Plan 001: Render Markdown bodies only where their HTML is used

> Executor instructions: Follow this plan in order. Run each check before moving on. If a STOP condition occurs, write a handback rather than choosing a new design. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml content src/content.config.ts src/lib/content.ts src/lib/markdown.ts src/lib/markdown.test.ts src/lib/design-system.ts src/components/Article.astro src/pages/feeds/blog.xml.ts plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if the content flow no longer matches.

## Status

- Effort: M
- Risk: MED
- Depends on: none
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

The glob loaders render each Markdown file during Astro content sync. The site then parses the raw body again with MarkdownIt. The `entries()` metadata query also highlights every code block even when a caller only needs a title, date, or URL.

The end state keeps the custom MarkdownIt output because it carries site behavior that Astro's native processor cannot replace without a larger plugin suite. Astro's `deferRender` option will prevent its unused render pass. List pages will map metadata and raw bodies; article and feed callers will render bodies only when they need HTML.

## Current state

- `src/content.config.ts:11-23` defines three `glob()` loaders without `deferRender`, so Astro renders all Markdown during sync.
- `src/lib/content.ts:16-53` calls `renderMarkdown()` while mapping both collections and stores the result as `Entry.html`.
- `src/components/Article.astro:19` injects the eager `Entry.html` string.
- `src/pages/feeds/blog.xml.ts:11-20` depends on the same eager HTML for full-content Atom entries.
- `src/lib/design-system.ts:30-37` has a real need to transform the raw body before rendering: it inserts generated color swatches between markers.
- `src/lib/markdown.ts:57-62` creates Shiki at module load. Importing `renderInline()` for list titles therefore pays the highlighter startup cost.
- `src/lib/markdown.test.ts` is the behavior-level test seam for custom Markdown output.

Published Markdown behavior to preserve:

- inline Markdown in titles;
- raw HTML passthrough;
- automatic linkification;
- hard line breaks;
- heading anchors and general attributes;
- footnotes;
- standard and custom GitHub alerts, including custom icons;
- table captions and responsive wrappers;
- post heading-level shifts;
- paired light and dark Shiki output and the code icon;
- full rendered post bodies in the Atom feed;
- generated color swatches on `/design-system/`.

## Commands

| Purpose               | Command       | Expected result            |
| --------------------- | ------------- | -------------------------- |
| Format                | `pnpm format` | exits 0                    |
| Lint                  | `pnpm lint`   | exits 0                    |
| Type and Astro checks | `pnpm check`  | exits 0                    |
| Tests                 | `pnpm test`   | all tests pass             |
| Production build      | `pnpm build`  | exits 0 and writes `dist/` |

## Scope

In scope:

- `src/content.config.ts`
- `src/lib/content.ts`
- `src/lib/markdown.ts`
- `src/lib/markdown.test.ts`
- `src/lib/design-system.ts` only if its call must await the new renderer contract
- `src/components/Article.astro`
- `src/pages/feeds/blog.xml.ts`
- `plans/astro-framework-consolidation/README.md` for status only

Out of scope:

- Markdown syntax or rendered class changes
- published content URLs
- replacing MarkdownIt with Sätteri, unified, remark, or rehype
- pagination and canonical URL work; later plans own those
- content-file moves or frontmatter changes

## Steps

### Step 1: Characterize the current renderer before changing its flow

Expand `src/lib/markdown.test.ts` while `renderMarkdown()` still has its current synchronous contract. Add behavior cases for:

1. inline title code;
2. raw HTML passthrough;
3. automatic URL linkification;
4. hard line breaks;
5. heading permalinks and general attributes;
6. standard and custom alerts, including custom icons;
7. footnotes;
8. a captioned table inside the responsive wrapper;
9. post heading shifting from `h1` through `h5`;
10. paired Shiki themes and the code icon.

Do not test token arrays, plugin call order, or private helper choreography.

Verify: `pnpm test` passes before production code changes.

### Step 2: Make the glob loaders metadata-first

Set `deferRender: true` on the posts, TIL, and design `glob()` loaders in `src/content.config.ts`. Keep raw bodies available; do not set `retainBody: false`.

This is the deliberate Astro 7 contract: the framework owns discovery, parsing, validation, IDs, and queries, while the site's one custom renderer owns HTML.

Verify: `pnpm check` exits 0.

### Step 3: Switch the entry and all HTML callers as one green change

Change `Entry` in `src/lib/content.ts` so it carries a raw `body: string` instead of `html: string`. Map `entry.body ?? ''` without calling `renderMarkdown()`. Keep title rendering, date sorting, URLs, and the current post/TIL distinction unchanged. Delete `findEntry()` if it remains unused.

In the same edit:

- update `src/components/Article.astro` to call and await `renderMarkdown(entry.body, entry.type === 'post')`, then inject that result;
- update `src/pages/feeds/blog.xml.ts` to render post bodies with `Promise.all()` before building Atom entries;
- preserve CDATA, absolute-link rewriting, ordering, post heading shifts, and TIL heading levels.

Do not leave the tree between an `Entry.body` change and stale `entry.html` callers. Do not add separate metadata/body wrapper types or a wrapper around `renderMarkdown()`.

Verify: `pnpm check`, `pnpm test`, and `pnpm build` all pass. `dist/client/feeds/blog.xml` contains each full post body.

### Step 4: Defer Shiki setup and update its tests as one green change

Keep `renderInline()` synchronous. Make `renderMarkdown()` asynchronous and initialize the Shiki highlighter on first full-document render, reusing one promise thereafter. The MarkdownIt highlight callback must never run before the highlighter is ready.

Update every Step 1 test to await `renderMarkdown()` in the same edit. Do not weaken, delete, or replace an assertion merely because initialization moved. Do not create two MarkdownIt configurations; inline titles and full bodies must keep the same inline parsing rules.

Verify: `pnpm test` passes with every pre-change behavior case.

### Step 5: Check built caller output

Run the full validation set. Inspect built article, design-system, and feed output for the preserved claims above. Confirm metadata-only calls no longer reference `entry.html` or call `renderMarkdown()`.

Verify:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `rg -n "entry\.html|html: renderMarkdown|findEntry" src` returns no matches

## Test plan

Use `src/lib/markdown.test.ts` as the main automated seam. Build output supplies integration evidence for Astro content loading and route rendering.

After `pnpm build`, check:

- `dist/client/blog/2025/open-source-is-a-gift/index.html` contains shifted body headings and Shiki theme variables;
- `dist/client/design-system/index.html` contains `color-swatch`, a table caption, an alert, and a footnote section;
- `dist/client/feeds/blog.xml` contains full HTML in CDATA and absolute internal links.

## Done criteria

- [x] All three glob loaders use `deferRender: true`.
- [x] `entries()` does no full-body Markdown rendering.
- [x] An article renders exactly its selected body.
- [x] The feed renders post bodies explicitly.
- [x] Shiki does not initialize merely to render an inline title.
- [x] Custom Markdown behavior has direct tests.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Source changes stay within the in-scope list; the README status-only edit is allowed.

## STOP conditions

Stop if:

- `deferRender` is absent from the installed Astro glob loader;
- a required caller needs Astro's `Content` component rather than an HTML string;
- lazy Shiki setup requires a second parser configuration or changes output;
- preserving the Atom feed requires a second full-document renderer;
- the design-system swatch transform no longer operates on raw Markdown;
- any published Markdown fixture changes in a way the listed behavior does not explain;
- work requires a content URL or frontmatter migration.

The handback must state which behavior cannot be preserved, show the changed output, and name the caller that forces the fork.

## Maintenance notes

Future metadata callers should use `entries()` without rendering bodies. New full-content callers must call `renderMarkdown()` at their output seam. If the site later drops MarkdownIt-only features, reconsider native `render(entry)` as one complete replacement; do not add it beside this renderer.
