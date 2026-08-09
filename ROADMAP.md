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
  (`npm run content:sync` against the live DB — 99 skills, 30 built;
  re-run after any content change and redeploy, both steps are manual).
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
- Exercise validation (write-code via sandbox test cases, multiple-choice,
  **sql-query**) — **Done**. sql-query exercises define `setupSql` +
  `expectedColumns`/`expectedRows` (row order matters — every reference
  query ends in `ORDER BY` for determinism) in a discriminated-union test
  case schema (`writeCodeTestCaseFileSchema` |
  `sqlQueryTestCaseFileSchema` in `src/lib/content/schema.ts`); grading
  runs the student's query against a fresh sql.js database seeded from
  `setupSql` and deep-compares the last result set. See
  `src/components/lesson/exercise.tsx`.
- Fill-blank, fix-bug, predict-output, code-ordering, refactor, performance,
  CLI-simulation, git-simulation exercise *types* — **Planned** (schema
  supports arbitrary `exerciseType`; only write-code + multiple-choice +
  sql-query have UI + validators implemented)

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
- sql.js (SQL) provider — **Done** (`src/lib/sandbox/providers/sql-provider.ts`,
  sql-wasm.js 1.10.3 from CDN, same lazy-load-on-first-use pattern as
  Pyodide. `RunOptions.setupSql` runs once against a fresh in-memory
  database before the student's query. Verified end-to-end against the
  real `sql.js` npm package in Node — including the zero-row-result edge
  case, where `db.exec()` returns `[]` entirely rather than one
  empty-values result set — before writing any SQL content or grading
  logic around it.)
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
- Fully built (real lessons + exercises): Python (14/14 modules) — **Done**
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
- Fully built: SQL (7/10 modules — select-where, group-by-aggregates,
  joins, subqueries, ctes, window-functions, interview-patterns) —
  **In Progress**. Runs against a real in-browser SQLite (sql.js) seeded
  per-exercise via `setupSql`; every reference query verified against
  the real `sql.js` npm package before being committed (see note below;
  window-functions specifically needed one extra check — confirming
  sql.js's bundled SQLite build actually includes window-function
  support at all, since some minimal WASM SQLite builds compile without
  it. It does.). Remaining 3 modules (indexes-query-plans,
  schema-design, transactions-isolation) are metadata-planned but
  **don't fit the current sql-query exercise shape** — that exercise
  type grades "does your SELECT return these exact rows," and none of
  these three topics are fundamentally about a SELECT's row output:
  indexes/query-plans is about `EXPLAIN QUERY PLAN` text, schema-design
  is about DDL/normalization choices, transactions-isolation needs real
  concurrent access that a single embedded per-attempt sql.js instance
  can't simulate. Each would need its own exercise type (or at minimum
  a different grading mode) — not written as a stopgap sql-query
  exercise that wouldn't actually test the concept.
