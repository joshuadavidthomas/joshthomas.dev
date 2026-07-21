# Plan 006: Replace the projects data caches with one Astro route cache

> Executor instructions: Follow this plan in order. This plan must pass a staging Worker gate before it lands. Deploy only to the named staging environment. If a STOP condition occurs, write a handback and do not keep both cache systems. When done, set this plan to `DONE` in `README.md`; that status-only edit is exempt from the source scope below.
>
> Drift check: `jj diff --from 7ffd0af1d9c5 -- package.json pnpm-lock.yaml CLAUDE.md astro.config.ts wrangler.jsonc src/lib/server/projects.ts src/lib/server/projects.test.ts src/pages/projects/index.astro scripts/check-built-site.mjs plans/astro-framework-consolidation/006-use-astro-route-cache.md plans/astro-framework-consolidation/README.md`
>
> If these files changed after this plan was written, compare the current state below with the live code. Stop if the projects route, cache provider, or upstream failure policy no longer matches.

## Status

- Effort: L
- Risk: HIGH
- Depends on: none
- Planned at: revision `7ffd0af1d9c5`, 2026-07-21

## Why this matters

`/projects/` is the only consumer of its aggregated data. The data module keeps an isolate `Map`, uses the Cloudflare Cache API per upstream URL, and then rebuilds the whole HTML response on every page request. The memory layer never expires, and the repeated `duration: '1d'` values have no matching type or behavior.

Astro 7 can cache the complete successful response. A hit then skips the Worker and every upstream call. This removes both custom cache layers. Required upstream failures must reject before the route opts into caching. After staging exposed partial package rows, declared package statistics became required while other enrichment can still degrade. The Cloudflare provider must work on the actual account before this change lands.

## Current state

- Local implementation and the isolated staging gate completed on 2026-07-22.
- `astro.config.ts` uses the installed `cacheCloudflare()` provider. Production and staging builds generate `cache.enabled: true`.
- `src/lib/server/projects.ts` now fetches and decodes directly, validates required GitHub repository and contributor records, owns explicit repository-to-registry package data, retries transient fetch failures, and has no memory or Cache API layer.
- The sole caller receives `{ projects, contributions }`; unused comprehensive totals, merged output, and internal project/contribution tags are gone. Contribution mapping drops records without `merged_at`, so the rendered page is unchanged.
- Public-loader tests use an ordinary static import and prove required rejection, malformed personal and organization repository rejection, malformed contributor rejection, declared-package failure rejection, `Retry-After` handling, optional contribution degradation, star order, and merged-contribution filtering.
- `src/pages/projects/index.astro` redirects query variants with 308 before loading data, consumes the two arrays directly, and sets a 24-hour route cache with a seven-day stale-while-revalidate window only after `getProjects()` resolves.
- The built-site check keeps `/projects/` out of static output and checks representative Markdown, feed, and design-system output. The staging request proves the on-demand route through its public response boundary rather than compiler-private bundle text.
- The staging build names `joshthomas-dev-staging`, records `targetEnvironment: "staging"`, and passed its dry run and deployment. Live headers proved miss, hit, age, Worker bypass, and query canonicalization.

On 2026-07-22, a live-versus-staging check found only 3 of 13 published PyPI rows and 7 of 7 npm rows on production, versus 7 PyPI and 4 npm rows on staging. A fresh loader run recorded a pypistats `429`. Package discovery and statistics had been collapsing transient failures to `null`, and the route then cached that partial snapshot. Josh approved explicit registry declarations, bounded retries, required declared-package statistics, and stale-while-revalidate as a corrective follow-up.

## Commands

