import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { courses, lessonProgress, lessons, modules, skills } from "@/lib/db/schema";
import { getLessonSource } from "@/lib/content/loader";
import { XP, awardXP } from "@/lib/scoring/xp";
import { recomputeSkillRating } from "@/lib/scoring/mastery";
import { recordActivity } from "@/lib/scoring/activity";

const bodySchema = z.object({
  skillSlug: z.string(),
  lessonSlug: z.string(),
  blockId: z.string(),
  hintsUsed: z.number().optional(),
  code: z.string().optional(),
});

/** Marks a lesson block complete for the authenticated user, awards the
 * small flat lesson-block XP, and rolls the lesson up to "completed" once
 * every block in it has been visited. See docs/LEARNING_ENGINE.md. */
export async function POST(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { skillSlug, lessonSlug, blockId } = parsed.data;

  const source = getLessonSource(skillSlug, lessonSlug);
  const totalBlocks = source?.frontmatter.blocks.length ?? null;

  const skill = await db.query.skills.findFirst({ where: eq(skills.slug, skillSlug) });
  if (!skill) return NextResponse.json({ xpAwarded: 0, synced: false });

  const course = await db.query.courses.findFirst({ where: eq(courses.skillId, skill.id) });
  if (!course) return NextResponse.json({ xpAwarded: 0, synced: false });

  const lessonRow = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(and(eq(modules.courseId, course.id), eq(lessons.slug, lessonSlug)))
    .limit(1);
  const lessonId = lessonRow[0]?.id;
  if (!lessonId) return NextResponse.json({ xpAwarded: 0, synced: false });

  const existing = await db.query.lessonProgress.findFirst({
    where: and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)),
  });
  const completedBlocks = Array.from(new Set([...(existing?.completedBlocks ?? []), blockId]));
  const isFullyComplete = totalBlocks !== null && completedBlocks.length >= totalBlocks;

  await db
    .insert(lessonProgress)
    .values({
      userId: user.id,
      lessonId,
      status: isFullyComplete ? "completed" : "in-progress",
      completedBlocks,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        status: isFullyComplete ? "completed" : "in-progress",
        completedBlocks,
        updatedAt: new Date(),
      },
    });

  let xpAwarded = 0;
  if (!existing?.completedBlocks?.includes(blockId)) {
    xpAwarded = await awardXP(user.id, XP.lessonBlock, "lesson-block", blockId);
  }

  await recomputeSkillRating(user.id, skill.id);
  await recordActivity(user.id, { minutesLearned: 1 });

  return NextResponse.json({ xpAwarded, lessonCompleted: isFullyComplete });
}
