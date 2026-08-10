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

- 36 skills have real lesson content (up from the original Python-only
  MVP) — full per-track module counts and design notes are in
  ROADMAP.md "Content coverage," not duplicated here since it changes
  every session. Quick index: Python/Data Structures/Algorithms/NumPy/
  Pandas/Probability/Statistics (all complete), SQL (7/10), Linear
  Algebra (2/3), Monte Carlo Simulation, Stochastic Processes
  Fundamentals, Calculus Review, Optimization, Numerical Methods,
  Complexity Analysis, Functional Programming, OOP, Design Patterns,
  Feature Engineering, Financial Markets, Model Evaluation, Debugging,
  Time Series, HTTP, Clean Code, REST APIs, Redis, Networking Basics
  (all complete), Quant Finance Fundamentals (5/9), Authentication
  (2/3), Testing (2/4), Database Design (2/3), Data Modeling (2/2),
  Operating Systems (2/3), MongoDB (2/3), Git (2/4). The rest of the
  technology catalog is metadata-only (by design — see
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
  ROADMAP.md "Content coverage" for the full reasoning. Git/Linux need
  the CLI-simulation exercise type, PyTorch/C++ need their own
  sandbox/package infra.
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