| Purpose               | Command                                             | Expected result                                            |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| Format                | `pnpm format`                                       | exits 0                                                    |
| Lint                  | `pnpm lint`                                         | exits 0                                                    |
| Type and Astro checks | `pnpm check`                                        | exits 0                                                    |
| Tests                 | `pnpm test`                                         | all tests pass                                             |
| Production build      | `pnpm build`                                        | exits 0                                                    |
| Production dry run    | `pnpm exec wrangler deploy --dry-run`               | exits 0                                                    |
| Staging build         | `CLOUDFLARE_ENV=staging pnpm build`                 | generated Wrangler config targets `joshthomas-dev-staging` |
| Staging dry run       | `pnpm exec wrangler deploy --dry-run --env staging` | exits 0 against the staging artifact                       |
| Staging deploy        | `pnpm exec wrangler deploy --env staging`           | deploys only `joshthomas-dev-staging`                      |

Load the repository's Wrangler guidance before deployment commands. Confirm `wrangler whoami` points at the intended account. Never place the GitHub token in a command or committed config.

## Scope

In scope:

- `CLAUDE.md` project architecture and deployment notes
- `astro.config.ts`
- `wrangler.jsonc`
- `src/lib/server/projects.ts`
- add `src/lib/server/projects.test.ts`
- `src/pages/projects/index.astro`
- `scripts/check-built-site.mjs`
- `plans/astro-framework-consolidation/006-use-astro-route-cache.md`
- `plans/astro-framework-consolidation/README.md` for status and execution notes

Out of scope:

- changing project selection, sorting, displayed fields, or package-stat formulas
- adding a user-facing failure page or changing failure responses beyond letting required errors escape
- caching data for another route or consumer
- keeping the old memory or Cache API layer as a fallback
- adding KV, Durable Objects, or another cache product
- deploying to the production Worker before staging passes
- preserving query-string variants of `/projects/`; they have no product meaning
- removing `@ts-nocheck` from the whole legacy aggregation module

## Steps

### Step 1: Prove required and optional upstream behavior

Test the public default `getProjects()` export with an ordinary static import. Stub global `fetch` with deterministic responses by URL; do not export private helpers or recreate cache-era module loading in tests.

Cover these contracts:

1. a personal project-list failure rejects;
2. malformed personal and organization repository records reject;
3. malformed contributor-rank records reject;
4. a declared package-stat provider failure retries, then rejects before cache opt-in;
5. contribution failure returns projects with an empty contribution list;
6. successful data keeps star sorting and omits contributions without `merged_at`.

Keep fixtures small: one or two repositories and only the provider responses needed to reach each branch. Assert caller-visible data, not request order or helper choreography. Restore the fetch stub after each test. Do not reset modules, dynamically import the loader, or stub `caches`; the loader has no module cache.

Verify: `pnpm test` passes.

### Step 2: Add the Astro Cloudflare cache provider

Import `cacheCloudflare` from `@astrojs/cloudflare/cache` and configure it as Astro's route-cache provider in `astro.config.ts`. Do not add a broad route rule. The projects route will opt in after data loading succeeds.

Add a Wrangler `staging` environment with the distinct Worker name `joshthomas-dev-staging`. Do not copy secret values into `wrangler.jsonc`; the token is optional for provider proof. Keep the production Worker name unchanged.

Verify:

- `pnpm check`
- `pnpm build`
- `pnpm exec wrangler deploy --dry-run`

All exit 0, and generated deployment config shows the route cache enabled.

### Step 3: Remove per-upstream cache mechanics and make required failure honest

In `src/lib/server/projects.ts`, delete:

- `memoryCache`;
- `maxCacheAge`;
- Cache API lookup and write code;
- cache-key construction;
- the unsupported `duration` option and every `duration: '1d'` value;
- the final catch that turns all failures into zeroed successful data.

Keep one small fetch-and-decode helper if it removes repeated status checking and JSON/text handling. It must call native `fetch` directly and have no hidden cache or runtime fallback.

Make GitHub calls that determine the project set required: the personal project list, work-organization repository lists, and contributor-rank checks. Validate both array shape and the repository or contributor fields used by the loader. Network, authentication, rate-limit, malformed response, wrong JSON shape, and non-2xx failures at those boundaries must escape `getProjects()`.

