# Implementation Plan

Phases as defined in the product brief. Status is tracked precisely in
`ROADMAP.md` at the repo root — this file just records the intended order
and what "done" means per phase.

1. **Foundation** — Next.js app, design system tokens, DB schema + client,
   Clerk auth, nav shell, dashboard skeleton, profile skeleton, onboarding
   flow, content architecture, skill system (graph data + Explore page).
2. **Learning engine** — lessons, modules, exercises, quizzes, validation,
   progression, XP, skill ratings.
3. **Code engine** — Monaco, sandbox provider abstraction + Pyodide/sql.js/
   JS-worker implementations, output terminal, test-case runner.
4. **Roadmap engine** — career tracks, dependency graph, visual graph page,
   diagnostic assessment, recommendation output.
5. **Advanced learning** — notebook mode, Bug Hunt, Code Detective,
   algorithm visualizations, spaced repetition, Daily Forge.
6. **Projects** — mini/standard/capstone project pages, milestone tracking,
   portfolio view.
7. **Interview prep** — practice/timed/mock modes per career category.
8. **AI** — tutor provider abstraction (OpenAI-compatible interface),
   hint ladder, error explanation — implemented as real, working code paths
   gated behind an env var; without a provider key configured, the UI shows
   "AI tutor not configured" rather than a fake response.
9. **Polish** — analytics dashboards, achievements, mobile responsiveness,
   accessibility pass, performance (code splitting/lazy Monaco), themes,
   changelog.

This session's build targets a working slice through Phase 1 plus enough of
Phases 2–4 to satisfy the MVP acceptance flow in PRODUCT_SPEC.md end to end,
with the remaining phases represented as real architecture (not stubs that
lie about working) plus honest ROADMAP.md entries.
