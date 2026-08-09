# Architecture

## Stack

- **Framework**: Next.js (App Router, React Server Components where it makes
  sense, client components for anything interactive/editor-related).
- **Language**: TypeScript, strict mode. `any` is avoided; when truly
  unavoidable (e.g. typing a third-party editor callback) it's isolated and
  commented why.
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix primitives, Nova preset).
- **Auth**: Clerk (`@clerk/nextjs`).
- **Database**: Neon Postgres, accessed through Drizzle ORM
  (`@neondatabase/serverless` driver, works in serverless/edge functions).
- **Code editor**: Monaco (`@monaco-editor/react`), lazy-loaded — never part
  of the initial bundle for pages that don't need it.
- **Code execution (MVP)**: in-browser WASM — Pyodide for Python, sql.js for
  SQL, a sandboxed Web Worker for JS/TS. See SECURITY.md for why this is the
  safe default and how a server-side sandbox provider slots in later.
- **Deployment target**: Vercel.

## Folder structure

```
src/
  app/                    # routes (App Router)
    (marketing)/           # landing page, public
    (app)/                 # authenticated app shell
      dashboard/
      learn/[skillSlug]/
      learn/[skillSlug]/[lessonSlug]/
      roadmap/
      practice/
      projects/
      interview/
      playground/
      progress/
      achievements/
      profile/
      onboarding/
    api/
      execute/             # code-execution endpoints (validation, future
                            # server sandbox proxy — not used by MVP client
                            # WASM path, kept for architectural parity)
      submissions/
      xp/
  components/
    ui/                    # shadcn primitives
    lesson/                # <Explanation> <CodeExample> <Exercise> <Quiz>
                            # <Visualization> <Checkpoint> <ProjectStep>
    shell/                 # sidebar, topbar, mobile nav
    graph/                 # skill graph visualization
  content/                 # MDX lesson content, one folder per skill
    python/
      metadata.json
      modules/*.mdx
    sql/
    git/
    ...
  lib/
    content/                # content loader/parser (reads /content, validates
                             # frontmatter with zod, builds the skill graph)
    db/                     # drizzle schema + client
    sandbox/                # execution provider abstraction (see below)
    scoring/                # XP, skill rating, mastery engine
    srs/                    # spaced repetition scheduling
    roadmap/                # career track → skill dependency resolution
  hooks/
  types/
docs/                       # this folder — design docs
content/datasets/           # small public/synthetic CSVs for exercises
```

## Content pipeline

Course content is authored as MDX files with typed frontmatter, not as React
components per lesson. A lesson file declares a sequence of typed blocks
(explanation, code-example, exercise, quiz, checkpoint) that the lesson
renderer maps onto the shared `components/lesson/*` primitives. This means
adding a new lesson is authoring content, not writing UI code — see
COURSE_CONTENT_SPEC.md for the exact schema.

At build/dev time, `lib/content` walks `/content`, parses every
`metadata.json` and `.mdx` file, validates it against a zod schema, and
produces:
1. A flat list of skills/courses/modules/lessons (used to seed/sync the DB).
2. The skill dependency graph (used by `lib/roadmap`).

## Execution provider abstraction

```
interface SandboxProvider {
  language: "python" | "javascript" | "typescript" | "sql" | ...;
  run(code: string, opts: RunOptions): Promise<RunResult>;
}
```

MVP implementations (`lib/sandbox/providers/*`) run entirely client-side in
the browser (Pyodide/sql.js/Worker), so "sandboxing" is enforced by the
browser's own process/script isolation, not by our server — the app server
never executes user-submitted code. The interface is shape-compatible with a
future server-side provider (e.g. an HTTP call to a container/E2B/Judge0-like
service) so swapping providers later doesn't touch lesson or challenge code.
`/api/execute` exists today only to validate payload shape and log
submissions for scoring — it does not execute anything.

## Data flow for a lesson attempt

1. Client loads lesson content (server component reads parsed MDX + DB
   progress row).
2. User edits code in Monaco, hits Run → `SandboxProvider.run()` executes
   client-side, returns stdout/stderr/return value.
3. Exercise validator (co-located with the exercise block, pure function or
   test-case list) checks the result.
4. On pass, client calls `POST /api/submissions` with lesson/exercise id,
   pass/fail, hints used, time spent.
5. Server records `Submission`, updates `LessonProgress`, computes and
   records an `XPEvent`, recomputes the relevant `SkillRating` via
   `lib/scoring`, and updates `ReviewSchedule` via `lib/srs` if applicable.

## Environment variables

See `.env.example` at repo root — every variable needed is declared there
with a comment on where to get it. Anything requiring a credential that
can't be provisioned in this session (Clerk keys, Neon connection string,
an AI provider key) is fully wired in code but left unset locally; the app
degrades to a clear "configure X" message rather than pretending to work.
