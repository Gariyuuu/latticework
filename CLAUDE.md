# CLAUDE.md — Latticework

Persistent project context for future Claude Code sessions. Read this before
making architectural changes, and update it when a major decision changes.

## What this is

Latticework is an interactive skill academy (SWE/data/ML/quant career prep) —
career roadmap + interactive coding + skill graph + projects + retention
tracking. Full product intent: `docs/PRODUCT_SPEC.md`. Full spec docs live in
`docs/` — read the relevant one before touching that area:
- `docs/ARCHITECTURE.md` — stack, folder structure, execution provider model
- `docs/DATABASE_SCHEMA.md` — model relationships (schema itself in
  `src/lib/db/schema.ts`)
- `docs/LEARNING_ENGINE.md` — XP, mastery weighting, SRS, Daily Forge
- `docs/COURSE_CONTENT_SPEC.md` — MDX content authoring format
- `docs/ROADMAP_SYSTEM.md` — career track → skill graph generation
- `docs/DESIGN_SYSTEM.md` — colors, typography, motion rules
- `docs/SECURITY.md` — code execution sandboxing rules (read before touching
  anything under `src/lib/sandbox`)
- `docs/IMPLEMENTATION_PLAN.md` — phase breakdown

## Stack

Next.js (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui (Radix/
Nova preset) + Clerk auth + Neon Postgres via Drizzle ORM + Monaco editor +
Pyodide/sql.js for in-browser sandboxed code execution.

## Deployment

Live at **https://latticework-gilt.vercel.app** (GitHub-connected, auto-
deploys on push to `main`). Repo: github.com/Gariyuuu/latticework. Neon +
Clerk both provisioned via Vercel Marketplace and connected — real env
vars live in Vercel, DB schema pushed, content seeded. See ROADMAP.md
"Deployment" for the full setup trail and gotchas (notably: Clerk keys
missing in production = a generic 500 on every route, since keyless mode
is dev-only).

## Folder structure

See `docs/ARCHITECTURE.md` "Folder structure" section — kept in sync there,
not duplicated here.

## Database patterns

- Schema lives in `src/lib/db/schema.ts`, one Drizzle table per model in
  `docs/DATABASE_SCHEMA.md`. Migrations via `drizzle-kit` (`npm run db:
  generate` / `npm run db:push`).
- Content tables (Skill, Course, Module, Lesson, Exercise, TestCase) are
  populated by `npm run content:sync` reading `/content` — never hand-insert
  content rows.
- Progress/scoring tables are written only by server-side code in
  `src/lib/scoring` and `src/lib/srs` — never mutated directly from a route
  handler's ad hoc query.

## Design rules

Dark-first, terminal/editor-inspired, not generic SaaS. Full palette/motion
rules in `docs/DESIGN_SYSTEM.md`. Use existing `src/components/ui/*`
(shadcn) primitives before adding a new dependency for something a primitive
already covers.

Every color token in `src/app/globals.css` derives from a single
`--accent-hue` CSS variable (default 264) rather than a hard-coded hue
literal — user-facing accent customization (Settings -> Appearance, a hue
wheel) works by overriding that one variable on `<html>`, live-retinting
every token at once. Don't reintroduce a hard-coded hue into a new token;
use `var(--accent-hue)` like the existing ones. See ROADMAP.md "Polish"
for the full appearance-system writeup (background picker, persistence,
no-FOUC script).

## Naming conventions

- Route folders: kebab-case matching the nav labels (`/roadmap`,
  `/playground`, `/interview`).
- Content slugs: kebab-case, stable once published (used as DB keys and
  URLs) — never rename a skill slug without a migration plan.
- DB tables/columns: snake_case at the SQL level via Drizzle's default
  mapping from camelCase TS fields.

## Course/content architecture

See `docs/COURSE_CONTENT_SPEC.md`. Short version: every skill needs a
`content/<slug>/metadata.json`; a skill is "built" only once it also has
`.mdx` modules + exercise JSON. Don't fake a "built" status on a skeleton
skill.

## Current implementation status

