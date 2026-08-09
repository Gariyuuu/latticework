# Learning Engine

## XP

XP is awarded for legitimate learning actions only — never for clicking
around:

- Lesson block completed: small flat amount.
- Exercise passed: amount scales with difficulty; first-try (no hints) gets
  a bonus; each hint used reduces the bonus.
- Challenge/Daily Forge item passed: similar, weighted by difficulty.
- Project milestone completed: larger flat amount.
- Assessment completed: flat amount, independent of score (taking it is what
  we want to reward; the score feeds skill rating, not XP directly).

Level = a monotonic function of cumulative XP (simple curve, e.g.
`level = floor(sqrt(xp / k))`), computed on read from the `XPEvent` ledger,
never stored as an independently-mutable field.

## Mastery / skill rating (0–6)

Per (user, skill), computed from weighted components:

| Component            | Weight |
|-----------------------|-------:|
| Lesson completion      | 15% |
| Practice accuracy      | 25% |
| Assessment performance | 25% |
| Project application    | 20% |
| Retention (SRS)        | 15% |

Each component is normalized to 0–1 before weighting. The weighted sum maps
to the 0–6 label:

```
0.00       -> 0 Not Started
0.01–0.15  -> 1 Familiar
0.15–0.35  -> 2 Beginner
0.35–0.55  -> 3 Working Knowledge
0.55–0.75  -> 4 Proficient
0.75–0.90  -> 5 Interview Ready
0.90–1.00  -> 6 Advanced
```

Passive lesson-viewing alone caps out well inside "Beginner" — the practice/
assessment/project/retention components dominate the weighting, so mastery
requires doing, not reading. Ratings are always labeled "learning estimate"
in the UI, never "proficiency" or anything implying a professional/hiring
judgment.

## Career readiness

For a given CareerTrack, readiness = average of that track's Skills'
mastery scores, weighted by each skill's declared importance to the track
(a column on `CareerTrackSkill`). Displayed as a percentage with the label
"Learning Readiness Estimate" — never "job readiness" or a probability.

## Spaced repetition (SRS)

Lightweight SM-2-style scheduler in `lib/srs`:

- Each `ReviewItem` (a concept, not necessarily a whole skill — e.g. "Python
  decorators", "SQL window functions") has an interval and ease factor.
- A Submission tied to a concept updates the matching ReviewItem: correct →
  interval grows (interval × ease); incorrect → interval resets short and
  the concept surfaces in the next Daily Forge / "Weak Skills" list.
- `ReviewSchedule` holds the per-user queue of items due today, computed on
  read (due date ≤ now), not pre-materialized.

## Daily Forge

Each day, generate a small set (5ish) mixing: one due SRS review, one fresh
exercise from the user's current lesson, one from a different in-progress
skill, one debugging challenge, one from a weak-skills list. Missing a day
does not reset streak progress — freezes absorb gaps (see Streak model).

## Diagnostic assessment

Adaptive-ish in the loose sense: presents a fixed bank of graded questions
per topic (Python, SQL, algorithms, math, Git/Linux, ML), stops a topic
early once confidence is high (e.g. 3 correct in a row at a level), and
writes a detected level per topic to `AssessmentAttempt`. The roadmap
generator (ROADMAP_SYSTEM.md) uses these to skip skills the user already
has and reorder the recommended sequence.