Delete the comprehensive totals request and result because `/projects/`, the sole production caller, never reads them. Return `{ projects, contributions }` rather than a merged tagged item list. Remove internal `type` tags and the redundant `merged` flag; drop each contribution without `merged_at` while mapping it.

Keep languages, release downloads, and contributions optional, with catches local to the named enrichment. Store published PyPI, npm, crates.io, and Zed identities as explicit repository data. Fetch every declared package's statistics as required data after bounded retries for network errors, 429, and 5xx responses. Honor `Retry-After` up to the 30-second per-retry budget; when a provider asks for longer, reject without sending another request early. If retries fail or a provider returns malformed data, let the error escape before route cache opt-in. Contributions may degrade only after projects remain valid; give that choice a clear helper or result name.

Do not add a broad `required` boolean that every call site must remember. Prefer separate required and optional boundary helpers or local catches around named optional work.

Verify:

- all `projects.test.ts` contracts pass;
- `rg -n "memoryCache|maxCacheAge|caches\.default|duration: '1d'" src/lib/server/projects.ts` returns no matches;
- `pnpm check` exits 0.

### Step 4: Opt in only after successful canonical-route data

In `src/pages/projects/index.astro`:

- keep `prerender = false`;
- redirect any request with a query string to canonical `/projects/` before loading data, so arbitrary queries cannot bypass the page cache;
- await `getProjects()`;
- only after it resolves, call `Astro.cache.set({ maxAge: 86400, swr: 604800 })`;
- consume the returned `projects` and `contributions` arrays directly;
- keep successful markup unchanged.

Do not catch required failures in the page. If an initial load rejects, control leaves before cache opt-in and Astro returns its normal uncached server error. During later refresh failures, Cloudflare may keep serving the last complete response within Astro's stale-while-revalidate window. Do not call `Astro.cache.set(false)`, add a 503 layout, or create a second stale-data path.

Keep build evidence at public boundaries: assert that `/projects/` has no static HTML, then use the staging Worker response for the on-demand route. Do not parse generated server bundle text. Also check one article body and its matching feed CDATA body plus representative design-system swatch, caption, alert, and footnote output.

Verify: `pnpm check`, `pnpm test`, and `pnpm build` all pass.

### Step 5: Pass the staging Worker gate

Before deployment, run `pnpm exec wrangler whoami` and confirm the account with the user. Build for the target environment before asking Wrangler to deploy it:

1. `CLOUDFLARE_ENV=staging pnpm build`
2. inspect `dist/server/wrangler.json` and confirm the Worker name is `joshthomas-dev-staging` and `targetEnvironment` is `staging`;
3. `pnpm exec wrangler deploy --dry-run --env staging`;
4. `pnpm exec wrangler deploy --env staging`.

Do not deploy a plain production-targeted `pnpm build` with only a deploy-time `--env staging` flag.

Against the final staging Worker, prove:

1. deployment accepts the Worker cache configuration;
2. the first canonical `/projects/` request is a miss and a repeated request is a hit;
3. the successful response carries the intended 24-hour freshness and seven-day stale-while-revalidate directives;
4. the hit bypasses the Worker and upstream API fan-out;
5. `/projects/?probe=1` redirects to `/projects/` and does not create another cached page.

Use logs and response headers available from the final candidate. Do not add a temporary failure switch or wait for real expiry. Declared-package and refresh failure behavior belongs to deterministic local tests plus the source-level cache-admission order.

If the account rejects the provider, STOP. Do not land the config with the old cache as fallback.

#### Staging execution evidence

On 2026-07-22, Wrangler authenticated as the expected `josh@joshthomas.dev` account and deployed only `joshthomas-dev-staging`. The registry-completeness candidate is version `9b4357fe-419f-47a4-8347-c5a847b9e645`.

