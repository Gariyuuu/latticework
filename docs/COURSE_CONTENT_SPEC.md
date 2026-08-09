# Course Content Spec

## Directory shape

```
content/
  <skill-slug>/
    metadata.json     # required for every skill, built or skeleton
    modules/
      <module-slug>.mdx   # only present for fully-built skills
```

## `metadata.json` (every skill has this — required for the graph to exist)

```jsonc
{
  "slug": "python",
  "name": "Python",
  "category": "language", // language | web | database | ai-ml | data-science
                            // | quant | cs | devops | cloud | math | tooling
  "difficulty": "beginner", // intro | beginner | intermediate | advanced
  "estimatedHours": 14,
  "prerequisites": [],       // skill slugs
  "usefulFor": ["software-engineer", "data-scientist", "ml-engineer", "..."],
  "status": "built",         // "built" | "skeleton"
  "modules": [                // outline even for skeleton skills
    { "slug": "syntax", "title": "Syntax & Variables", "status": "built" },
    { "slug": "decorators", "title": "Decorators", "status": "planned" }
  ]
}
```

A "skeleton" skill has a complete, honest `metadata.json` (so it appears
correctly in the skill graph, Explore page, and roadmap) but no `.mdx`
module files yet — its detail page shows the outline with "Planned" module
badges instead of "Start Lesson" buttons.

## Lesson MDX frontmatter + block model

Each `.mdx` file under `modules/` is one Lesson. Frontmatter declares the
ordered block sequence; MDX body content is split into named sections that
correspond to the frontmatter blocks by `id`.

```yaml
---
slug: variables
title: Variables & Types
estimatedMinutes: 10
blocks:
  - id: intro
    type: explanation
  - id: try-it
    type: codeExample
    language: python
  - id: exercise-1
    type: exercise
    exerciseType: write-code
    testCasesId: variables-ex1
  - id: quiz-1
    type: quiz
---
```

Body uses matching MDX components, e.g.:

```mdx
<Explanation id="intro">
Python variables don't need a declared type...
</Explanation>

<CodeExample id="try-it" language="python">
x = 5
print(type(x))
</CodeExample>

<Exercise id="exercise-1" prompt="Write a function `is_even(n)` that returns True if n is even.">
</Exercise>

<Quiz id="quiz-1" question="What does type(5) return?" options={["int","str","5","float"]} answer={0} />
```

The lesson page renderer (`src/components/lesson/LessonRenderer.tsx`) maps
each block to the matching primitive component
(`<Explanation> <CodeExample> <Exercise> <Quiz> <Visualization> <Checkpoint>
<ProjectStep>`), tracks per-block completion locally, and posts progress on
block completion.

## Exercise test cases

Kept out of MDX (so answers aren't sitting in a client-fetchable content
file) in `content/<skill>/exercises/<testCasesId>.json`, loaded server-side
only, e.g.:

```jsonc
{
  "id": "variables-ex1",
  "type": "write-code",
  "language": "python",
  "starterCode": "def is_even(n):\n    ...\n",
  "cases": [
    { "call": "is_even(4)", "expect": "True" },
    { "call": "is_even(7)", "expect": "False" }
  ]
}
```

## Adding a new skill (checklist — also in README.md)

1. Add `content/<slug>/metadata.json` (skeleton is enough to appear in the
   graph/Explore/roadmap).
2. Optionally add `modules/*.mdx` + matching `exercises/*.json` to make it
   a "built" skill.
3. Run the content sync script (`npm run content:sync`) to upsert Skill/
   Course/Module/Lesson/Exercise rows into the DB from the parsed content
   tree — content authoring never means hand-writing SQL/DB rows.
4. If it belongs on a CareerTrack, add it to that track's skill list (data,
   not code) in `src/lib/roadmap/tracks.ts`.
