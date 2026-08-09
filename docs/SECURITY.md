# Security

## Code execution

The single highest-risk feature in this product is "run arbitrary
user-submitted code." Rules:

- The Next.js server process **never** executes user-submitted code directly
  (no `child_process`, no `eval`, no shelling out to a language runtime).
- MVP sandbox: Python via Pyodide (CPython compiled to WASM, runs in the
  browser/a Web Worker), SQL via sql.js (SQLite compiled to WASM), JS/TS via
  a sandboxed Web Worker with no DOM/network access. All execution happens
  on the user's own machine, scoped to their own browser tab — there is no
  shared server-side execution surface to attack.
- Future server-side languages (C++, Java, Go, Rust, etc., per
  ARCHITECTURE.md's provider abstraction) MUST run in an isolated,
  resource-limited, network-disabled container/microVM (Docker with strict
  seccomp/no-net, Firecracker, or a hosted service like E2B/Judge0) — never
  directly on the app server. This is a hard gate before any non-WASM
  language is enabled; do not bypass it for convenience.

## API surface

- `/api/*` routes validate every input with zod before touching the
  database. Reject rather than coerce malformed input.
- Auth: every authenticated route checks the Clerk session server-side
  (`auth()` in a Server Component/Route Handler); never trust a client-sent
  user id.
- Authorization: mutations (submissions, progress, notes, projects) always
  scope queries to the authenticated user's own id — never accept a
  target-user id from the client for write paths.
- Rate limiting: expensive endpoints (AI tutor calls, submission validation)
  should be rate-limited per user once the AI provider is wired up
  (documented as a TODO in the AI tutor route until an actual provider key
  exists — see `.env.example`).
- Secrets (Clerk secret key, Neon connection string, AI provider key) are
  read only in server-side code (Route Handlers, Server Components, Server
  Actions) via `process.env`, never exposed to the client bundle. Only
  `NEXT_PUBLIC_*` vars that are genuinely safe to expose (Clerk publishable
  key) are public.
- User-generated content rendered back to other users (none in MVP — notes/
  snippets are private) must be sanitized before render if/when sharing
  ships; MDX lesson content is authored by us, not user-submitted, so it's
  trusted at build time.

## Database

- All queries go through Drizzle's parameterized query builder — no raw
  string-concatenated SQL.
- The in-lesson "SQL sandbox" exercises run against sql.js (an in-memory,
  per-session WASM SQLite instance seeded from a static dataset), which is
  fully isolated from the production Neon database. User SQL exercises can
  never reach production data.

## Known gaps (tracked, not hidden)

- No rate limiting is implemented yet (needs an AI/provider key and a
  decision on a rate-limit store — Upstash Redis is the natural fit on
  Vercel). Tracked in ROADMAP.md.
- CSRF: Next.js Route Handlers behind Clerk session auth + `SameSite`
  cookies cover the common case; a dedicated CSRF token is not yet added and
  is tracked as planned hardening before any state-changing GET-adjacent
  action is added.
