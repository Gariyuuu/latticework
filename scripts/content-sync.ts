/**
 * Parses /content and upserts Skill → Course → Module → Lesson →
 * LessonBlock → Exercise → TestCase rows, plus CareerTrack/
 * CareerTrackSkill and the achievement catalog. See
 * docs/COURSE_CONTENT_SPEC.md. Content authoring never means hand-writing
 * SQL — this script is the only writer of content-derived DB rows.
 *
 * Content is parsed and validated regardless of whether DATABASE_URL is
 * set, so this doubles as `content:sync -- --dry-run`-style validation in
 * environments without a live database (it just skips the DB writes and
 * says so loudly, per docs/SECURITY.md's "never silently no-op" rule).
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import {
  skills,
  skillDependencies,
  courses,
  modules,
  lessons,
  lessonBlocks,
  exercises,
  testCases,
  careerTracks,
  careerTrackSkills,
  achievements,
  projects,
} from "../src/lib/db/schema";
import { listAllSkills, listLessonSlugs, getLessonSource, getExerciseTestCases } from "../src/lib/content/loader-core";
import { exerciseSlugFor } from "../src/lib/content/schema";
import { CAREER_TRACKS } from "../src/lib/roadmap/tracks";
import { ACHIEVEMENT_CATALOG } from "../src/lib/scoring/achievement-catalog";
import { PROJECT_CATALOG } from "../src/lib/projects/catalog";

const hasDb = Boolean(process.env.DATABASE_URL);

async function main() {
  const allSkills = listAllSkills();
  console.log(`[content-sync] parsed ${allSkills.length} skills from /content`);
  const built = allSkills.filter((s) => s.status === "built");
  console.log(`[content-sync] ${built.length} skill(s) marked "built": ${built.map((s) => s.slug).join(", ")}`);

  if (!hasDb) {
    console.warn(
      "[content-sync] DATABASE_URL is not set — content was parsed and validated but nothing was written. Set DATABASE_URL and re-run to seed the database."
    );
    return;
  }

  const skillIdBySlug = new Map<string, string>();

  for (const skill of allSkills) {
    const [row] = await db
      .insert(skills)
      .values({
        slug: skill.slug,
        name: skill.name,
        category: skill.category,
        difficulty: skill.difficulty,
        estimatedHours: skill.estimatedHours,
        status: skill.status,
        description: skill.description,
        usefulFor: skill.usefulFor,
      })
      .onConflictDoUpdate({
        target: skills.slug,
        set: {
          name: skill.name,
          category: skill.category,
          difficulty: skill.difficulty,
          estimatedHours: skill.estimatedHours,
          status: skill.status,
          description: skill.description,
          usefulFor: skill.usefulFor,
        },
      })
      .returning({ id: skills.id });
    skillIdBySlug.set(skill.slug, row.id);
  }

  for (const skill of allSkills) {
    const skillId = skillIdBySlug.get(skill.slug)!;
    for (const prereqSlug of skill.prerequisites) {
      const prereqId = skillIdBySlug.get(prereqSlug);
      if (!prereqId) {
        console.warn(`[content-sync] skipping unknown prerequisite "${prereqSlug}" for "${skill.slug}"`);
        continue;
      }
      await db
        .insert(skillDependencies)
        .values({ skillId, prerequisiteSkillId: prereqId })
        .onConflictDoNothing();
    }
  }

  for (const skill of built) {
    const skillId = skillIdBySlug.get(skill.slug)!;
    const [course] = await db
      .insert(courses)
      .values({ skillId, slug: skill.slug, title: skill.name, order: 0 })
      .onConflictDoUpdate({ target: courses.slug, set: { title: skill.name } })
      .returning({ id: courses.id });

    const lessonSlugs = listLessonSlugs(skill.slug);
    for (let i = 0; i < lessonSlugs.length; i++) {
      const lessonSlug = lessonSlugs[i];
      const source = getLessonSource(skill.slug, lessonSlug);
      if (!source) continue;

      // One Module per authored lesson file for now — see
      // docs/COURSE_CONTENT_SPEC.md note on the flat modules/*.mdx layout.
      const [moduleRow] = await db
        .insert(modules)
        .values({
          courseId: course.id,
          slug: lessonSlug,
          title: source.frontmatter.title,
          order: i,
          status: "built",
        })
        .onConflictDoUpdate({
          target: [modules.courseId, modules.slug],
          set: { title: source.frontmatter.title, status: "built" },
        })
        .returning({ id: modules.id });

      const [lessonRow] = await db
        .insert(lessons)
        .values({
          moduleId: moduleRow.id,
          slug: source.frontmatter.slug,
          title: source.frontmatter.title,
          contentPath: `${skill.slug}/modules/${lessonSlug}.mdx`,
          estimatedMinutes: source.frontmatter.estimatedMinutes,
          order: i,
        })
        .onConflictDoUpdate({
          target: [lessons.moduleId, lessons.slug],
          set: { title: source.frontmatter.title, estimatedMinutes: source.frontmatter.estimatedMinutes },
        })
        .returning({ id: lessons.id });

      for (let b = 0; b < source.frontmatter.blocks.length; b++) {
        const block = source.frontmatter.blocks[b];
        const [blockRow] = await db
          .insert(lessonBlocks)
          .values({ lessonId: lessonRow.id, blockKey: block.id, type: block.type, order: b })
          .onConflictDoUpdate({
            target: [lessonBlocks.lessonId, lessonBlocks.blockKey],
            set: { type: block.type, order: b },
          })
          .returning({ id: lessonBlocks.id });

        if (block.type === "exercise" && block.testCasesId) {
          const testCaseFile = getExerciseTestCases(skill.slug, block.testCasesId);
          if (!testCaseFile) {
            console.warn(`[content-sync] missing exercise test cases "${block.testCasesId}" for ${skill.slug}/${lessonSlug}`);
            continue;
          }
          const slug = exerciseSlugFor(skill.slug, lessonSlug, block.id);
          const [exerciseRow] = await db
            .insert(exercises)
            .values({
              lessonBlockId: blockRow.id,
              slug,
              type: block.exerciseType ?? "write-code",
              language: testCaseFile.language,
              prompt: block.prompt ?? "",
              starterCode: testCaseFile.starterCode,
              difficulty: block.difficulty,
              concept: block.concept,
            })
            .onConflictDoUpdate({
              target: exercises.slug,
              set: {
                prompt: block.prompt ?? "",
                starterCode: testCaseFile.starterCode,
                difficulty: block.difficulty,
                concept: block.concept,
              },
            })
            .returning({ id: exercises.id });

          await db.delete(testCases).where(eq(testCases.exerciseId, exerciseRow.id));
          for (let c = 0; c < testCaseFile.cases.length; c++) {
            await db.insert(testCases).values({
              exerciseId: exerciseRow.id,
              call: testCaseFile.cases[c].call,
              expect: testCaseFile.cases[c].expect,
              order: c,
            });
          }
        }

        if (block.type === "quiz") {
          const slug = exerciseSlugFor(skill.slug, lessonSlug, block.id);
          const [exerciseRow] = await db
            .insert(exercises)
            .values({
              lessonBlockId: blockRow.id,
              slug,
              type: "multiple-choice",
              prompt: block.question ?? "",
              difficulty: block.difficulty,
              concept: block.concept,
            })
            .onConflictDoUpdate({
              target: exercises.slug,
              set: { prompt: block.question ?? "", difficulty: block.difficulty, concept: block.concept },
            })
            .returning({ id: exercises.id });

          await db.delete(testCases).where(eq(testCases.exerciseId, exerciseRow.id));
          await db.insert(testCases).values({ exerciseId: exerciseRow.id, optionIndex: block.answer, order: 0 });
        }
      }
    }
  }

  for (const track of CAREER_TRACKS) {
    const [trackRow] = await db
      .insert(careerTracks)
      .values({ slug: track.slug, name: track.name, description: track.description })
      .onConflictDoUpdate({ target: careerTracks.slug, set: { name: track.name, description: track.description } })
      .returning({ id: careerTracks.id });

    for (const entry of track.skills) {
      const skillId = skillIdBySlug.get(entry.slug);
      if (!skillId) {
        console.warn(`[content-sync] career track "${track.slug}" references unknown skill "${entry.slug}"`);
        continue;
      }
      await db
        .insert(careerTrackSkills)
        .values({
          careerTrackId: trackRow.id,
          skillId,
          stage: entry.stage,
          importance: entry.importance,
          order: entry.order,
        })
        .onConflictDoUpdate({
          target: [careerTrackSkills.careerTrackId, careerTrackSkills.skillId],
          set: { stage: entry.stage, importance: entry.importance, order: entry.order },
        });
    }
  }

  for (const p of PROJECT_CATALOG) {
    const skillId = skillIdBySlug.get(p.skillSlug);
    await db
      .insert(projects)
      .values({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        skillId,
        overview: p.overview,
        requirements: p.requirements,
        milestones: p.milestones.map((title, i) => ({ id: `m${i}`, title })),
        stretchGoals: p.stretchGoals,
      })
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          title: p.title,
          difficulty: p.difficulty,
          skillId,
          overview: p.overview,
          requirements: p.requirements,
          milestones: p.milestones.map((title, i) => ({ id: `m${i}`, title })),
          stretchGoals: p.stretchGoals,
        },
      });
  }

  for (const a of ACHIEVEMENT_CATALOG) {
    await db
      .insert(achievements)
      .values(a)
      .onConflictDoUpdate({ target: achievements.slug, set: { title: a.title, description: a.description, hidden: a.hidden } });
  }

  console.log("[content-sync] done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[content-sync] failed:", err);
    process.exit(1);
  });
