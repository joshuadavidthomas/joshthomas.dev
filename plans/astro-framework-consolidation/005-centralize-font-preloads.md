# Plan 005: Give font preloads one owner

> Executor instructions: Follow this plan in order. Run each check before moving on. If a STOP condition occurs, write a handback rather than adding another font path. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml src/layouts/BaseLayout.astro src/pages/blog src/pages/til src/lib/styles/fonts.css public/static/fonts plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if font declarations or preload policy no longer match.

## Status

- Effort: S
- Risk: LOW
- Depends on: `003-consolidate-route-urls.md`
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

The font-face CSS is one coherent manual pipeline. Preload policy is split across the base layout and two article routes. The first audit proposed Astro Fonts, but the installed local provider cannot select the basic-Latin MonoLisa pair by Unicode range. Adopting it would replace plain CSS with config-order coupling and generated-data indexing.

The smaller end state keeps `fonts.css` and the existing public font files unchanged. `BaseLayout` becomes the one preload owner and uses its existing article type to add MonoLisa only where code prose needs it.

## Current state

- `src/lib/styles/fonts.css` owns every `@font-face` declaration and Unicode range.
- `src/layouts/BaseLayout.astro:66-68` preloads Bricolage and both Inter faces for every page.
- `src/pages/blog/[year]/[slug].astro:18-19` and `src/pages/til/[category]/[slug].astro:18-19` repeat the same MonoLisa basic-Latin normal and italic links.
- Both article routes already pass `type="article"` to `BaseLayout`.
- Astro Fonts can represent the faces but cannot filter the local MonoLisa preload by Unicode range. Keep one manual pipeline until that stable interface changes.

Behavior to preserve:

- ordinary pages preload exactly Bricolage normal, Inter normal, and Inter italic;
- article pages add only MonoLisa `0-normal.woff2` and `1-italic.woff2`;
- all existing font-face descriptors, family stacks, file URLs, and visual typography remain unchanged.

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
- blog article route file under `src/pages/blog/[year]/[slug].astro`
- TIL article route file under `src/pages/til/[category]/[slug].astro`
- `plans/astro-framework-consolidation/README.md` for status only

Out of scope:

- `astro.config.ts`
- `src/lib/styles/fonts.css`
- `src/lib/styles/style.css`
- `src/lib/styles/theme.css`
- `public/static/fonts/**`
- font families, files, descriptors, URLs, fallback stacks, or visible typography
- Astro Fonts configuration
- aliases or a second font pipeline

## Steps

### Step 1: Characterize preload counts in current built output

Before editing source, run `pnpm build`. Inspect `dist/client/` HTML and record:

- a non-article page has three font preload links;
- a blog article has five;
- a TIL article has five;
- the two article-only links end in `/static/fonts/monolisa-v2.015/0-normal.woff2` and `/static/fonts/monolisa-v2.015/1-italic.woff2`.

If current output differs, STOP and update the contract before moving ownership.

Verify: `pnpm build` exits 0 and the four facts above hold.

### Step 2: Move article-only preload policy into `BaseLayout`

In `BaseLayout.astro`, keep the three global preload links unchanged. Use the existing `type === 'article'` prop to conditionally emit the two MonoLisa links beside them.

Do not add a new prop such as `preloadCodeFont`; article metadata already carries the fact that selects this behavior. Do not create a font helper component for five links.

Verify: `pnpm check` exits 0.

### Step 3: Delete route-level preload slots

Remove the two MonoLisa `<link slot="head">` elements from both article routes. Keep `type="article"` and every other layout prop unchanged.

The generic named head slot stays because it may carry future page-specific head content. Only the duplicated font links go.

Verify: `rg -n "monolisa-v2\.015/(0-normal|1-italic)" src/pages` returns no matches, while the same search finds exactly two links in `BaseLayout.astro`.

### Step 4: Compare output and run all checks

Run the full validation set and compare the same three built pages characterized in Step 1. Preload URLs and counts must be unchanged. Font CSS and typography must not change.

Verify:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- a non-article page has three font preloads in `dist/client/`;
- blog and TIL articles each have five;
- `jj diff -- src/lib/styles/fonts.css src/lib/styles/style.css src/lib/styles/theme.css public/static/fonts` is empty.

## Test plan

The production build is the real preload seam. No unit test is needed for a conditional that Astro renders directly.

Compare one ordinary page, one blog article, and one TIL article before and after. If a browser check is available, verify computed font families and line wrapping on those pages; no visual change is expected.

## Done criteria

- [x] `BaseLayout` owns all five possible font preload links.
- [x] Ordinary pages still emit three preloads.
- [x] Article pages still emit five preloads.
- [x] Article routes contain no font preload markup.
- [x] Font-face CSS, public files, URLs, and typography are unchanged.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Source changes stay within the in-scope list; the README status-only edit is allowed.

## STOP conditions

Stop if:

- any non-article route also needs MonoLisa preloaded;
- an article route does not pass `type="article"`;
- moving the links changes their order, URL, count, or built attributes;
- a font-face or font-file change becomes necessary;
- the work starts to add Astro Fonts beside the manual pipeline.

The handback must name the route whose preload policy differs and show its built preload list.

## Maintenance notes

Font faces remain a manual CSS module until Astro's stable local provider can select preloads by Unicode range. All page-level preload policy belongs in `BaseLayout`; route files should not repeat font links.