- The deployed config accepted `cache.enabled: true` and the provider module.
- The first canonical `/projects/` request reached the Worker, returned `200` with `Cf-Cache-Status: MISS`, and rendered all 13 declared PyPI projects, 7 npm projects, the 8-crate `kbd` workspace, and the declared Zed extension. No declared project lacked its registry row.
- The next canonical request returned `Cf-Cache-Status: HIT` with `Age: 42`; the active tail recorded no second Worker request, proving the hit bypassed the Worker and upstream fan-out.
- Source and generated provider evidence set `maxAge: 86400` and `swr: 604800` as `Cloudflare-CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=604800`. Cloudflare consumes and strips that provider header before returning the response; live `HIT` and `Age` prove cache admission.
- `/projects/?probe=registry-completeness` returned `308`, `Location: /projects/`, and `Cf-Cache-Status: BYPASS`, so the query variant did not enter the page cache.
- The staging secret list contains only `GITHUB_TOKEN`; no value appears in source, config, commands, or this note.

### Step 6: Run final checks and inspect the diff

Run:

- `pnpm format`
- `pnpm lint`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `pnpm exec wrangler deploy --dry-run`
- `rg -n "memoryCache|maxCacheAge|caches\.default|duration: '1d'" src/lib/server/projects.ts` returns no matches

Inspect `jj diff` and confirm no secret, old cache path, compatibility fallback, or debug logging remains. Production deployment is a separate user-approved action.

## Test plan

Local tests use controlled global `fetch` responses through the public `getProjects()` seam. They prove required rejection, record validation, declared package identity, transient retries with `Retry-After`, optional contribution degradation, successful sorting, and merged-contribution filtering. The build checks representative rendered content and proves Astro's cache interface compiles into the Cloudflare Worker. Staging proves complete registry rows, provider availability, cache headers, hit behavior, upstream bypass, and query canonicalization.

Record the staging Worker version and the five observations above in a short execution note. Do not record token values or full authenticated responses.

## Done criteria

- [x] Astro's Cloudflare provider is the only production cache layer.
- [x] Per-upstream memory and Cache API code is deleted.
- [x] Unsupported duration options are deleted.
- [x] Required failures and malformed repository or contributor records reject before cache opt-in.
- [x] Declared package identities are explicit, and their statistics reject after bounded network, 429, and 5xx retries that respect `Retry-After`.
- [x] Optional language, release-download, and contribution failures retain otherwise useful project data.
- [x] The sole consumer receives direct project and contribution arrays with no totals, tags, or merged flag.
- [x] Contributions without `merged_at` are omitted before the route renders them.
- [x] Only canonical complete `/projects/` responses opt into 24-hour freshness and seven-day stale-while-revalidate.
- [x] The staging-targeted build names `joshthomas-dev-staging` and records `targetEnvironment: "staging"`.
- [x] The staging Worker renders every declared registry row and proves provider availability, miss/hit, directive, upstream bypass, and query redirect.
- [x] No temporary test control or secret remains.
- [x] `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and Wrangler dry run pass.
- [x] Built-site checks use public output contracts and cover representative article, feed, and design-system output.
- [x] Source changes stay within the in-scope list.

## STOP conditions

Stop if:

- the intended Cloudflare account cannot use the route-cache provider;
- the staging build does not name `joshthomas-dev-staging` with `targetEnvironment: "staging"`;
- staging cannot be isolated from the production Worker;
- a cache hit still runs the Worker or upstream fetches;
- query-string requests enter separate cache entries instead of redirecting;
- required and optional upstream calls cannot be separated through the public loader contract;
- deterministic tests require exporting private helpers or adding a permanent fetch abstraction;
- local or staging checks require a permanent second cache path;
- the work requires production deployment to gather evidence.

The handback must include the failed local or staging observation, the desired behavior, and the open question. Do not choose a fallback cache.

## Maintenance notes

`/projects/` owns one public HTML snapshot with 24-hour freshness and a seven-day stale-while-revalidate window. Repository-to-registry package declarations must change when a listed project publishes, renames, or retires a package. If another consumer later needs raw project data or a different TTL, that creates a new seam and needs a fresh cache design.
