# Roadmap / Career Track System

## Data

`CareerTrack` has an ordered set of `Skill`s via `CareerTrackSkill(stage,
importance)`. `stage` groups skills into the visual roadmap lanes
(Foundation, Math, Algorithms, Domain, Engineering, Projects, Interview
Prep — stage names vary per track). `Skill` also has `SkillDependency` edges
independent of any one track, so the same Python→NumPy→Pandas chain is
reused across the Data Scientist, ML Engineer, and Quant Developer tracks.

## Generation algorithm

1. Start from the user's chosen `CareerTrack`.
2. Pull its skills grouped by stage, in dependency order (topological sort
   over `SkillDependency` restricted to that track's skill set).
3. For each skill, check the user's diagnostic-detected level (from
   `AssessmentAttempt`) and current `SkillRating`. If already ≥ "Working
   Knowledge" (3), mark the roadmap node as pre-satisfied rather than
   hiding it — users can still open and review it, nothing is force-hidden.
4. Output an ordered list of "recommended next" nodes (first N unsatisfied
   nodes respecting dependency order) plus the full graph for the visual
   view.
5. Recompute lazily whenever the dashboard/roadmap page is loaded, not on a
   cron — it's cheap (small graph, indexed lookups) and always reflects the
   latest submissions.

## User agency

Nothing is hard-locked. A node with unmet prerequisites is shown as
"available" with a subtle prerequisite hint, not blocked — per the brief:
"Do not unnecessarily lock content." Users can open any skill from Explore
regardless of their active career track.

## Skill comparison / career switching

For each CareerTrack, compute the same readiness percentage (see
LEARNING_ENGINE.md) using the user's current SkillRatings against every
track's skill list, not just the active one. This powers the "Skill
Comparison" view (Quant Researcher 72%, ML Engineer 68%, …) without
requiring the user to switch their active goal.
