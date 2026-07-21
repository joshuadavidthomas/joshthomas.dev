# Plan 002: Let Astro own blog pagination

> Executor instructions: Follow this plan in order. Run each check before moving on. If a STOP condition occurs, write a handback rather than inventing a second pagination shape. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml content src/lib/content.ts src/components/BlogList.astro src/pages/blog/index.astro 'src/pages/blog/[page].astro' 'src/pages/blog/[...page].astro' src/pages/sitemap.xml.ts plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if route ownership or pagination props no longer match.

## Status

- Effort: M
- Risk: LOW
- Depends on: `001-defer-content-rendering.md`
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

Page one and later pages currently calculate the same slice in different route files. `BlogList` then calculates navigation URLs a third time. Astro's `paginate()` already returns the page slice, counts, offsets, and URLs.

The end state has one catch-all route. Astro generates `/blog/` for page one and `/blog/2/` onward for later pages. The public URL shape stays unchanged.

## Current state

- `src/pages/blog/index.astro:7-14` owns page one, page size, total pages, and the first slice.
- `src/pages/blog/[page].astro:7-19` repeats page size, page count, route records, and slicing for later pages.
- `src/components/BlogList.astro:4-6` accepts app-defined `page` and `totalPages` numbers.
- `src/components/BlogList.astro:31-37` reconstructs first, previous, next, and last URLs.
- `astro.config.ts:7-8` requires trailing slashes, which the new route must preserve.
- `src/pages/sitemap.xml.ts` will need the shared page size in Plan 003.

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

- `src/lib/content.ts`
- `src/components/BlogList.astro`
- delete `src/pages/blog/index.astro`
- delete `src/pages/blog/[page].astro`
- add `src/pages/blog/[...page].astro`
- `plans/astro-framework-consolidation/README.md` for status only

Out of scope:

- entry sorting and the mix of posts and TIL entries
- article detail routes
- feed and sitemap output; Plan 003 updates sitemap pagination
- canonical URL and layout prop cleanup; Plan 003 owns that
- redirects or a compatibility route for `/blog/1/`; that URL does not exist today

## Steps

### Step 1: Characterize the multi-page route with temporary content

Before changing pagination code, create six temporary Markdown entries under `content/til/pagination-fixture/`. Give them valid frontmatter titles and filenames beginning with valid dates so the current content mapper accepts them. The site will then have 11 entries.

Run `pnpm build` and record these current contracts:

- `dist/client/blog/index.html` exists;
- `dist/client/blog/2/index.html` exists;
- page one links next and last to `/blog/2/`;
- page two links first and previous to `/blog/`;
- `/blog/1/` does not exist;
- page one has 10 entries and page two has one.

Delete all six temporary entries and their empty directory immediately after recording the output. Confirm `jj st` shows no content changes. Do not add `.gitkeep`.

Verify: the baseline build passes, all six route facts hold, and no pagination fixture remains in the working copy.

### Step 2: Give page size one owner

Export a `BLOG_PAGE_SIZE` constant from `src/lib/content.ts` next to the entry query it sizes. Keep the value at 10.

Do not create a general site-config module for one number. Plan 003 will import this constant when it enumerates sitemap pagination URLs.

Verify: `pnpm check` exits 0.

### Step 3: Replace both route files with one catch-all route

Create `src/pages/blog/[...page].astro`. Its `getStaticPaths({ paginate })` must:

- query the already sorted `entries()` result;
- call Astro's `paginate()` with `BLOG_PAGE_SIZE`;
- accept Astro's native `Page<Entry>` prop;
- let the absent catch-all parameter produce `/blog/`;
- let page two and later produce `/blog/2/`, `/blog/3/`, and so on.

Preserve the current RSS link, descriptions, headings, and first-page title. Later pages should retain `Blog · Page N` and `Blog page N` labels. Until Plan 003 removes the layout's `path` prop, derive that prop from `page.url.current`; do not rebuild it from the page number.

Delete `src/pages/blog/index.astro` and `src/pages/blog/[page].astro` in the same change. Do not leave route forwarding files.

Verify: `pnpm check` exits 0.

### Step 4: Pass Astro's page value through `BlogList`

Change `src/components/BlogList.astro` to accept one `Page<Entry>` value rather than `entries`, `page`, and `totalPages`.

Render entries from `page.data`. Render counts from `page.currentPage` and `page.lastPage`. Render links from `page.url.first`, `page.url.prev`, `page.url.next`, and `page.url.last`. Keep the current labels and layout.

Do not normalize, concatenate, or special-case pagination URLs in the component. Astro owns them.

Verify: `pnpm check` exits 0.

### Step 5: Re-run the 11-entry route contract against Astro pagination

Recreate the same six temporary TIL entries used in Step 1. Run a production build and compare all six route, count, and navigation facts against the baseline. This time Astro's `Page<Entry>` values must produce them.

Delete the temporary entries and empty directory, then run the normal five-entry build again.

Verify:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `test -f dist/client/blog/index.html`
- `test ! -e dist/client/blog/1`
- `rg -n "PAGE_SIZE|totalPages|all\.slice|/blog/\$\{" src/pages/blog src/components/BlogList.astro` finds no hand-built pagination logic
- `jj st` shows no content fixture files

## Test plan

The production build is the route integration test. Use the temporary 11-entry fixture before and after the change to prove page two, slicing, and navigation. Remove the fixture before final validation.

Review the final five-entry `dist/client/blog/index.html` for the first page's title, RSS link, current entries in date order, and absence of pagination navigation.

## Done criteria

- [x] One catch-all route owns all blog list pages.
- [x] `paginate()` owns slicing and counts.
- [x] `Page<Entry>.url` owns every pagination link.
- [x] The old index and `[page]` route files are deleted.
- [x] An 11-entry temporary build proves `/blog/2/`, 10/1 slicing, and native first/previous/next/last links.
- [x] `/blog/` remains the first-page URL and `/blog/1/` is absent.
- [x] No temporary content fixture remains.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Source changes stay within the in-scope list; the README status-only edit is allowed.

## STOP conditions

Stop if:

- Astro's catch-all pagination emits `/blog/1/` instead of `/blog/`;
- `page.url.current` or another native URL lacks the configured trailing slash;
- the new route collides with `src/pages/blog/[year]/[slug].astro`;
- preserving the current first-page metadata requires a second route;
- work requires a redirect, alias route, or custom pagination helper.

The handback must include Astro's generated route list and the exact collision or URL mismatch.

## Maintenance notes

Future pagination UI should consume `Page<Entry>` rather than page numbers. A page-size change belongs in `BLOG_PAGE_SIZE`; route slicing and link arithmetic must not return to page code.
