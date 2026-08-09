# Roadmap — feature status against the product brief

Legend: **Done** / **In Progress** / **Planned** / **Blocked** (needs a
credential or decision this session couldn't make).

This file is intentionally granular and maps to the numbered sections of the
original product brief so nothing gets silently dropped. Update it in the
same change as any feature work.

## Deployment
- GitHub — **Done**: github.com/Gariyuuu/latticework (public, `main`)
- Vercel — **Done**: **https://latticework-gilt.vercel.app** (production,
  GitHub-connected for auto-deploy-on-push, SSO deployment protection
  disabled). Neon Postgres + Clerk both provisioned via the Vercel
  Marketplace (`vercel integration add neon|clerk`) and connected to the
  project — all env vars live in Production/Preview/Development. DB
  schema pushed (`npm run db:push`) and content seeded
  (`npm run content:sync` against the live DB — 99 skills, 7 built).
  Clerk is currently a **development-mode** instance (free marketplace
  default) — fine for now, but note this if real user signups/production
  auth guarantees are ever needed; upgrading is a Clerk dashboard step,
  not a code change.

## Foundation
- Next.js + TS strict + Tailwind + shadcn app shell — **Done**
- Design tokens (dark-first palette, motion rules) — **Done**
- Neon + Drizzle schema (full model set from spec §52) — **Done**, live
  DB provisioned and pushed (see "Deployment" above)
- Clerk auth wiring (sign-in/up, middleware, protected routes) — **Done**,
  live keys provisioned and working in production (see "Deployment"
  above). Note: `clerkMiddleware()` in `src/proxy.ts` crashes with a
  generic 500 on EVERY route if Clerk keys are missing in a deployed
  (non-dev) environment — Clerk's "keyless mode" only works with
  `next dev` locally, not on Vercel. Always confirm Clerk keys are set
  before/immediately after any fresh Vercel deploy of this repo.
- Content architecture (MDX + block components + loader/validator) — **Done**
  (`npm run content:sync` was previously unrunnable outside Next's webpack
  build — it transitively imported `"server-only"`, which throws
  unconditionally under plain `tsx`. Fixed by splitting `loader.ts`/
  `achievements.ts` into a guard-free core the script imports directly,
  keeping the guard on the path Next server code uses — see
  `src/lib/content/loader.ts` + `loader-core.ts`.)
- Skill graph data model + Explore page — **Done**

## Learning engine
- Lesson rendering (Explanation/CodeExample/Exercise/Quiz/Checkpoint) — **Done**
- Exercise validation (write-code via sandbox test cases, multiple-choice) — **Done**
- XP ledger + level derivation — **Done**
- Mastery/skill-rating engine (weighted formula from LEARNING_ENGINE.md) — **Done**
- Fill-blank, fix-bug, predict-output, code-ordering, refactor, performance,
  CLI-simulation, git-simulation exercise *types* — **Planned** (schema
  supports arbitrary `exerciseType`; only write-code + multiple-choice have
  UI + validators implemented)

## Code engine
- Monaco editor (lazy-loaded) — **Done**
- Sandbox provider abstraction — **Done**
- Pyodide (Python) provider — **Done**
- Pyodide package-loading (`RunOptions.packages`, e.g. `["numpy"]`) — **Done**
  (`content/<skill>/exercises/*.json` can declare `"packages": [...]`;
  `<CodeExample packages={[...]}>` for live "Try it" snippets. Loaded
  packages are cached per browser session — see
  `src/lib/sandbox/providers/pyodide-provider.ts`. Verified end-to-end by
  running the real `pyodide` npm package — same version as the CDN build,
  0.26.4 — in Node against every NumPy exercise and CodeExample before
  writing content, not just assumed from docs.)
- sql.js (SQL) provider — **Planned**
- JS/TS sandboxed Worker provider — **Planned**
- Server-side sandbox for compiled languages (C++/Java/Go/Rust/…) — **Blocked**
  (requires a container/E2B/Judge0-style provider decision + credentials;
  architecture in `docs/SECURITY.md` is ready for it)

## Roadmap engine
- Career tracks + skill dependency data (12 tracks from the brief) — **Done**
- Dependency-ordered roadmap generation (`lib/roadmap`) — **Done**
- Visual interactive skill graph page — **Done** (static layout; drag/pan
  polish is Planned)
- Diagnostic assessment (adaptive-ish, per-topic level detection) — **In Progress**
  (data model + scoring done; only a Python question bank is seeded)

## Advanced learning
- Notebook mode — **Planned**
- Bug Hunt — **Planned**
- Code Detective — **Planned**
- Algorithm step-through visualizations — **Planned**
- Spaced repetition engine (`lib/srs`) — **Done**
- Daily Forge generation — **In Progress** (generation logic done; UI is
  minimal)

