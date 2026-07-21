# Plan 004: Give the homepage avatar one optimized asset path

> Executor instructions: Follow this plan in order. Run each check before moving on. If a STOP condition occurs, write a handback rather than retaining both image paths. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml astro.config.ts src/pages/index.astro src/lib/assets/me.png public/static/images/me.png plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if a new caller uses the public avatar path.

## Status

- Effort: S
- Risk: LOW
- Depends on: none
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

The homepage imports Astro image metadata but discards the image service. It hand-maintains the preload URL, dimensions, and `<img>` source. A second byte-identical avatar also sits under `public/` without a caller.

The end state keeps one source image under `src/`. Astro produces one build-time image result, and both the preload and `<img>` use that result.

## Current state

- `astro.config.ts:9` configures the Cloudflare adapter's compile-time image service.
- `src/pages/index.astro:5` imports `src/lib/assets/me.png`.
- `src/pages/index.astro:12-14` uses `avatar.src` in a manual preload and raw `<img>`.
- `src/lib/assets/me.png` and `public/static/images/me.png` are byte-identical.
- Repository search finds no caller for `/static/images/me.png`.
- The visible contract is a 250×250 intrinsic image, high fetch priority, explicit preload, existing alt text, and existing responsive classes.

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

- `src/pages/index.astro`
- delete `public/static/images/me.png`
- `plans/astro-framework-consolidation/README.md` for status only

Out of scope:

- `src/lib/assets/me.png`; it remains the source asset
- adapter image-service configuration
- avatar crop, dimensions, CSS size, alt text, or visual design
- adding responsive image variants; there is one small square source
- font preload work

## Steps

### Step 1: Produce one Astro image result

Use `getImage()` from `astro:assets` in `src/pages/index.astro` with the imported avatar, the current 250×250 intrinsic dimensions, and an explicit WebP output format. The PNG-to-WebP conversion and generated asset URL are approved internal asset changes; the page URL and visible image are the contract. Do not call both `getImage()` and `<Image>`; one transform result must own the URL and attributes.

Use the transformed URL in the existing `<link rel="preload" as="image">` and `<img>`. Spread or copy Astro's generated width and height attributes, then preserve:

- `alt="Josh Thomas"`;
- `fetchpriority="high"`;
- eager behavior;
- the current class list;
- browser-default decoding unless output evidence supports a deliberate change.

The preload URL and `<img src>` must be byte-for-byte equal in built HTML.

Verify: `pnpm check` exits 0.

### Step 2: Delete the duplicate public image

Delete `public/static/images/me.png`. Removing the unused raw `/static/images/me.png` URL is an approved contract change; repository search shows no caller, and this plan does not preserve unknown external hotlinks. Do not replace it with a redirect or fallback copy. If deleting it leaves an empty directory, remove the directory; do not add `.gitkeep`.

Verify: `rg -n "static/images/me|public/static/images/me" . --glob '!node_modules/**' --glob '!dist/**'` returns no matches.

### Step 3: Verify production output

Run the full validation set and build. Check the homepage HTML and built assets:

- one avatar preload exists;
- its URL equals the `<img>` URL;
- dimensions, alt text, priority, and classes remain;
- the URL is an Astro-generated asset path rather than the raw source path;
- no duplicate `static/images/me.png` is copied to `dist/client/`.

Verify:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `test ! -e dist/client/static/images/me.png`

## Test plan

No unit test is needed for Astro's image transform. The production build is the real seam.

Compare the built homepage before and after. Only the avatar asset URL and attributes owned by Astro may change. If a browser check is available, inspect the homepage at narrow and wide breakpoints and confirm the avatar remains sharp, circular, and the same visible size.

## Done criteria

- [x] One source avatar remains at `src/lib/assets/me.png`.
- [x] `getImage()` runs through the configured compile image service.
- [x] Preload and `<img>` share one generated URL.
- [x] Existing visible and loading behavior remains.
- [x] The duplicate public image and any empty directory are gone.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Source changes stay within the in-scope list; the README status-only edit is allowed.

## STOP conditions

Stop if:

- another route or external contract uses `/static/images/me.png`;
- `getImage()` cannot preserve the current intrinsic dimensions;
- preload and `<img>` require separate transforms or URLs;
- the explicit WebP transform changes the crop, orientation, or visible quality;
- fixing the output requires changing adapter configuration or adding a second asset path.

The handback must include the generated image attributes and the behavior that differs.

## Maintenance notes

Imported images under `src/` should pass through `astro:assets`. Keep public images only when a stable untouched URL is itself the contract.
