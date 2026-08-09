import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { exercises, hintUsage, submissions } from "@/lib/db/schema";
import { computeExerciseXP, awardXP } from "@/lib/scoring/xp";
import { recomputeSkillRating, resolveSkillIdForExercise } from "@/lib/scoring/mastery";
import { recordActivity } from "@/lib/scoring/activity";
import { recordReviewOutcome } from "@/lib/srs";
import { checkSubmissionAchievements } from "@/lib/scoring/achievements";

const bodySchema = z.object({
  exerciseSlug: z.string(),
  passed: z.boolean(),
  timeSpentSeconds: z.number().optional(),
  code: z.string().optional(),
});

/** Records an exercise/quiz attempt and — on a pass — awards XP, recomputes
 * the skill's mastery rating, updates the SRS review schedule, and checks
 * achievements. Difficulty and hint count are read from the database, never
 * trusted from the client request body (see docs/SECURITY.md). */
export async function POST(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { exerciseSlug, passed, timeSpentSeconds, code } = parsed.data;

  const exercise = await db.query.exercises.findFirst({ where: eq(exercises.slug, exerciseSlug) });
  if (!exercise) return NextResponse.json({ xpAwarded: 0, synced: false });

  const hintRows = await db.query.hintUsage.findMany({
    where: and(eq(hintUsage.userId, user.id), eq(hintUsage.exerciseId, exercise.id)),
  });
  const hintsUsed = hintRows.length;

  await db.insert(submissions).values({
    userId: user.id,
    exerciseId: exercise.id,
    passed,
    hintsUsed,
    timeSpentSeconds: timeSpentSeconds ?? 0,
    code,
  });

  let xpAwarded = 0;
  let newAchievements: { title: string; description: string }[] = [];
  if (passed) {
    xpAwarded = await awardXP(
      user.id,
      computeExerciseXP(exercise.difficulty, hintsUsed),
      "exercise",
      exercise.id
    );
    if (exercise.concept) await recordReviewOutcome(user.id, exercise.concept, true);
    await recordActivity(user.id, { exercisesCompleted: 1 });
    newAchievements = await checkSubmissionAchievements(user.id);
  } else if (exercise.concept) {
    await recordReviewOutcome(user.id, exercise.concept, false);
  }

  const skillId = await resolveSkillIdForExercise(exercise.id);
  if (skillId) await recomputeSkillRating(user.id, skillId);

  return NextResponse.json({ xpAwarded, newAchievements });
}