- Fully built: Linear Algebra (2/3 modules — vectors-matrices,
  eigenvalues) — **In Progress**. First quant/math track built —
  deliberately taught from first principles in plain Python (dot
  product, magnitude, determinant, 2×2 eigenvalues via the trace/
  determinant formula), not via NumPy, to keep it conceptually distinct
  from `numpy/linear-algebra-ops` (same underlying operations, but that
  course teaches "use the library efficiently," this one teaches "what
  is actually happening"). `matrix-decompositions` is left planned on
  purpose — LU/QR/SVD aren't reasonably hand-implementable the way
  dot-product/eigenvalues are; that module needs NumPy (`packages:
  ["numpy"]`, infra already proven), a deliberate exception to this
  track's "no NumPy" rule, not an oversight.
- Fully built: Monte Carlo Simulation (3/3 modules — random-sampling,
  simulating-stock-paths, variance-reduction) — **Done**. First track
  needing genuine randomness in graded content — made gradeable via
  `random.seed()`, after first verifying `random.random()`/`.gauss()`/
  `.choices()` produce bit-identical output between Pyodide's WASM build
  and local CPython for the same seed (same Mersenne Twister C
  implementation compiled either way — confirmed, not assumed).
  `simulating-stock-paths` implements real (simplified) GBM path
  simulation and Monte Carlo European call option pricing;
  `variance-reduction` implements antithetic variates.
- Fully built: Stochastic Processes Fundamentals (3/3 modules —
  random-walks, brownian-motion-intuition, markov-chains) — **Done**.
  Extends the seeded-randomness technique to time-evolving processes.
  The markov-chains stationary-distribution exercise's Monte Carlo
  estimate (0.8334 at n=10,000) was cross-checked against the true
  balance-equation value (5/6 ≈ 0.8333) as an extra correctness signal
  beyond just "the code ran."
- Fully built: Calculus Review (3/3 modules — derivatives, gradients,
  chain-rule-for-backprop) — **Done**. Derivatives/gradients computed
  numerically (central-difference), matching real gradient-checking
  practice; chain rule computed analytically and cross-checked against
  the numerical estimate in the lesson prose. `gradients`'s
  `gradient_magnitude` exercise deliberately reuses the exact
  `magnitude()` computation from `linear-algebra/vectors-matrices` —
  the gradient IS a vector, so vector operations apply directly.
  Satisfies Optimization's prerequisite (`calculus-review`) — that's
  the natural next track.
- Fully built: Optimization (3/3 — gradient-descent, convexity-intuition,
  constrained-optimization), Numerical Methods (3/3 — root-finding,
  numerical-integration, solving-linear-systems), Complexity Analysis
  (3/3 — big-o, time-vs-space, amortized-analysis), Functional
  Programming (3/3 — pure-functions, immutability, map-filter-reduce),
  OOP (4/4 — classes-objects, inheritance, polymorphism, encapsulation),
  Design Patterns (3/3 — creational, structural, behavioral), Feature
  Engineering (3/3 — encoding, scaling, interaction-features) — all
  **Done**. 22 modules, 44 exercises in one batch. Complexity Analysis
  measures growth by counting real operations across inputs (not
  wall-clock timing, which wouldn't be deterministic enough to grade).
  OOP/Design Patterns build a running Shape/Inventory/BankAccount
  example across all 7 modules. Feature Engineering verified against
  the real pandas package via Pyodide-in-Node, same discipline as every
  other pandas-dependent track. Optimization builds directly on Calculus
  Review's derivative/gradient functions.
- Fully built: Financial Markets (3/3 — asset-classes, order-types,
  market-structure) — **Done**. Fully built: Quant Finance Fundamentals
  (5/9 — options-basics, black-scholes-intuition, greeks-intuition,
  portfolio-theory, backtesting) — **In Progress**. Black-Scholes
  verified against the well-known textbook reference (S=K=100, T=1,
  r=5%, sigma=20% → ~10.45). Greeks reuse Calculus Review's exact
  central-difference technique, applied to Black-Scholes — using an
  UNROUNDED price helper internally (a rounding-amplification bug would
  otherwise corrupt the finite-difference estimate if the already-
  rounded `black_scholes_call` were reused directly for the nudge-and-
  compare). Remaining 4 modules (derivatives-basics, risk,
  factor-models, market-microstructure-basics) left planned — same
  don't-force-fit principle as SQL's unbuilt modules.
- Fully built: Model Evaluation (3/3 — metrics, cross-validation,
  bias-variance), Debugging (3/3 — reading-stack-traces, bisection,
  tooling), Time Series (4/4 — stationarity, autocorrelation,
  arima-intuition, rolling-windows) — all **Done**. Debugging's
  `bisection` module reuses the O(log n) idea from Complexity Analysis,
  applied to finding a regression across a commit history (the `git
  bisect` algorithm). Time Series is deliberately distinct from
  `pandas/time-series` — this course is the STATISTICAL angle
  (stationarity, ACF, AR models), pandas' module is the date-handling/
  API angle on the same subject, same differentiation pattern as
  Linear Algebra vs. `numpy/linear-algebra-ops`.
- Fully built: HTTP (3/3 — requests-responses, headers, caching),
  Authentication (2/3 — sessions-vs-tokens, password-storage;
  oauth-basics left planned, pure protocol-flow with no code-testable
  angle), Clean Code (3/3 — naming, functions, code-smells), Testing
  (2/4 — mocking, test-design; unit-tests/integration-tests left planned
  since they'd mostly restate `python/testing`'s ground rather than add
  a genuinely distinct angle), Database Design (2/3 — normalization,
  constraints; er-modeling left planned — pure diagramming, no code
  angle), Data Modeling (2/2 — star-snowflake-schema,
  slowly-changing-dimensions) — **Done**. This batch is the first pass
  at general SWE/CS topics beyond math/quant — normalization and SCD
  Type 2 represent DB concepts as checkable Python data structures
  (functional dependencies as tuples, dimension rows as dicts) rather
  than skipping them for being "conceptual." Reaches **30/99 skills
  built**, the number requested for this session's content push.
- Git, Linux, PyTorch, C++ — **Planned** (metadata skeletons done as part
  of the wider ~70-90 skill catalog; module content not yet authored).
  Git/Linux need the CLI-simulation exercise type, which isn't
  implemented yet (see "Learning engine" above); PyTorch/C++ need their
  own execution infra decisions.
- Remaining ~36-56 technologies from the brief — **Done** as metadata-only
  skeletons (appear correctly in graph/Explore/roadmap, no lesson content)

`python/modules/files.mdx` (file I/O) was originally deferred because it
depends on Pyodide's virtual filesystem behaving as documented, which
seemed unverifiable without a real browser — that blocker turned out not
to hold: the `pyodide` npm package (same version as the CDN build) runs
headless in Node and verified `write_and_read`/`append_lines` exactly as
designed (`with open(path, "w")` etc. behave identically to desktop
CPython for basic read/write/append against Pyodide's in-memory FS). Now
built, closing Python to 14/14.

**sql.js provider, built this session:** added `SqlProvider`
(`src/lib/sandbox/providers/sql-provider.ts`, sql-wasm.js from CDN,
same lazy-load pattern as Pyodide), a `sql-query` branch in the `Exercise`
component (grades by running the student's query against a fresh
database seeded from `setupSql`, then deep-comparing the last result
set's columns/rows against `expectedColumns`/`expectedRows`), and a
discriminated-union test-case schema (`write-code` | `sql-query`) in
`src/lib/content/schema.ts`. Every reference query for all 6 exercises
was run against the real `sql.js` 1.10.3 npm package in Node first — this
caught the zero-row-result edge case (`db.exec()` returns `[]` entirely,
not one result set with empty `values`, when a query matches zero rows)
before it could become a grading bug. Row order matters for exact-match
grading, so every reference query ends in `ORDER BY`; ties are avoided by
choosing seed data with no duplicate sort keys (see the sales-department
employee count in `group-by-aggregates-ex2` — deliberately 3 vs 2, not
2 vs 2, to avoid needing a secondary sort key).

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