Tracked precisely, honestly, and continuously in `ROADMAP.md` at the repo
root (Completed / In Progress / Planned / Blocked per major feature from the
brief). That file is the source of truth for "what's actually built" —
update it in the same commit as any feature work, don't let it drift.

## Important commands

```bash
npm run dev              # start dev server (Turbopack)
npm run build             # production build
npm run lint               # eslint
npx tsc --noEmit           # typecheck
npm run db:generate        # generate a Drizzle migration from schema.ts
npm run db:push            # push schema directly to the Neon DB (dev)
npm run content:sync       # parse /content and upsert Skill..Exercise rows
```

## Environment configuration

See `.env.example` at repo root. Nothing in this repo should silently no-op
on a missing env var without surfacing that clearly in the UI — see
`docs/SECURITY.md` and `docs/ARCHITECTURE.md`'s note on degrading visibly.

## Known limitations (see ROADMAP.md for the full, current list)

- **79 skills have real lesson content** (up from the original
  Python-only MVP) — targets of 50, 60, then 70 were all reached in one
  session; a request to go to 99 (the full catalog) was assessed and
  found NOT fully achievable via content authoring alone at the time —
  see ROADMAP.md "Content coverage" for the precise, verified breakdown
  of why 20 skills remain infra-blocked, not just unwritten. A later
  session closed the two highest-leverage gaps identified there: a
  CLI-simulation exercise type (`src/lib/sandbox/providers/cli-provider.ts`,
  a deterministic in-memory Unix-shell simulator, not real bash), which
  unblocked `bash` (4/4), `cli-terminal` (3/3), and `linux` (2/4;
  `processes`/`package-management` deliberately left Planned, no honest
  fit for a filesystem-only simulator); and a JS/TS sandboxed Worker
  provider (`src/lib/sandbox/providers/js-provider.ts`), which unblocked
  `javascript` (5/7) and `typescript` (3/5) — see below for both.
  Full per-track module counts and design notes are in ROADMAP.md, not
  duplicated here since it changes every session. Quick index: Python/
  Data Structures/Algorithms/NumPy/Pandas/Probability/Statistics (all
  complete), SQL (7/10), Linear Algebra (2/3), Monte Carlo Simulation,
  Stochastic Processes Fundamentals, Calculus Review, Optimization,
  Numerical Methods, Complexity Analysis, Functional Programming, OOP,
  Design Patterns, Feature Engineering, Financial Markets, Model
  Evaluation, Debugging, Time Series, HTTP, Clean Code, REST APIs,
  Redis, Networking Basics, Embeddings, Compilers Fundamentals,
  WebSockets, Concurrency, Kafka Fundamentals, ML Experiment Design,
  Model Deployment, Memory Management, RAG Fundamentals, CI/CD, ETL/ELT,
  Warehousing Concepts, OpenAI-style API Concepts, SQLite, SciPy, AWS
  Concepts, GCP Concepts, XGBoost, LightGBM (all complete), Quant
  Finance Fundamentals (5/9), Authentication (2/3), Testing (2/4),
  Database Design (2/3), Data Modeling (2/2), Operating Systems (2/3),
  MongoDB (2/3), Git (2/4), Distributed Systems Fundamentals (2/3), LLM
  Fundamentals (3/4), System Design Fundamentals (3/4), Vector Databases
  (2/3), MLOps Fundamentals (2/3), Parallel Computing (2/3), Software
  Architecture (2/3), Prompt Engineering (2/3), Cloud Fundamentals
  (2/3), GraphQL Fundamentals (2/3), Scikit-learn (3/4), Pydantic (2/2),
  Matplotlib (2/4), Computer Networking (1/3), CSS (1/4), Docker (2/4),
  GitHub (2/3), Snowflake Fundamentals (2/3), Apache Spark Fundamentals
  (2/3, explicitly a verified pure-Python simulation of Spark's
  execution model — `pyspark` is confirmed unavailable in Pyodide),
  Bash / Shell (4/4), Terminal / CLI (3/3), Linux (2/4 — filesystem,
  permissions; `processes`/`package-management` left Planned, no
  honest fit for a filesystem-only CLI simulator), JavaScript (5/7 —
  syntax-variables, functions, objects-arrays, error-handling,
  async-promises; `dom-basics`/`modules` left Planned — no DOM in a
  Worker, no multi-file import graph in this exercise model), TypeScript
  (3/5 — types-interfaces, narrowing, generics; `utility-types`/
  `configuring-strict-mode` left Planned — purely compile-time features
  with zero runtime footprint for a transpile-then-run grader to check,
  see ROADMAP.md). The rest of the technology catalog is metadata-only,
  and for 20 of those skills that's a hard infrastructure blocker, not a
  content gap — see ROADMAP.md (by design — see also
  `docs/COURSE_CONTENT_SPEC.md`).
  Monte Carlo and
  Stochastic Processes content need genuine randomness — made gradeable
  via `random.seed()`, only after verifying seeded `random.random()`/
  `.gauss()`/`.choices()` produce bit-identical output between Pyodide's
  WASM build and local CPython (same Mersenne Twister C implementation
  compiled either way). SQL's last 3 modules
  (indexes-query-plans, schema-design, transactions-isolation) don't fit
  the sql-query exercise type's "does your SELECT return these rows"
  grading model at all — each is fundamentally about something else
  (EXPLAIN QUERY PLAN text, DDL/normalization, real concurrency) and
  needs its own exercise type, not a forced-fit sql-query exercise — see
  ROADMAP.md "Content coverage" for the full reasoning. Git's remaining
  modules (resolving-conflicts, remotes) need a separate git-simulation
  exercise type (staging area / commit graph model, not just a
  filesystem) — still Planned, distinct from cli-simulation, which is
  now built. PyTorch/C++ need their own sandbox/package infra.
