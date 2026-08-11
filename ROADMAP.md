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
- Fully built: REST APIs (4/4 — resources-verbs, status-codes,
  pagination, versioning) — **Done**. Reaches 31/99. Builds directly on
  HTTP's requests-responses/headers modules (same request/response
  vocabulary, now applied to API design specifically) — pagination and
  versioning exercises model request/response shapes as plain dicts and
  grade the resulting page slices / version-routing decisions.
- Fully built: Operating Systems (2/3 — virtual-memory, scheduling;
  processes-threads left planned — real concurrency/IPC isn't
  code-testably gradeable the way paging and scheduling algorithms are)
  — **Done**. Reaches 32/99. `virtual-memory`'s LRU-page-eviction
  exercise is deliberately framed as a systems-level angle (fixed-size
  physical frame count, page faults counted) distinct from Redis's LRU
  cache module — same eviction idea, different layer of the stack, same
  differentiation pattern used for Linear Algebra/NumPy and Time
  Series/pandas. `scheduling` implements round-robin and
  shortest-job-first CPU scheduling over a list of process burst times.
- Fully built: Redis (3/3 — data-structures, caching-patterns, pub-sub)
  — **Done**. Reaches 33/99. `data-structures`'s LRU cache exercise was
  redesigned mid-session after self-review caught a trivial always-True
  check (see "Errors and fixes" pattern below) — replaced with a
  `build_scenario()` helper producing a real eviction, verified via
  Python before committing.
- Fully built: MongoDB (2/3 — documents-collections,
  aggregation-pipeline; indexing left planned — index selection/
  query-plan tradeoffs aren't the right shape for a write-code exercise,
  same reasoning as SQL's indexes-query-plans) — **Done**. Reaches
  34/99. Documents modeled as plain Python dicts/lists (no real MongoDB
  driver dependency), aggregation pipeline stages implemented as
  composable functions over those structures.
- Fully built: Git (2/4 — commits-branches, merging-rebasing; 
  resolving-conflicts/remotes left planned — need the CLI-simulation
  exercise type, not implemented yet) — **Done**. Reaches 35/99. Models
  a commit history as a `{commit_id: parent_id}` dict and walks it —
  `commit_history`/`is_ancestor` reuse the exact parent-pointer-graph
  pattern from Debugging's bisection module; `find_merge_base` (the
  merge-base/lowest-common-ancestor algorithm real `git merge` and `git
  rebase` both depend on) builds one branch's full history into a set,
  then walks the other branch until it hits a member of that set.
- Fully built: Networking Basics (3/3 — tcp-ip, dns, load-balancing) —
  **Done**. Reaches **36/99 skills built**. `tcp-ip` implements CIDR
  subnet-membership checking via bitmasking; `dns` implements CNAME-chain
  resolution (same graph-walk shape as Git's commit_history) plus
  TTL-based resolver cache hit/miss logic, deliberately a different angle
  from HTTP's caching module (name resolution, not HTTP response
  caching); `load-balancing` implements round-robin and weighted
  round-robin request distribution.
- Fully built: Embeddings (3/3 — vector-representations,
  similarity-metrics, use-cases) — **Done**. Reaches 37/99.
  `similarity-metrics` reuses `magnitude()` from Linear Algebra's
  vectors-matrices module directly; `use-cases` implements brute-force
  top-k nearest-neighbor retrieval by cosine similarity — the core
  operation behind semantic search, recommendations, and RAG.
- Fully built: Compilers Fundamentals (3/3 — lexing-parsing, asts,
  codegen-intuition) — **Done**. Reaches 38/99. A genuinely coherent
  3-module arc: `lexing-parsing` tokenizes an arithmetic expression
  string, `asts` parses tokens into a precedence-respecting AST (nested
  tuples) and evaluates it recursively, `codegen-intuition` compiles
  that same AST to stack-machine bytecode (post-order traversal) and
  executes it on a small push/pop VM — mirroring how real bytecode
  interpreters (JVM, CPython, WASM) actually work.