## Projects
- Project data model + milestone tracking — **Done**
- Project detail pages with starter files/tests — **Planned**
- Capstones per career track — **Planned**

## Interview prep
- Data model (Assessment/AssessmentAttempt reused) — **Done**
- Practice/Timed/Mock UI per category — **Planned**

## AI
- Tutor provider abstraction (OpenAI-compatible interface) — **Done**
- Hint ladder (4 levels + reveal, hint usage tracked) — **Done** (UI works
  with a stub "not configured" response until a provider key is set)
- Live model wired in — **Blocked** (no AI provider key in this
  environment; add one to `.env.example`'s `AI_PROVIDER_API_KEY` to enable)
- Error explanation — **Planned**

## Polish
- Achievements (catalog + unlock logic) — **In Progress** (catalog + a
  handful of real triggers done; full list from brief §29 not all wired)
- Analytics dashboard — **In Progress** (basic charts on Progress page)
- Mobile responsiveness — **In Progress** (shell + dashboard responsive;
  full sweep pending)
- Accessibility pass — **In Progress** (Radix gives keyboard/focus for free;
  explicit `prefers-reduced-motion` + contrast audit pending)
- Additional themes (OLED/Midnight/Terminal/Cyber/Solarized) — **Planned**
  (Dark/Light done)
- Changelog page (`/changelog`) — **Planned**
- Admin content system (§69) — **Planned**

## Content coverage
- Fully built (real lessons + exercises): Python (13/14 modules — every
  module except `files`) — **Done** except `files`, which is deliberately
  deferred (see note below), not forgotten
- Fully built: Data Structures (7/7 modules — arrays-lists, stacks-queues,
  hash-tables, trees-bsts, heaps, graphs, tries) — **Done**
- Fully built: Algorithms (6/6 modules — sorting, searching, recursion,
  dynamic-programming, graph-algorithms, greedy) — **Done**
- Fully built: NumPy (5/5 modules — arrays, vectorization, broadcasting,
  indexing-slicing, linear-algebra-ops) — **Done**
- Fully built: Pandas (6/6 modules — series-dataframes,
  selection-filtering, groupby, joins-merges, missing-data, time-series)
  — **Done**
- Fully built: Probability (4/4 modules — random-variables,
  distributions, bayes-theorem, expectation-variance) — **Done** (needs
  no Pyodide packages at all — `math`/`statistics` stdlib only)
- Fully built: Statistics (4/4 modules — hypothesis-testing,
  confidence-intervals, regression, a-b-testing) — **Done** (also
  stdlib-only — z-tests via `statistics.NormalDist().cdf` rather than a
  t-distribution, since Python's stdlib has no t-distribution CDF/PPF;
  OLS regression implemented from the slope/intercept formulas directly,
  no scipy needed)
- SQL, Git, Linux, PyTorch, C++ — **Planned** (metadata skeletons done as
  part of the wider ~70-90 skill catalog; module content not yet
  authored). SQL specifically also needs the sql.js sandbox provider
  (see "Code engine" above) before its exercises can execute — Git/Linux
  need the CLI-simulation exercise type, which isn't implemented yet
  either (see "Learning engine" above).
- Remaining ~51-71 technologies from the brief — **Done** as metadata-only
  skeletons (appear correctly in graph/Explore/roadmap, no lesson content)

`python/modules/files.mdx` is the one remaining Python module not built.
It was originally deferred because file I/O exercises depend on Pyodide's
virtual filesystem behaving as documented, which seemed unverifiable
without a real browser. That blocker no longer fully applies: the
`pyodide` npm package (same version as the CDN build) can run headless in
Node and was used to verify every NumPy exercise below — the same
technique could verify `files.mdx` too. It's just not built yet, not
still blocked.

NumPy was built by first adding `packages` support to
`RunOptions`/`PyodideProvider`/the exercise schema (`content:sync` alone
can't validate that packages actually load and behave correctly — schema
validation is orthogonal to runtime behavior), then verifying the whole
pipeline — `loadPackage`, every exercise's reference solution, and every
`CodeExample` "Try it" snippet — by running the real `pyodide` 0.26.4 npm
package (identical to the CDN version the app loads) headless in Node
before writing any lesson content. That caught two real inaccuracies in
hand-written prose: a claimed `int64` dtype that's actually `int32` on
Pyodide's WASM32 build (a genuine desktop-vs-browser platform
difference, not a typo), and an arithmetic slip in a portfolio-return
example (`0.041` written, `0.036` actual). Both fixed before commit.
**Lesson for future content using new packages:** verifying "this Python
logic is correct" via local CPython is not the same as verifying "this
behaves identically in Pyodide" — when in doubt, run it through the real
`pyodide` npm package via Node, which is the closest headless proxy to
the actual browser runtime available without a browser.