- SQL exercises (`sql-query` type): `setupSql` seeds a fresh sql.js
  database per exercise, grading deep-compares the student's query's last
  result set against `expectedColumns`/`expectedRows` — exact row order,
  so every reference query needs `ORDER BY` with no tied sort keys (pick
  seed data that avoids ties, don't rely on a secondary sort you didn't
  write). See `src/lib/sandbox/providers/sql-provider.ts` and the
  `sql-query` branch in `src/components/lesson/exercise.tsx`. Verify any
  new SQL exercise by running the real `sql.js` npm package in Node
  first — `db.exec()` returns `[]` (not one empty-values result set) when
  a query matches zero rows, a real edge case that bit the grading logic
  design before content was written.
- CLI-simulation exercises (`cli-simulation` type): reuses the write-code
  `cases` (call/expect) grading path — the student's `starterCode` script
  runs first against a fresh virtual filesystem seeded from `initialFiles`
  (paths relative to `/home/user` unless absolute), then each
  `cases[].call` command runs afterward in that same persisted filesystem/
  cwd/variable state. See `src/lib/sandbox/providers/cli-provider.ts` — a
  deterministic in-memory Unix-shell simulator, NOT real bash (no
  practical way to run real bash in a browser tab for this MVP). Two real
  gotchas caught by verification, documented in that file's docstring:
  (1) `echo ... > file` appends a trailing newline, so `cat`/`cp`/`mv` on
  that file reproduce it verbatim (`cat` after `echo hi > f` returns
  `"hi\n"`, not `"hi"`); (2) naive `content.split("\n")` on
  newline-terminated content produces a bogus trailing empty line for
  every line-oriented command — fixed via a shared `linesOf()` helper
  (`wc -l` counts `\n` characters directly instead, unaffected). `sed`/
  `awk` support only the single most common idiom each
  (`s/pattern/replacement/[g]`, `{print $N}`) — anything else returns an
  honest "unsupported script" error rather than mishandling it silently.
  Verify any new cli-simulation exercise by running its exact reference
  solution through `CliProvider` headless in Node — never hand-type an
  expected value, same discipline as every other provider.