- Fully built: WebSockets (3/3 — handshake, message-framing,
  reconnection-patterns) — **Done**. Reaches 39/99. `handshake`
  implements the real RFC 6455 `Sec-WebSocket-Accept` computation
  (SHA-1 + base64 of key+magic-GUID), verified against the RFC's own
  worked example (`dGhlIHNhbXBsZSBub25jZQ==` → `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`)
  — a genuine protocol implementation, not a simplified stand-in.
  `message-framing` builds a minimal unmasked text-frame header;
  grading uses `.hex()` on the resulting bytes to avoid bytes-repr
  ambiguity in the expected string.
- Fully built: Concurrency (3/3 — threads-locks, race-conditions,
  async-models) — **Done**. Reaches 40/99. Since this environment can't
  grade true parallel execution, `threads-locks` models an explicit
  interleaving schedule (`[(thread_id, step), ...]`) and simulates a
  read-modify-write race step by step — deterministic and gradeable
  while still illustrating a real lost-update bug. `async-models`'s
  cooperative round-robin scheduler reuses the exact queue-rotation
  pattern from Networking's load-balancing module, applied to task
  scheduling instead of request routing.
- Fully built: Kafka Fundamentals (3/3 — topics-partitions,
  producers-consumers, delivery-guarantees) — **Done**. Reaches
  **41/99 skills built**. `topics-partitions` deliberately uses a
  hand-rolled deterministic string hash instead of Python's built-in
  `hash()` — CPython randomizes `hash()` for strings by default (a
  security feature), which would make partition assignment
  non-reproducible across runs and defeat the whole exercise.
  `delivery-guarantees`'s idempotent-consumer dedup reuses the same
  set-membership pattern as Data Structures' hash-tables module.
- Fully built: ML Experiment Design (3/3 — hypotheses-baselines,
  ablations, tracking) — **Done**. Reaches 42/99.
- Fully built: Model Deployment (3/3 — serving-patterns,
  batch-vs-real-time, versioning) — **Done**. Reaches 43/99.
  `serving-patterns` implements real dynamic-batching logic (bounded by
  both max size and max wait); `versioning`'s canary-stage function
  always rolls back to 0% on a bad error rate regardless of current
  traffic percentage.
