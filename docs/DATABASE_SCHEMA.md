# Database Schema

Postgres (Neon) via Drizzle ORM. Source of truth is
`src/lib/db/schema.ts` — this doc explains the model relationships; read the
schema file for exact column types.

## Identity

- **User** — mirrors the Clerk user (`clerkId` is the join key). Holds
  display name, avatar, timestamps.
- **Profile** — 1:1 with User. Career goal, time-goal-per-day, experience
  self-rating, theme/editor prefs.

## Content graph (seeded from `/content`, not hand-inserted)

- **Skill** — a learnable technology/concept (Python, PyTorch, Probability…).
  Category, difficulty, estimated hours, careers it's relevant to.
- **SkillDependency** — directed edge `skillId → prerequisiteSkillId`, powers
  the skill graph and roadmap ordering.
- **Course** — top-level learning unit for a Skill (usually 1:1 with Skill
  for now; modeled separately so a Skill could have multiple course variants
  later).
- **Module** — ordered group of lessons within a Course.
- **Lesson** — ordered content unit within a Module; references its MDX file
  path, not inline content.
- **LessonBlock** — ordered structural pieces of a Lesson (explanation, code
  example, exercise, quiz, checkpoint) — persisted mainly so progress can be
  tracked per-block, not just per-lesson; the actual content stays in MDX.
- **Exercise** — a gradable unit inside a LessonBlock. Has a type (write-code,
  fill-blank, fix-bug, predict-output, multiple-choice, sql-query, etc.).
- **TestCase** — input/expected-output pairs for an Exercise (code exercises)
  or the correct-option id (multiple choice).
- **Challenge** — a standalone gradable unit outside the lesson flow (Bug
  Hunt, Code Sprint, Daily Forge item, Interview Mode question). Reuses the
  same Exercise/TestCase shape via a polymorphic-ish `exerciseId` FK so
  scoring logic isn't duplicated.
- **Project** — mini/standard/advanced/capstone project definition:
  requirements, starter files ref, milestones, stretch goals.
- **Dataset** — metadata (name, source, license/attribution, file path) for
  datasets used in exercises/projects.

## Career / roadmap

- **CareerTrack** — Software Engineer, Quant Developer, etc. Ordered list of
  recommended Skills (via a join table `CareerTrackSkill` with a `stage`
  column for the visual roadmap grouping — Foundation/Math/Algorithms/etc.).

## Progress & scoring (per-user, written by the app, not seeded)

- **CourseProgress** / **LessonProgress** — status + percent + timestamps.
- **Submission** — one row per exercise/challenge attempt: pass/fail, hints
  used, time spent, code snapshot. Feeds XP and mastery calculations.
- **SkillRating** — current 0–6 rating per (user, skill), plus the component
  scores that produced it (lessons/accuracy/assessment/project/retention —
  see LEARNING_ENGINE.md's mastery weighting).
- **XPEvent** — append-only ledger (source type, amount, timestamp). Level is
  derived from the sum, never stored redundantly as a mutable counter.
- **ProjectProgress** — per-user, per-project status/milestone completion.
- **Assessment** / **AssessmentAttempt** — diagnostic and certification-style
  assessments and each attempt's per-topic detected level.
- **ReviewItem** / **ReviewSchedule** — spaced-repetition state per (user,
  concept): interval, ease, next-due-date, consecutive-correct count.
- **Streak** — current streak length, freezes available/used, last-active
  date.
- **Achievement** / **UserAchievement** — catalog + unlock join table.
- **Bookmark** — polymorphic (entityType, entityId) per user.
- **Note** / **Snippet** — free-text notes and saved code snippets, taggable.
- **Activity** — append-only event log powering the profile activity
  calendar (one row per learning action per day, aggregated for display).
- **AIConversation** / **HintUsage** — AI tutor session log and per-exercise
  hint-ladder usage (used both for UX — "you've used 2 hints" — and for
  down-weighting mastery when hints were heavily used).

## Notes on design choices

- XP and streaks are derived from append-only event logs (`XPEvent`,
  `Activity`) rather than mutable counters, so recomputation/auditing is
  possible and a bug can't silently corrupt a user's total.
- `SkillRating` is a materialized, recomputed-on-write cache of the mastery
  engine's output, not the source of truth — `Submission` rows are. This
  keeps the mastery weighting formula (LEARNING_ENGINE.md) changeable without
  a data migration.
- Content tables (Skill…TestCase, Dataset) are populated by a sync script
  that reads `/content`, not by hand — see COURSE_CONTENT_SPEC.md.