- JavaScript/TypeScript exercises (`write-code` type, `language:
  "javascript"` or `"typescript"`): reuses the same write-code `cases`
  grading path as Python — `starterCode` runs first, then each
  `cases[].call` expression runs against its persisted state. See
  `src/lib/sandbox/providers/js-provider.ts`. Runs in a fresh, disposable
  Web Worker per call, `fetch`/`XMLHttpRequest`/`WebSocket`/
  `importScripts` stripped (docs/SECURITY.md's "no DOM/network access"
  requirement). The student's code + every `cases[].call` are
  concatenated into ONE script wrapped in a single `(async () => {
  ... })()`, run through ONE indirect eval — NOT one eval call per piece
  (separate calls silently break every `const`/`let` declaration, since
  indirect eval's `function`/`var` hoist to the global object across
  calls but `const`/`let` don't — idiomatic modern JS uses `const`, so
  this bit real content before the single-eval fix) and NOT a non-async
  wrapper (grades async code against stale state, since results would be
  computed before any `await`ed work finishes). A real top-level `await`
  works both inside the student's code AND inside a `cases[].call`
  expression itself (e.g. `"await getUserName(1)"`) — the worker awaits
  the IIFE's own promise before posting results back. TypeScript
  transpiles first via the real `typescript` npm package's
  `transpileModule` (same version as this repo's own `tsc`, loaded lazily
  from CDN) — a per-file syntactic strip, NOT full type-checking, so only
  TS features with an observable runtime footprint are gradeable (typeof
  narrowing, a generic function's actual behavior — NOT utility types or
  strict-mode config, which have zero runtime trace). Verify any new
  exercise by running its exact reference solution through the real
  algorithm (a Node `worker_threads` proxy mirrors a browser Worker's
  isolated-realm + message-passing mechanics closely enough to catch both
  bugs above for real) — never hand-type an expected value.
- Pyodide package-loading: `RunOptions.packages` /
  `PyodideProvider.run()` / `testCaseFileSchema.packages` /
  `<CodeExample packages={[...]}>` — declare Pyodide package names an
  exercise or live example needs (e.g. `["numpy"]`, `["pandas"]` — Pyodide
  resolves transitive deps like pytz/python-dateutil automatically);
  loaded once per browser session and cached. See
  `src/lib/sandbox/providers/pyodide-provider.ts`. Verify any new use of
  this by running the real `pyodide` npm package (same version as the
  CDN build) headless in Node — `content:sync` only validates schema, not
  runtime package behavior, and Pyodide's WASM build can genuinely differ
  from desktop CPython (e.g. default int dtype is `int32`, not `int64`;
  pandas dtype inference on all-`None` columns differs from mixed
  columns — verify, don't assume, for any new package content).
- Exercises grade by exact string comparison (`str()` of the return
  value) — two gotchas that bit real content: (1) `round(x, 4)`'s
  `str()` drops trailing zeros (`round(0.24197, 4)` prints `0.242`, not
  `0.2420`), so every expected value in an exercise JSON must come from
  an actual verified print, never hand-typed formatting; (2) exercises
  can never use unseeded randomness (`random.random()` etc.) since
  output must be deterministic to grade — see
  `content/probability/exercises/` for the pattern of writing
  probability/stats content as closed-form computations instead of
  simulations.
- JSX attributes in lesson `.mdx` files don't support backslash-escaped
  quotes (`\"` silently breaks MDX compilation for that lesson, 500 on
  page load, with no typecheck/lint/build error) — rephrase to avoid
  embedding a quote character inside a double-quoted JSX attribute
  instead. Caught twice: `content/data-structures/modules/tries.mdx` and
  the pre-existing `content/python/modules/functions.mdx`. `content:sync`
  does NOT catch this (frontmatter/JSON-schema only) — always load every
  new or edited lesson in a running dev server before calling it done.
- AI tutor is architected (provider abstraction, hint ladder types) but has
  no live provider key wired in this environment.
- Non-WASM language execution (Java, C++ compilation, Go, Rust…) is not
  implemented — MVP only executes Python/SQL/JS-TS in-browser via WASM/
  Worker sandboxes; server-side sandboxed execution for compiled languages
  is designed but not built (`docs/SECURITY.md`).

## Instructions for future sessions

1. Read `ROADMAP.md` first to know what's real.
2. Don't silently drop scope from the original brief — if you're not
   building something, add/update its ROADMAP.md entry as Planned/Blocked
   with why.
3. Keep this file and `docs/ARCHITECTURE.md` updated on structural changes.
4. Run lint + typecheck + build before calling a phase done.
