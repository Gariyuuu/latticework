# Latticework — Product Spec

## What it is

Latticework is an interactive skill academy for people preparing for SWE, data,
ML/AI, and quant careers. It combines a career-goal-driven skill graph, active
in-browser coding practice, and retention tracking into one product. It is not
a video course library, not a LeetCode clone, and not a chatbot with courses
bolted on.

## Core loop

Pick a career goal → diagnostic estimates existing skill → roadmap is
generated → user opens a skill → does a short interactive lesson (mostly
code, not reading) → takes a scored challenge → earns XP and a skill-rating
update → returns next day to a spaced-repetition "Daily Forge" review →
eventually builds a project that exercises several skills together.

## Design commitments (from the brief, kept explicit so scope isn't quietly cut)

- Lesson composition target: ~20% explanation, 50% practice, 20% challenge,
  10% review.
- Skill ratings (0–6: Not Started → Advanced) are learning estimates, never
  presented as hiring signal. Same for "Career Readiness" percentages — those
  are curriculum-coverage estimates, not probability of employment.
- Streaks use freezes; missing a day never wipes months of progress.
- Code execution never runs arbitrary user code inside the main app server.
  MVP uses in-browser WASM sandboxes (Pyodide for Python, sql.js for SQL,
  a sandboxed iframe/worker for JS/TS); the execution layer is an interface
  so a real remote sandbox (Docker/E2B/Judge0-style) can be swapped in later
  without touching lesson content or UI.
- Content lives in a structured content system (MDX + typed frontmatter),
  not hardcoded into React components, so adding a technology doesn't mean
  writing new page components.
- Quality over count: a handful of tracks (Python, SQL, Git, Linux, NumPy,
  Pandas, Probability, Statistics, Data Structures, Algorithms, PyTorch, C++)
  get real lesson content; the rest of the ~70–100 technology catalog exists
  as structured metadata/skeleton entries (name, prerequisites, career
  relevance, estimated hours, module outline) so the skill graph is complete
  and honest about what's built vs. planned.

## Non-goals for MVP

- No real trading signals or brokerage integration (quant material is
  educational only, uses synthetic/public data).
- No large social graph (friends, study groups) — architected for later,
  not built now.
- No claim of accredited certification.
- No server-side arbitrary code execution without a real sandbox provider
  wired up (see SECURITY.md).

## Primary user flow that must work end-to-end (MVP acceptance test)

Sign up → choose a career goal → take a short diagnostic → get a roadmap →
open the Python track → read a short lesson → write and run real code in
the browser → pass an automated exercise → see XP and a skill rating change
→ take a Daily Forge review → return later and progress persists.

See ROADMAP.md at the repo root for what is built vs. planned against this
spec, tracked honestly per section.
