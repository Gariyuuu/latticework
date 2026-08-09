import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  courses,
  exercises,
  lessonBlocks,
  lessonProgress,
  lessons,
  modules,
  projectProgress,
  projects,
  reviewItems,
  skillRatings,
  submissions,
} from "@/lib/db/schema";

// Weights from docs/LEARNING_ENGINE.md "Mastery / skill rating" — kept here
// as the single source of truth the formula actually runs against.
const WEIGHTS = {
  lesson: 0.15,
  accuracy: 0.25,
  assessment: 0.25,
  project: 0.2,
  retention: 0.15,
};

function ratingFromScore(score: number): number {
  if (score <= 0) return 0;
  if (score <= 0.15) return 1;
  if (score <= 0.35) return 2;
  if (score <= 0.55) return 3;
  if (score <= 0.75) return 4;
  if (score <= 0.9) return 5;
  return 6;
}

export async function resolveSkillIdForExercise(exerciseId: string): Promise<string | null> {
  const row = await db
    .select({ skillId: courses.skillId })
    .from(exercises)
    .innerJoin(lessonBlocks, eq(exercises.lessonBlockId, lessonBlocks.id))
    .innerJoin(lessons, eq(lessonBlocks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(exercises.id, exerciseId))
    .limit(1);
  return row[0]?.skillId ?? null;
}

export async function resolveSkillIdForLesson(lessonId: string): Promise<string | null> {
  const row = await db
    .select({ skillId: courses.skillId })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return row[0]?.skillId ?? null;
}

export async function recomputeSkillRating(userId: string, skillId: string) {
  // Lesson completion: fraction of lessons in this skill's courses the user
  // has marked completed.
  const lessonRows = await db
    .select({ lessonId: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(courses.skillId, skillId));
  const totalLessons = lessonRows.length;
  let completedLessons = 0;
  if (totalLessons > 0) {
    const lessonIds = lessonRows.map((r) => r.lessonId);
    const progressRows = await db.query.lessonProgress.findMany({
      where: and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds)),
    });
    completedLessons = progressRows.filter((p) => p.status === "completed").length;
  }
  const lessonScore = totalLessons > 0 ? completedLessons / totalLessons : 0;

  // Accuracy: pass rate across submissions for exercises in this skill.
  const skillExerciseRows = await db
    .select({ exerciseId: exercises.id })
    .from(exercises)
    .innerJoin(lessonBlocks, eq(exercises.lessonBlockId, lessonBlocks.id))
    .innerJoin(lessons, eq(lessonBlocks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(courses.skillId, skillId));
  let accuracyScore = 0;
  if (skillExerciseRows.length > 0) {
    const exerciseIds = skillExerciseRows.map((r) => r.exerciseId);
    const subRows = await db.query.submissions.findMany({
      where: and(eq(submissions.userId, userId), inArray(submissions.exerciseId, exerciseIds)),
    });
    if (subRows.length > 0) {
      accuracyScore = subRows.filter((s) => s.passed).length / subRows.length;
    }
  }

  // Assessment: latest diagnostic-detected level isn't wired per-skill in
  // MVP assessment content yet — defaults to 0 until an assessment attempt
  // reports this skill's slug in detectedLevels (see LEARNING_ENGINE.md).
  const assessmentScore = 0;

  // Project: average completion percent across this skill's projects.
  const skillProjects = await db.query.projects.findMany({ where: eq(projects.skillId, skillId) });
  let projectScore = 0;
  if (skillProjects.length > 0) {
    const projectIds = skillProjects.map((p) => p.id);
    const progressRows = await db.query.projectProgress.findMany({
      where: and(eq(projectProgress.userId, userId), inArray(projectProgress.projectId, projectIds)),
    });
    const completions = skillProjects.map((p) => {
      const row = progressRows.find((r) => r.projectId === p.id);
      const milestoneCount = p.milestones?.length ?? 0;
      if (!row || milestoneCount === 0) return 0;
      return (row.completedMilestones?.length ?? 0) / milestoneCount;
    });
    projectScore = completions.reduce((a, b) => a + b, 0) / skillProjects.length;
  }

  // Retention: average SRS strength (consecutive-correct, capped) across
  // reviewed concepts tagged with this skill's slug prefix.
  const allReviewItems = await db.query.reviewItems.findMany({ where: eq(reviewItems.userId, userId) });
  const skillSlugRow = await db.query.skills.findFirst({ where: (s, { eq: e }) => e(s.id, skillId) });
  const relevantReviews = skillSlugRow
    ? allReviewItems.filter((r) => r.concept.startsWith(skillSlugRow.slug))
    : [];
  const retentionScore =
    relevantReviews.length > 0
      ? relevantReviews.reduce((sum, r) => sum + Math.min(r.consecutiveCorrect, 5) / 5, 0) /
        relevantReviews.length
      : 0;

  const weightedScore =
    lessonScore * WEIGHTS.lesson +
    accuracyScore * WEIGHTS.accuracy +
    assessmentScore * WEIGHTS.assessment +
    projectScore * WEIGHTS.project +
    retentionScore * WEIGHTS.retention;

  const rating = ratingFromScore(weightedScore);

  await db
    .insert(skillRatings)
    .values({
      userId,
      skillId,
      rating,
      lessonScore,
      accuracyScore,
      assessmentScore,
      projectScore,
      retentionScore,
    })
    .onConflictDoUpdate({
      target: [skillRatings.userId, skillRatings.skillId],
      set: { rating, lessonScore, accuracyScore, assessmentScore, projectScore, retentionScore, updatedAt: new Date() },
    });

  return rating;
}