Pandas followed immediately after NumPy using the same verification
technique (`packages: ["pandas"]`, which pulls in pytz/python-dateutil/
six automatically via Pyodide's dependency resolution — no extra config
needed). Every exercise reference solution AND every illustrative code
snippet in every lesson's prose (16 snippets, not just the 12 graded
exercises) was run through the real `pyodide` npm package with pandas
2.2.0 loaded before writing content. That caught one genuine pandas
gotcha that would've been wrong by guesswork: `pd.DataFrame({'x': [None,
None]}).fillna(5)` returns plain ints `[5, 5]`, not floats — because a
column of all-`None` gets inferred as `object` dtype rather than
`float64`, so no numeric upcast happens (this exact behavior is also
flagged as deprecated/changing in a future pandas version per a
`FutureWarning`, so the test case was written to avoid that specific
all-`None` edge case rather than lock in soon-to-change behavior). Also
caught one purely cosmetic issue: a hardcoded `DatetimeIndex` repr in
prose didn't match pandas' actual line-wrapping, fixed to not assert a
specific wrap point.

Probability needed no new infrastructure (`math`/`statistics` are always
available, no `packages` declaration needed) — but writing gradeable
exercises for a probability topic took real care: grading is exact
string comparison, so any exercise using actual randomness
(`random.random()` etc. without a fixed seed) would be ungradeable —
every exercise here is a deterministic closed-form computation (a PMF
from given counts, a binomial/normal formula, Bayes' theorem, sample
variance from given data) rather than a simulation. Verification via
local CPython caught real content bugs in hand-written prose, same as
NumPy/Pandas did: `sum([1/6]*6)` prints `0.9999999999999999`, not `1.0`
(float summation error — the CodeExample was fixed to round before
printing); `statistics.mean([2,4,4,4,5,5,7,9])` returns the int `5`, not
`5.0` (the module computes exactly via `Fraction` internally); and
`round(x, 4)`'s `str()` drops trailing zeros — `round(0.24197, 4)` prints
`0.242`, not `0.2420`, which means every expected value in every exercise
JSON file had to come from an actual verified print, never hand-typed
formatting. That last one is a general float-formatting gotcha, not
Pyodide-specific — worth remembering for any future numeric content
regardless of which runtime it targets.

Statistics followed Probability directly, using the same closed-form
(no randomness), stdlib-only, verify-every-print approach — this time
with no new content bugs caught, likely because the earlier gotchas
(trailing-zero `str()`, exact rounding) were already internalized by
then. One real design constraint worth noting for future stats content:
Python's stdlib has no t-distribution CDF, so `hypothesis-testing` uses
a z-test (`statistics.NormalDist`) rather than the more commonly-taught
t-test — accurate for large samples, a deliberate simplification for
small ones. A true t-test would need `scipy.stats.t`, which IS available
via the same Pyodide package-loading infra (`packages: ["scipy"]`) if a
future session wants to add it.

Data Structures and Algorithms were picked as the next tracks (then the
rest of Python, then NumPy once package-loading was built, then Pandas,
then Probability, then Statistics) because each only needed what already
existed at the time — no new infrastructure for most of them, one real
infrastructure addition for NumPy that Pandas also rode on. All 98
exercises across all seven tracks were verified correct (against
reference CPython for the pure-language, Probability, and Statistics
tracks, against the real `pyodide` npm package for NumPy/Pandas), and
every one of the resulting 45 built lesson pages was fetched from a live
dev server to confirm it actually renders, before being committed to
content.

Two instances of the same MDX bug were caught this way: a
backslash-escaped quote inside a JSX attribute (e.g.
`caption="...\"#\"..."`) — JSX attributes don't support backslash-
escaping, so it silently breaks MDX compilation for that one lesson (500
on page load, with no typecheck/lint/build error). Found in the new
`data-structures/modules/tries.mdx`, and — more notably — in the
pre-existing `python/modules/functions.mdx`, which had apparently never
been dev-server-rendered since it was first written. Both are fixed now.
**Rule for all future content:** never backslash-escape a quote inside a
JSX attribute string; rephrase to avoid embedding the quote character
instead. `content:sync` only validates frontmatter/JSON schema, not MDX
body syntax — it will NOT catch this class of bug. Always load every new
or edited lesson page in a running dev server before calling content
done.

Next content candidates (SQL/NumPy/Pandas/Probability/Statistics) all
need new infrastructure first — either the sql.js sandbox provider, or
Pyodide package-loading support (`pyodide.loadPackage(['numpy'])`) which
isn't implemented in `src/lib/sandbox/providers/pyodide-provider.ts` yet.

## Explicitly out of scope for MVP (per PRODUCT_SPEC.md, not silently cut)
- Large social features (public profiles, study groups, friends,
  competitions) — architected for, not built.
- Real trading/brokerage integration for quant material.
- Accredited certification claims.