- Fully built: Distributed Systems Fundamentals (2/3 —
  consensus-basics, replication; cap-theorem left planned — pure
  classification/definitional, no code-testable angle, same reasoning
  as SQL's schema-design) — **Done**. Reaches 44/99. `replication`'s
  `w + r > n` quorum-overlap guarantee is derived and explained via the
  pigeonhole principle, not just stated.
- Fully built: LLM Fundamentals (3/4 — tokenization,
  attention-intuition, context-windows; `limitations` left planned —
  pure-conceptual, no code angle) — **Done**. Reaches 45/99.
  `attention-intuition` implements real scaled dot-product attention
  (softmax + weighted sum over values) from scratch, no numpy needed.
- Fully built: System Design Fundamentals (3/4 — scalability-basics,
  caching, load-balancing; trade-off-interviews left planned — pure
  interview-prep, no code angle) — **Done**. Reaches 46/99.
  `load-balancing` implements real consistent hashing with virtual
  nodes (using `hashlib.md5` for proper spread, unlike Kafka's simpler
  polynomial hash which only needed mod-N determinism, not full-range
  uniformity) — empirically verified that adding a 4th node to a
  3-node ring only remaps ~8% of 200 sample keys, vs. nearly 100% under
  naive `hash(key) % num_servers`. `caching` implements LFU eviction as
  a deliberate contrast to the LRU already covered twice (Redis, OS).
- Fully built: Memory Management (3/3 — stack-vs-heap,
  garbage-collection, manual-management-pitfalls) — **Done**. Reaches
  47/99. All three simulate a specific bug class (stack overflow,
  reference-counting's cycle blind spot, use-after-free/double-free)
  via explicit operation sequences, gradeable without needing a real C
  runtime.
- Fully built: RAG Fundamentals (3/3 — chunking-strategies,
  retrieval-pipeline, evaluation) — **Done**. Reaches 48/99. A
  deliberate capstone-style track: `retrieval-pipeline` directly reuses
  Embeddings' `cosine_similarity`; `chunking-strategies` is framed as a
  distinct angle from LLM Fundamentals' fixed-size sliding window
  (sentence-boundary-aware instead); `evaluation` applies
  precision@k/recall@k to ranked retrieval results.
- Fully built: CI/CD (3/3 — pipelines, automated-testing-gates,
  deployment-strategies) — **Done**. Reaches 49/99. `pipelines` reuses
  the topological-sort shape from Algorithms' graph-algorithms module,
  applied to build-stage dependencies; `deployment-strategies`'s
  rolling-deployment batching is deliberately framed as distinct from
  Model Deployment's percentage-based canary rollout.
- Fully built: ETL / ELT (3/3 — batch-pipelines, idempotency,
  orchestration-basics) — **Done**. Reaches **50/99 skills built** —
  the explicit target set for this session's "go to 50" push, **goal
  reached**. `idempotency`'s upsert-by-key approach is deliberately
  contrasted with Kafka's ID-based dedup (storage-operation idempotency
  vs. message-tracking idempotency); `orchestration-basics`'s live
  `ready_tasks` readiness check is framed as distinct from CI/CD's
  static `topological_order` (dynamic re-evaluation vs. one-shot
  ordering).
- Fully built: Vector Databases (2/3 — indexing-hnsw-ivf, hybrid-search;
  tradeoffs left planned, would duplicate RAG Fundamentals' evaluation
  module too closely) — **Done**. Reaches 51/99. `indexing-hnsw-ivf`
  implements a real IVF (inverted-file) approximate index: cluster
  vectors around centroids, then search only within the query's nearest
  cluster — a genuine speed/recall tradeoff, not just described in
  prose.
- Fully built: MLOps Fundamentals (2/3 — monitoring, retraining-triggers;
  `pipelines` left planned, would duplicate CI/CD's pipelines and
  ETL/ELT's orchestration-basics too closely) — **Done**. Reaches
  52/99. `monitoring`'s drift score standardizes a mean shift by the
  reference batch's own standard deviation, verified with a
  clearly-healthy example (0.1147) vs. a clearly-drifted one (8.1443).
- Fully built: Parallel Computing (2/3 — parallel-algorithms,
  simd-basics; gpu-parallelism-intuition left planned — occupancy/warp
  scheduling is too hardware-specific and definitional for a clean
  write-code exercise) — **Done**. Reaches 53/99. `parallel-algorithms`
  simulates pairwise tree reduction round-by-round (not just citing the
  O(log n) formula) to make the parallelism concrete.
- Fully built: Software Architecture (2/3 — layering,
  microservices-vs-monolith; trade-offs left planned, pure
  qualitative discussion) — **Done**. Reaches 54/99. `layering`
  validates a call graph against a strict one-directional dependency
  rule via simple list-position comparison.
- Fully built: Warehousing Concepts (2/2 — olap-vs-oltp,
  columnar-storage) — **Done**. Reaches 55/99. `columnar-storage`
  computes a genuinely striking real number: 400MB vs. 8MB bytes-read
  for the same single-column aggregate query over 1M rows, a 50x
  reduction purely from physical layout.
- Fully built: Prompt Engineering (2/3 — few-shot-examples,
  structured-output; instruction-design left planned, subjective/no
  code angle) — **Done**. Reaches 56/99. `few-shot-examples` directly
  reuses Embeddings' `cosine_similarity` for dynamic example selection.
- Fully built: OpenAI-style API Concepts (3/3 — chat-completions,
  streaming, function-tool-calling) — **Done**. Reaches 57/99. Models
  the API's request/response SHAPES as plain dicts (no real `openai`
  package dependency) — `function-tool-calling` correctly frames that
  the model only ever emits a structured request; the application code
  does all actual execution via `json.loads` + registry dispatch.
- Fully built: SQLite (2/2 — file-based-db-basics, when-to-use-it) —
  **Done**. Reaches 58/99. `file-based-db-basics` is a real `sql-query`
  exercise reusing the existing sql.js infra directly (sql.js IS SQLite
  compiled to WASM, so this needed zero new infrastructure) — verified
  against the real `sql.js` 1.10.3 npm package in Node before writing,
  same discipline as every SQL-course exercise.
- Fully built: Cloud Fundamentals (2/3 — cost-basics, managed-services
  [retitled to "Reserved vs. On-Demand Pricing" in its `.mdx`
  frontmatter to match its actual content — metadata.json's module
  title updated to match]; compute-storage-network left planned, too
  product-survey-y for a clean code angle) — **Done**. Reaches 59/99.
- Fully built: GraphQL Fundamentals (2/3 — resolvers, queries-mutations;
  schemas-types left planned, would duplicate Prompt Engineering's
  structured-output validation shape too closely) — **Done**. Reaches
  **60/99 skills built** — the explicit "go 60" target for this
  session's continued push, **goal reached**. `resolvers` implements
  real field-selection resolution over nested data (including lists),
  demonstrating GraphQL's core "client asks for exactly this shape"
  idea concretely rather than just describing it.
- Fully built: Scikit-learn (3/4 — estimators-api, train-test-split,
  pipelines; `model-evaluation` left planned, would duplicate the
  already-built Model Evaluation course's ground) — **Done**. Reaches
  61/99. Deliberately focuses on the API MECHANICS (fit/predict,
  reproducible splitting, leak-proof pipelines) rather than re-teaching
  statistical concepts Model Evaluation already covers — the same
  "use the library" vs. "understand the theory" split as NumPy vs.
  Linear Algebra.
- Fully built: SciPy (4/4 — optimization, statistics, linear-algebra,
  interpolation) — **Done**. Reaches 62/99. Deliberately closes gaps
  earlier from-scratch courses left open on record: `statistics`
  implements the REAL Student's t-test that Statistics' course couldn't
  (no t-distribution in the stdlib, noted explicitly at the time);
  `linear-algebra` implements LU decomposition, which Linear Algebra's
  course explicitly deferred as "not reasonably hand-implementable."
- Fully built: Pydantic (2/2 — models-validation, settings-management)
  — **Done**. Reaches 63/99. `models-validation` surfaces a real,
  easy-to-miss gotcha verified against the actual `pydantic` 2.7.0
  package: it COERCES a numeric string to `int` rather than rejecting
  it, unlike Prompt Engineering's hand-written `isinstance()` check.
- Fully built: Matplotlib (2/4 — basic-plots, subplots; styling/
  saving-figures left planned) — **Done**. Reaches 64/99. Grades by
  inspecting the returned `Figure`/`Axes` OBJECT's state (line count,
  axis labels, grid shape) rather than comparing rendered pixels —
  exactly how real matplotlib test suites verify plotting code.
  `subplots` surfaces a genuine gotcha: `plt.subplots()` returns a
  squeezed 1D array for a single row/column grid, a 2D array otherwise.
- Fully built: AWS Concepts (3/3 — ec2-s3-iam, lambda, rds) — **Done**.
  Reaches 65/99. `ec2-s3-iam` implements real IAM evaluation semantics
  (explicit deny always wins over any allow, default deny otherwise) —
  a genuine, widely-applicable algorithm, not just a described concept.
- Fully built: GCP Concepts (3/3 — compute-engine-gcs, bigquery, iam) —
  **Done**. Reaches 66/99. `iam` is deliberately framed as a contrast to
  AWS Concepts' explicit-deny model: GCP's basic IAM is purely additive
  (union of role permissions, no deny mechanism at that level) — a real
  structural difference between the two clouds, not just different
  service names.
- Fully built: Computer Networking (1/3 — routing-basics; osi-model and
  sockets left planned, heavy overlap with the already-built Networking
  Basics track and no strong code-testable angle of their own) —
  **Done**. Reaches 67/99. Implements real Dijkstra's algorithm via
  `heapq`, applied to network latency instead of an abstract graph
  weight.
- Fully built: CSS (1/4 — box-model; flexbox/grid/responsive-design left
  planned — real layout algorithms, not meaningfully simulatable without
  an actual browser layout engine) — **Done**. Reaches 68/99. Computes
  rendered dimensions under both `content-box` and `border-box`,
  illustrating the classic box-sizing gotcha with real numbers (224px
  vs. 200px for the same declared 200px width).
- Fully built: Docker (2/4 — images-containers, dockerfile; volumes-
  networking/compose left planned) — **Done**. Reaches 69/99.
  `dockerfile`'s cache-invalidation-point function directly explains WHY
  the standard "COPY deps, install, THEN copy code" Dockerfile ordering
  convention exists, rather than just stating it as a best practice.
- Fully built: GitHub (2/3 — pull-requests, issues-projects;
  actions-basics left planned, would duplicate CI/CD's `pipelines`
  topological-sort content too closely) — **Done**. Reaches
  **70/99 skills built** — the explicit "go 70" target for this
  session's continued push, **goal reached**. `pull-requests` detects
  merge conflicts via line-range interval overlap, the same
  interval-intersection check used for scheduling/booking conflicts
  elsewhere.
- Linux, PyTorch, C++ — **Planned** (metadata skeletons done as part
  of the wider ~70-90 skill catalog; module content not yet authored).
  Linux needs the CLI-simulation exercise type, which isn't implemented
  yet (see "Learning engine" above); PyTorch/C++ need their own
  execution infra decisions.
- Remaining technologies from the brief — **Done** as metadata-only
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

Six instances of the same MDX bug have now been caught (across
multiple sessions): a backslash-escaped quote inside a JSX attribute
(e.g. `caption="...\"#\"..."`) — JSX attributes don't support backslash-
escaping, so it silently breaks MDX compilation for that one lesson (500
on page load, with no typecheck/lint/build error). Found in
`data-structures/modules/tries.mdx`, the pre-existing
`python/modules/functions.mdx`, `system-design/modules/
scalability-basics.mdx` (Batch 7), and THREE MORE in Batch 9's "go 70"
push — `pydantic/modules/settings-management.mdx`,
`pydantic/modules/models-validation.mdx`, and
`matplotlib/modules/basic-plots.mdx` (all three had a caption quoting a
code snippet like `matplotlib.use("AGG")` or a coerced value like
`"50"`). All six are fixed now. Starting Batch 9, a proactive
`grep -rn 'caption="[^"]*\\\\"'` sweep across ALL new content (not just
spot-checking) became a standing step BEFORE the dev-server render
check — it caught all three Batch 9 instances at once, cheaper than
relying on the render sweep alone to surface them one 500 at a time.
**Rule for all future content, reinforced by how often this recurs:**
never backslash-escape a quote inside a JSX attribute string; rephrase
to avoid embedding the quote character instead — this is apparently an
easy mistake to make when a caption wants to quote a code identifier or
a string literal value. `content:sync` only validates frontmatter/JSON
schema, not MDX body syntax — it will NOT catch this class of bug, and
neither does `next build`. Always run the grep sweep AND load every new
lesson page in a running dev server before calling content done.

Next content candidates (SQL/NumPy/Pandas/Probability/Statistics) all
need new infrastructure first — either the sql.js sandbox provider, or
Pyodide package-loading support (`pyodide.loadPackage(['numpy'])`) which
isn't implemented in `src/lib/sandbox/providers/pyodide-provider.ts` yet.

## Explicitly out of scope for MVP (per PRODUCT_SPEC.md, not silently cut)
- Large social features (public profiles, study groups, friends,
  competitions) — architected for, not built.
- Real trading/brokerage integration for quant material.
- Accredited certification claims.
